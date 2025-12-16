---
title: Environment & Roles
id: environment-roles
---

React Buoy displays the current environment and user role prominently, helping your team always know which context they're working in.

## Environment Configuration

The `environment` prop accepts any string value:

```tsx
<FloatingDevTools
  environment="local"     // Development machine
  // or
  environment="staging"   // Staging server
  // or
  environment="production" // Production
/>
```

## Dynamic Environment Detection

Detect the environment at runtime:

```tsx
const getEnvironment = () => {
  if (__DEV__) return "local";
  if (process.env.EXPO_PUBLIC_API_URL?.includes("staging")) return "staging";
  return "production";
};

<FloatingDevTools environment={getEnvironment()} />
```

## User Roles

Display the current user's role:

```tsx
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user } = useAuth();

  return (
    <FloatingDevTools
      environment="local"
      userRole={user?.role} // "admin", "developer", "tester", etc.
    />
  );
}
```

## Environment Colors

Different environments are displayed with distinct colors for quick identification:

| Environment | Color |
|-------------|-------|
| local | Green |
| development | Green |
| staging | Orange |
| production | Red |

## Role-Based Tool Visibility

You can conditionally show tools based on user role:

```tsx
const adminTools = user?.role === "admin" ? [
  {
    name: "Admin Panel",
    component: AdminDebugger,
    icon: "👑",
  },
] : [];

<FloatingDevTools
  environment="local"
  userRole={user?.role}
  customTools={[
    ...commonTools,
    ...adminTools,
  ]}
/>
```

## Next Steps

- [FloatingDevTools](./floating-devtools) - Core component reference
- [Custom Tools](./custom-tools) - Build your own tools
