// Test script to verify network interceptor is working
// Run this in your React Native app console

import { networkInterceptor, networkEventStore } from './src/_sections/network';

// Enable the interceptor
networkInterceptor.enable();

// Test 1: Simple GET request
console.log('Test 1: Making GET request...');
fetch('https://jsonplaceholder.typicode.com/posts/1')
  .then(response => response.json())
  .then(data => {
    console.log('GET Response received:', data);
    
    // Check the store
    setTimeout(() => {
      const events = networkEventStore.getEvents();
      const getEvent = events.find(e => e.method === 'GET');
      console.log('GET Event in store:', getEvent);
      console.log('Response size:', getEvent?.responseSize);
      console.log('Has response data:', !!getEvent?.responseData);
    }, 1000);
  });

// Test 2: POST request with JSON body
setTimeout(() => {
  console.log('\nTest 2: Making POST request...');
  fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Test Post',
      body: 'This is a test',
      userId: 1,
    }),
  })
    .then(response => response.json())
    .then(data => {
      console.log('POST Response received:', data);
      
      // Check the store
      setTimeout(() => {
        const events = networkEventStore.getEvents();
        const postEvent = events.find(e => e.method === 'POST');
        console.log('POST Event in store:', postEvent);
        console.log('Request size:', postEvent?.requestSize);
        console.log('Response size:', postEvent?.responseSize);
        console.log('Has response data:', !!postEvent?.responseData);
      }, 1000);
    });
}, 2000);

// Test 3: XMLHttpRequest
setTimeout(() => {
  console.log('\nTest 3: Making XMLHttpRequest...');
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://jsonplaceholder.typicode.com/users/1');
  xhr.onload = function() {
    console.log('XHR Response received, status:', xhr.status);
    console.log('XHR Response text length:', xhr.responseText?.length);
    
    // Check the store
    setTimeout(() => {
      const events = networkEventStore.getEvents();
      const xhrEvent = events.find(e => e.url.includes('/users/1'));
      console.log('XHR Event in store:', xhrEvent);
      console.log('Response size:', xhrEvent?.responseSize);
      console.log('Has response data:', !!xhrEvent?.responseData);
    }, 1000);
  };
  xhr.send();
}, 4000);

// Show all events after 6 seconds
setTimeout(() => {
  console.log('\n=== All Network Events ===');
  const allEvents = networkEventStore.getEvents();
  allEvents.forEach(event => {
    console.log(`${event.method} ${event.url}`);
    console.log(`  Status: ${event.status || 'pending'}`);
    console.log(`  Response Size: ${event.responseSize || 0} bytes`);
    console.log(`  Has Response Data: ${!!event.responseData}`);
    console.log('---');
  });
}, 6000);