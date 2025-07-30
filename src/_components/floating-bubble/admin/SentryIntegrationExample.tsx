import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Sentry from '@sentry/react-native';

import { setMaxSentryEvents, setupSentryEventListeners } from '../../sentry/sentryEventListeners';

import { Environment } from './components';
import { FloatingStatusBubble } from './FloatingStatusBubble';

/**
 * Example showing how to integrate the Sentry event logger with the FloatingStatusBubble
 *
 * This component demonstrates:
 * 1. Proper Sentry initialization
 * 2. Setting up the event listeners after Sentry init
 * 3. Configuring event storage limits
 * 4. Using the FloatingStatusBubble with Sentry log capture
 */
export function SentryIntegrationExample() {
  useEffect(() => {
    // 1. Initialize Sentry first
    Sentry.init({
      dsn: 'your-dsn-here', // Replace with your actual DSN
      debug: __DEV__, // Enable debug in development
      environment: __DEV__ ? 'development' : 'production',
      tracesSampleRate: 1.0, // Capture 100% of transactions for development
      enableAutoSessionTracking: true,
      enableAutoPerformanceTracing: true,
    });

    // 2. Setup the event listeners after Sentry initialization
    const success = setupSentryEventListeners();

    if (success) {
      console.log('✅ Sentry event logger initialized successfully');

      // 3. Configure storage limits (optional)
      setMaxSentryEvents(100); // Store up to 100 events

      // 4. Generate some test events to demonstrate the functionality
      Sentry.addBreadcrumb({
        message: 'App initialized',
        category: 'app',
        level: 'info',
      });

      // Capture a test error
      try {
        throw new Error('Test error for Sentry integration');
      } catch (error) {
        Sentry.captureException(error);
      }

      // Start a transaction (if available in your Sentry version)
      try {
        // Note: startTransaction might not be available in all Sentry versions
        // This is just for demonstration purposes
        console.log('Transaction example would go here');
      } catch (error) {
        console.log('Transaction API not available');
      }
    } else {
      console.warn('❌ Failed to initialize Sentry event logger');
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sentry Integration Example</Text>
      <Text style={styles.description}>
        This example shows the FloatingStatusBubble with Sentry event logging. Open the admin panel and check the
        "Sentry Logs" section to see captured events.
      </Text>

      {/* The FloatingStatusBubble will automatically include the SentryLogDumpSection */}
      <FloatingStatusBubble
        userRole="admin"
        environment={'development' as Environment}
        // You can optionally disable the default log section if you only want Sentry logs
        removeSections={['sentry-logs']} // Remove this line to see both log types
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1F2937',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
    marginBottom: 32,
  },
});

/**
 * Example of a custom implementation without using the default FloatingStatusBubble
 */
export function CustomSentryLogViewer() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  useEffect(() => {
    // Setup Sentry and event listeners
    setupSentryEventListeners();
    setMaxSentryEvents(50);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Custom Sentry Log Viewer</Text>

      {/* You can use individual components for custom layouts */}
      {/* Example would require importing and using SentryEventLogDumpModalContent directly */}
    </View>
  );
}

/**
 * Integration with app initialization
 *
 * Add this to your main App.tsx or index.tsx file:
 *
 * ```typescript
 * import { setupSentryEventListeners, setMaxSentryEvents } from './path/to/floating-bubble';
 *
 * function App() {
 *   useEffect(() => {
 *     // Initialize Sentry first
 *     Sentry.init({ ... });
 *
 *     // Then setup event logging
 *     setupSentryEventListeners();
 *     setMaxSentryEvents(100);
 *   }, []);
 *
 *   return (
 *     <YourAppContent>
 *       <FloatingStatusBubble userRole="admin" environment="development" />
 *     </YourAppContent>
 *   );
 * }
 * ```
 */
