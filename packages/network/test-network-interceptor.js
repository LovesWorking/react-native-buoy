/**
 * Manual test script for network interceptor
 * Run with: node test-network-interceptor.js
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

console.log('🧪 Testing Network Interceptor\n');

// Test 1: Fetch interceptor
async function testFetchInterceptor() {
  console.log('Test 1: Fetch Interceptor');
  console.log('========================');

  let requestCaptured = false;
  let responseCaptured = false;
  let errorOccurred = false;

  // Add listener
  const unsubscribe = networkListener.addNetworkListener((event) => {
    console.log(`📡 Event: ${event.type} - ${event.request.url}`);

    if (event.type === 'request') {
      requestCaptured = true;
    } else if (event.type === 'response') {
      responseCaptured = true;
    } else if (event.type === 'error') {
      errorOccurred = true;
      console.log(`❌ Error: ${event.error?.message}`);
    }
  });

  // Start listening
  networkListener.startNetworkListener();
  console.log('✅ Network listener started\n');

  try {
    console.log('Making fetch request to httpbin.org...');
    const response = await fetch('https://httpbin.org/get');
    const data = await response.json();

    console.log(`✅ Fetch succeeded: ${response.status} ${response.statusText}`);
    console.log(`✅ Response received: ${JSON.stringify(data).substring(0, 100)}...\n`);

    // Verify the request worked
    if (response.ok) {
      console.log('✅ Test 1 PASSED: Fetch request worked correctly');
    } else {
      console.log('❌ Test 1 FAILED: Fetch request failed');
    }

    // Verify events were captured
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for events

    if (requestCaptured && responseCaptured) {
      console.log('✅ Test 1 PASSED: Events were captured correctly');
    } else {
      console.log('❌ Test 1 FAILED: Events were not captured');
      console.log(`  Request captured: ${requestCaptured}`);
      console.log(`  Response captured: ${responseCaptured}`);
    }
  } catch (error) {
    console.log(`❌ Test 1 FAILED: Fetch threw error: ${error.message}`);
    console.log(error.stack);
  }

  unsubscribe();
  networkListener.stopNetworkListener();
  console.log('\n');
}

// Test 2: XMLHttpRequest interceptor
async function testXHRInterceptor() {
  console.log('Test 2: XMLHttpRequest Interceptor');
  console.log('===================================');

  let requestCaptured = false;
  let responseCaptured = false;

  // Add listener
  const unsubscribe = networkListener.addNetworkListener((event) => {
    console.log(`📡 Event: ${event.type} - ${event.request.url}`);

    if (event.type === 'request') {
      requestCaptured = true;
    } else if (event.type === 'response') {
      responseCaptured = true;
    }
  });

  // Start listening
  networkListener.startNetworkListener();
  console.log('✅ Network listener started\n');

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.addEventListener('load', function() {
      console.log(`✅ XHR load event fired: ${this.status}`);
      console.log(`✅ XHR response: ${this.response}\n`);

      if (this.status === 200) {
        console.log('✅ Test 2 PASSED: XHR request worked correctly');
      } else {
        console.log('❌ Test 2 FAILED: XHR request failed');
      }

      setTimeout(() => {
        if (requestCaptured && responseCaptured) {
          console.log('✅ Test 2 PASSED: Events were captured correctly');
        } else {
          console.log('❌ Test 2 FAILED: Events were not captured');
          console.log(`  Request captured: ${requestCaptured}`);
          console.log(`  Response captured: ${responseCaptured}`);
        }

        unsubscribe();
        networkListener.stopNetworkListener();
        resolve();
      }, 100);
    });

    xhr.addEventListener('error', function() {
      console.log('❌ Test 2 FAILED: XHR error event fired');
      unsubscribe();
      networkListener.stopNetworkListener();
      resolve();
    });

    console.log('Making XHR request...');
    xhr.open('GET', 'http://localhost:3000/test');
    xhr.send();
  });
}

// Test 3: Verify fetch still works after interception
async function testFetchStillWorks() {
  console.log('\nTest 3: Verify Fetch Works With Interception');
  console.log('============================================');

  networkListener.startNetworkListener();

  try {
    // Test with a real Pokemon API call
    console.log('Making request to Pokemon API...');
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu');

    if (!response.ok) {
      console.log(`❌ Test 3 FAILED: Response not OK: ${response.status}`);
      return;
    }

    const data = await response.json();

    if (data && data.name === 'pikachu') {
      console.log('✅ Test 3 PASSED: Pokemon API request worked!');
      console.log(`   Retrieved: ${data.name} (ID: ${data.id})`);
    } else {
      console.log('❌ Test 3 FAILED: Invalid response data');
    }
  } catch (error) {
    console.log(`❌ Test 3 FAILED: ${error.message}`);
    console.log('   Stack:', error.stack);
  } finally {
    networkListener.stopNetworkListener();
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Network Interceptor Tests\n');
  console.log('=' .repeat(50));
  console.log('\n');

  await testFetchInterceptor();
  console.log('=' .repeat(50));
  console.log('\n');

  await testXHRInterceptor();
  console.log('=' .repeat(50));

  await testFetchStillWorks();
  console.log('\n');
  console.log('=' .repeat(50));
  console.log('\n✨ All tests completed!\n');
}

runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
