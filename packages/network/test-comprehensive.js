/**
 * Comprehensive test for network interceptor
 * Verifies that the interceptor is 100% transparent and doesn't modify:
 * - Query parameters
 * - Request headers
 * - Request body
 * - Response data
 * - Response headers
 *
 * Run with: node test-comprehensive.js
 */

// Set React Native environment variables
global.__DEV__ = true;

// Polyfill fetch if needed
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

// Mock XMLHttpRequest for Node.js
class MockXMLHttpRequest {
  constructor() {
    this.readyState = 0;
    this.status = 0;
    this.responseHeaders = null;
    this.response = null;
    this._listeners = {};
  }

  open(method, url) {
    this._method = method;
    this._url = url;
    this.readyState = 1;
  }

  setRequestHeader(header, value) {
    if (!this._headers) this._headers = {};
    this._headers[header] = value;
  }

  send(data) {
    this._data = data;
    // Simulate async request
    setTimeout(() => {
      this.readyState = 4;
      this.status = 200;
      this.response = JSON.stringify({ test: 'data' });
      this.dispatchEvent({ type: 'load' });
    }, 100);
  }

  addEventListener(type, listener) {
    if (!this._listeners[type]) {
      this._listeners[type] = [];
    }
    this._listeners[type].push(listener);
  }

  dispatchEvent(event) {
    const listeners = this._listeners[event.type] || [];
    listeners.forEach(listener => listener.call(this, event));
  }

  abort() {
    this.dispatchEvent({ type: 'abort' });
  }
}

global.XMLHttpRequest = MockXMLHttpRequest;

// Import the network listener
const networkListener = require('./lib/commonjs/network/utils/networkListener');

console.log('🧪 Comprehensive Network Interceptor Test\n');
console.log('Testing that interceptor is 100% transparent');
console.log('=' .repeat(60));
console.log('\n');

// Test 1: Query Parameters
async function testQueryParameters() {
  console.log('Test 1: Query Parameters Preservation');
  console.log('=' .repeat(60));

  const capturedEvents = [];
  const unsubscribe = networkListener.addNetworkListener((event) => {
    capturedEvents.push(event);
  });

  networkListener.startNetworkListener();

  try {
    // Make request with complex query params
    const url = 'https://httpbin.org/get?search=pikachu&timestamp=1234567890&filter=name&filter=type&special_char=%20%26%3D';
    console.log(`\n📤 Making request to: ${url}\n`);

    const response = await fetch(url);
    const data = await response.json();

    console.log('✅ Response received');
    console.log(`   URL in response: ${data.url}`);

    // Verify query params were preserved
    const receivedUrl = new URL(data.url);
    const params = receivedUrl.searchParams;

    console.log('\n🔍 Checking query parameters:');
    const checks = [
      { name: 'search', expected: 'pikachu', actual: params.get('search') },
      { name: 'timestamp', expected: '1234567890', actual: params.get('timestamp') },
      { name: 'special_char', expected: ' &=', actual: params.get('special_char') }
    ];

    let allPassed = true;
    checks.forEach(check => {
      const passed = check.actual === check.expected;
      allPassed = allPassed && passed;
      console.log(`   ${passed ? '✅' : '❌'} ${check.name}: "${check.actual}" ${passed ? '===' : '!=='} "${check.expected}"`);
    });

    // Check filter param (appears twice)
    const filters = params.getAll('filter');
    const filterPassed = filters.length === 2 && filters.includes('name') && filters.includes('type');
    console.log(`   ${filterPassed ? '✅' : '❌'} filter (array): [${filters.join(', ')}] ${filterPassed ? '===' : '!=='} [name, type]`);
    allPassed = allPassed && filterPassed;

    // Wait for events to be processed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify events captured the full URL with params
    const requestEvent = capturedEvents.find(e => e.type === 'request');
    if (requestEvent && requestEvent.request.params) {
      console.log('\n📡 Event captured query params:');
      console.log(`   ${JSON.stringify(requestEvent.request.params, null, 2)}`);
    }

    if (allPassed) {
      console.log('\n✅ Test 1 PASSED: Query parameters preserved correctly');
    } else {
      console.log('\n❌ Test 1 FAILED: Query parameters were modified');
    }

  } catch (error) {
    console.log(`\n❌ Test 1 FAILED: ${error.message}`);
    console.log(error.stack);
  } finally {
    unsubscribe();
    networkListener.stopNetworkListener();
  }

  console.log('\n');
}

// Test 2: POST Request with Body
async function testPostWithBody() {
  console.log('Test 2: POST Request Body Preservation');
  console.log('=' .repeat(60));

  const capturedEvents = [];
  const unsubscribe = networkListener.addNetworkListener((event) => {
    capturedEvents.push(event);
  });

  networkListener.startNetworkListener();

  try {
    const requestBody = {
      name: 'Pikachu',
      type: ['electric'],
      stats: {
        hp: 35,
        attack: 55,
        defense: 40
      },
      abilities: ['Static', 'Lightning Rod'],
      specialChars: 'Test & = ? #',
      unicode: '⚡️🔥💧'
    };

    console.log('\n📤 Making POST request with body:');
    console.log(JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'test-value',
        'X-Special-Chars': 'value with spaces & symbols = ?'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    console.log('\n✅ Response received');

    // Verify body was preserved
    console.log('\n🔍 Checking request body preservation:');
    const receivedBody = JSON.parse(data.data);

    const bodyChecks = [
      { path: 'name', expected: requestBody.name, actual: receivedBody.name },
      { path: 'type[0]', expected: requestBody.type[0], actual: receivedBody.type[0] },
      { path: 'stats.hp', expected: requestBody.stats.hp, actual: receivedBody.stats.hp },
      { path: 'abilities[1]', expected: requestBody.abilities[1], actual: receivedBody.abilities[1] },
      { path: 'specialChars', expected: requestBody.specialChars, actual: receivedBody.specialChars },
      { path: 'unicode', expected: requestBody.unicode, actual: receivedBody.unicode }
    ];

    let allPassed = true;
    bodyChecks.forEach(check => {
      const passed = check.actual === check.expected;
      allPassed = allPassed && passed;
      console.log(`   ${passed ? '✅' : '❌'} ${check.path}: "${check.actual}" ${passed ? '===' : '!=='} "${check.expected}"`);
    });

    // Verify headers were preserved
    console.log('\n🔍 Checking request headers preservation:');
    const headerChecks = [
      { name: 'Content-Type', expected: 'application/json', actual: data.headers['Content-Type'] },
      { name: 'X-Custom-Header', expected: 'test-value', actual: data.headers['X-Custom-Header'] },
      { name: 'X-Special-Chars', expected: 'value with spaces & symbols = ?', actual: data.headers['X-Special-Chars'] }
    ];

    headerChecks.forEach(check => {
      const passed = check.actual === check.expected;
      allPassed = allPassed && passed;
      console.log(`   ${passed ? '✅' : '❌'} ${check.name}: "${check.actual}" ${passed ? '===' : '!=='} "${check.expected}"`);
    });

    // Wait for events
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify event captured the body
    const requestEvent = capturedEvents.find(e => e.type === 'request');
    if (requestEvent && requestEvent.request.data) {
      console.log('\n📡 Event captured request body:');
      console.log(`   ${JSON.stringify(requestEvent.request.data, null, 2)}`);
    }

    if (allPassed) {
      console.log('\n✅ Test 2 PASSED: POST body and headers preserved correctly');
    } else {
      console.log('\n❌ Test 2 FAILED: POST body or headers were modified');
    }

  } catch (error) {
    console.log(`\n❌ Test 2 FAILED: ${error.message}`);
    console.log(error.stack);
  } finally {
    unsubscribe();
    networkListener.stopNetworkListener();
  }

  console.log('\n');
}

// Test 3: Response Data Integrity
async function testResponseIntegrity() {
  console.log('Test 3: Response Data Integrity');
  console.log('=' .repeat(60));

  const capturedEvents = [];
  const unsubscribe = networkListener.addNetworkListener((event) => {
    capturedEvents.push(event);
  });

  networkListener.startNetworkListener();

  try {
    console.log('\n📤 Making request to Pokemon API...\n');

    const response = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu');

    // Clone response to read it multiple times
    const clone1 = response.clone();
    const clone2 = response.clone();

    // Read as text first to check exact bytes
    const text1 = await clone1.text();
    const text2 = await clone2.text();

    console.log('✅ Response received');
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);

    // Verify we can read response multiple times (not consumed by interceptor)
    console.log('\n🔍 Checking response can be read multiple times:');
    const textMatch = text1 === text2;
    console.log(`   ${textMatch ? '✅' : '❌'} Text reads match: ${textMatch}`);

    // Parse the data
    const data = JSON.parse(text1);

    // Verify critical data fields
    console.log('\n🔍 Checking response data integrity:');
    const dataChecks = [
      { field: 'name', expected: 'pikachu', actual: data.name },
      { field: 'id', expected: 25, actual: data.id },
      { field: 'base_experience', expected: 112, actual: data.base_experience },
      { field: 'types[0].type.name', expected: 'electric', actual: data.types[0]?.type?.name }
    ];

    let allPassed = textMatch;
    dataChecks.forEach(check => {
      const passed = check.actual === check.expected;
      allPassed = allPassed && passed;
      console.log(`   ${passed ? '✅' : '❌'} ${check.field}: ${JSON.stringify(check.actual)} ${passed ? '===' : '!=='} ${JSON.stringify(check.expected)}`);
    });

    // Verify response headers
    console.log('\n🔍 Checking response headers:');
    const headerPresent = response.headers.get('content-type') !== null;
    console.log(`   ${headerPresent ? '✅' : '❌'} Headers accessible: ${headerPresent}`);

    // Wait for events
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify event captured response
    const responseEvent = capturedEvents.find(e => e.type === 'response');
    if (responseEvent && responseEvent.response) {
      console.log('\n📡 Event captured response:');
      console.log(`   Status: ${responseEvent.response.status}`);
      console.log(`   Body present: ${responseEvent.response.body ? 'Yes' : 'No'}`);
      console.log(`   Body matches: ${responseEvent.response.body?.name === data.name ? 'Yes' : 'No'}`);
    }

    if (allPassed && headerPresent) {
      console.log('\n✅ Test 3 PASSED: Response data and headers intact');
    } else {
      console.log('\n❌ Test 3 FAILED: Response was modified');
    }

  } catch (error) {
    console.log(`\n❌ Test 3 FAILED: ${error.message}`);
    console.log(error.stack);
  } finally {
    unsubscribe();
    networkListener.stopNetworkListener();
  }

  console.log('\n');
}

// Test 4: Complex URL with all features
async function testComplexUrl() {
  console.log('Test 4: Complex URL with Auth, Query Params, Fragment');
  console.log('=' .repeat(60));

  const capturedEvents = [];
  const unsubscribe = networkListener.addNetworkListener((event) => {
    capturedEvents.push(event);
  });

  networkListener.startNetworkListener();

  try {
    // Complex URL with everything
    const url = 'https://httpbin.org/get?search=arbok&limit=10&offset=20&filter[]=name&filter[]=type&sort=-created_at&include=stats,abilities';

    console.log(`\n📤 Making request with complex query params:\n   ${url}\n`);

    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer fake-token-12345',
        'Accept': 'application/json',
        'X-Request-ID': 'test-123-456',
        'X-Array-Header': 'value1, value2, value3'
      }
    });

    const data = await response.json();

    console.log('✅ Response received');

    // Parse received URL
    const receivedUrl = new URL(data.url);
    const params = receivedUrl.searchParams;

    console.log('\n🔍 Checking complex query parameters:');
    const checks = [
      { name: 'search', expected: 'arbok', actual: params.get('search') },
      { name: 'limit', expected: '10', actual: params.get('limit') },
      { name: 'offset', expected: '20', actual: params.get('offset') },
      { name: 'sort', expected: '-created_at', actual: params.get('sort') },
      { name: 'include', expected: 'stats,abilities', actual: params.get('include') }
    ];

    let allPassed = true;
    checks.forEach(check => {
      const passed = check.actual === check.expected;
      allPassed = allPassed && passed;
      console.log(`   ${passed ? '✅' : '❌'} ${check.name}: "${check.actual}" ${passed ? '===' : '!=='} "${check.expected}"`);
    });

    // Check array param
    const filters = params.getAll('filter[]');
    const filterPassed = filters.length === 2 && filters.includes('name') && filters.includes('type');
    console.log(`   ${filterPassed ? '✅' : '❌'} filter[] (array): [${filters.join(', ')}]`);
    allPassed = allPassed && filterPassed;

    // Check headers
    console.log('\n🔍 Checking headers:');
    const headerChecks = [
      { name: 'Authorization', expected: 'Bearer fake-token-12345', actual: data.headers['Authorization'] },
      { name: 'Accept', expected: 'application/json', actual: data.headers['Accept'] },
      { name: 'X-Request-ID', expected: 'test-123-456', actual: data.headers['X-Request-Id'] },
      { name: 'X-Array-Header', expected: 'value1, value2, value3', actual: data.headers['X-Array-Header'] }
    ];

    headerChecks.forEach(check => {
      const passed = check.actual === check.expected;
      allPassed = allPassed && passed;
      console.log(`   ${passed ? '✅' : '❌'} ${check.name}: "${check.actual}"`);
    });

    if (allPassed) {
      console.log('\n✅ Test 4 PASSED: Complex URL and headers preserved');
    } else {
      console.log('\n❌ Test 4 FAILED: Complex URL or headers were modified');
    }

  } catch (error) {
    console.log(`\n❌ Test 4 FAILED: ${error.message}`);
    console.log(error.stack);
  } finally {
    unsubscribe();
    networkListener.stopNetworkListener();
  }

  console.log('\n');
}

// Test 5: Binary data / non-JSON responses
async function testBinaryData() {
  console.log('Test 5: Binary Data / Image Response');
  console.log('=' .repeat(60));

  const capturedEvents = [];
  const unsubscribe = networkListener.addNetworkListener((event) => {
    capturedEvents.push(event);
  });

  networkListener.startNetworkListener();

  try {
    console.log('\n📤 Fetching image from Pokemon API...\n');

    const response = await fetch('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png');

    console.log('✅ Response received');
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);

    // Read as buffer
    const buffer = await response.arrayBuffer();

    console.log('\n🔍 Checking binary data:');
    console.log(`   ${buffer.byteLength > 0 ? '✅' : '❌'} Buffer size: ${buffer.byteLength} bytes`);

    // Verify PNG signature (first 8 bytes)
    const view = new Uint8Array(buffer);
    const isPng = view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4E && view[3] === 0x47;
    console.log(`   ${isPng ? '✅' : '❌'} PNG signature valid: ${isPng}`);

    if (buffer.byteLength > 0 && isPng) {
      console.log('\n✅ Test 5 PASSED: Binary data preserved correctly');
    } else {
      console.log('\n❌ Test 5 FAILED: Binary data was corrupted');
    }

  } catch (error) {
    console.log(`\n❌ Test 5 FAILED: ${error.message}`);
    console.log(error.stack);
  } finally {
    unsubscribe();
    networkListener.stopNetworkListener();
  }

  console.log('\n');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running Comprehensive Network Interceptor Tests\n');
  console.log('Goal: Verify interceptor is 100% transparent');
  console.log('      - Does NOT modify query parameters');
  console.log('      - Does NOT modify request headers');
  console.log('      - Does NOT modify request body');
  console.log('      - Does NOT modify response data');
  console.log('      - Does NOT consume response streams');
  console.log('\n');

  await testQueryParameters();
  console.log('=' .repeat(60));
  console.log('\n');

  await testPostWithBody();
  console.log('=' .repeat(60));
  console.log('\n');

  await testResponseIntegrity();
  console.log('=' .repeat(60));
  console.log('\n');

  await testComplexUrl();
  console.log('=' .repeat(60));
  console.log('\n');

  await testBinaryData();
  console.log('=' .repeat(60));
  console.log('\n');

  console.log('✨ All comprehensive tests completed!\n');
  console.log('If all tests passed, the interceptor is 100% transparent');
  console.log('and only listens to network events without any modification.\n');
}

runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
