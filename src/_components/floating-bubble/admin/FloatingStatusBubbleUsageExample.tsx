import React from 'react';

import { SentryLogDumpSection } from './sections/SentryLogDumpSection';
import type { Environment, UserRole } from './components';
import { ExampleCustomSection } from './ExampleCustomSection';
import { FloatingStatusBubble } from './FloatingStatusBubble';

// Example 1: Default usage with Sentry logs included automatically
export function BasicFloatingStatusBubble() {
  return (
    <FloatingStatusBubble userRole="admin" environment="dev">
      {/* SentryLogDumpSection is included by default */}
      {/* No need to explicitly add it */}
    </FloatingStatusBubble>
  );
}

// Example 2: Adding custom sections alongside default Sentry logs
export function MultiSectionFloatingStatusBubble() {
  return (
    <FloatingStatusBubble userRole="admin" environment="local">
      {/* SentryLogDumpSection is included automatically */}
      <ExampleCustomSection />
    </FloatingStatusBubble>
  );
}

// Example 3: Removing Sentry logs section if not needed
export function NoSentryLogsFloatingStatusBubble() {
  return (
    <FloatingStatusBubble userRole="admin" environment="prod" removeSections={['sentry-logs']}>
      <ExampleCustomSection />
      <MyCustomAdminSection />
    </FloatingStatusBubble>
  );
}

// Example 4: Explicitly adding Sentry logs back if you want to control order
export function CustomOrderFloatingStatusBubble() {
  return (
    <FloatingStatusBubble
      userRole="admin"
      environment="prod"
      removeSections={['sentry-logs']} // Remove default
    >
      <MyCustomAdminSection />
      <SentryLogDumpSection /> {/* Add explicitly where you want it */}
      <AnotherCustomSection />
    </FloatingStatusBubble>
  );
}

// Custom admin sections for demonstration
function MyCustomAdminSection() {
  return (
    <div style={{ padding: 16, borderBottom: '1px solid #333' }}>
      <h3 style={{ color: 'white', margin: 0, marginBottom: 8 }}>My Custom Admin Feature</h3>
      <p style={{ color: '#9CA3AF', margin: 0, fontSize: 14 }}>
        This is a custom admin section that you can add to your floating status bubble.
      </p>
    </div>
  );
}

function AnotherCustomSection() {
  return (
    <div style={{ padding: 16, borderBottom: '1px solid #333' }}>
      <h3 style={{ color: 'white', margin: 0, marginBottom: 8 }}>Another Feature</h3>
      <p style={{ color: '#9CA3AF', margin: 0, fontSize: 14 }}>You can add as many sections as you need.</p>
    </div>
  );
}

// Example 5: For NPM package users - how they would typically use it
export function NPMPackageUsageExample({ userRole, environment }: { userRole: UserRole; environment: Environment }) {
  return (
    <FloatingStatusBubble
      userRole={userRole}
      environment={environment}
      // Sentry logs included by default, can be removed with removeSections={['sentry-logs']}
    >
      {/* Add their own custom admin sections */}
      <MyProjectSpecificSection />
      <DatabaseManagementSection />
      <ApiTestingSection />
    </FloatingStatusBubble>
  );
}

// Example 6: Production build without dev tools
export function ProductionFloatingStatusBubble() {
  return (
    <FloatingStatusBubble
      userRole="admin"
      environment="prod"
      removeSections={['sentry-logs']} // Remove dev tools for production
    >
      <ProductionOnlySection />
      <SystemStatusSection />
    </FloatingStatusBubble>
  );
}

// Example custom sections that users might create
function MyProjectSpecificSection() {
  // This would be implemented by the user
  return null;
}

function DatabaseManagementSection() {
  // This would be implemented by the user
  return null;
}

function ApiTestingSection() {
  // This would be implemented by the user
  return null;
}

function ProductionOnlySection() {
  // This would be implemented by the user
  return null;
}

function SystemStatusSection() {
  // This would be implemented by the user
  return null;
}
