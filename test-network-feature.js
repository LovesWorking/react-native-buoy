// Test file to verify network feature is working correctly
// Add this to your React Native app to test

import { startNetworkListener, stopNetworkListener } from './src/_sections/network';

// Test network capture
export function testNetworkFeature() {
  console.log('Testing Network Feature...');
  
  // The listener should already be started by the hook
  // Make some test requests
  
  // Test 1: Simple GET request
  fetch('https://jsonplaceholder.typicode.com/posts/1')
    .then(response => response.json())
    .then(data => console.log('Test GET successful:', data.id))
    .catch(err => console.error('Test GET failed:', err));
  
  // Test 2: POST request
  fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Test Post',
      body: 'Testing network capture',
      userId: 1,
    }),
  })
    .then(response => response.json())
    .then(data => console.log('Test POST successful:', data.id))
    .catch(err => console.error('Test POST failed:', err));
  
  // Test 3: Error request (404)
  fetch('https://jsonplaceholder.typicode.com/posts/999999')
    .then(response => {
      if (!response.ok) {
        console.log('Test 404 successful: Got expected error status', response.status);
      }
      return response.json();
    })
    .catch(err => console.log('Test 404 handled correctly'));
  
  console.log('Network tests initiated. Check the Network Monitor in dev tools.');
}

// Instructions:
// 1. Import this function in your app
// 2. Call testNetworkFeature() after app loads
// 3. Open the dev tools floating bubble
// 4. Navigate to Network Monitor
// 5. You should see the test requests appear
// 6. Verify:
//    - Requests show correct method (GET, POST)
//    - Status codes are captured
//    - Response times are shown
//    - Request/response sizes are displayed
//    - No Metro bundler requests are shown (symbolicate, etc.)