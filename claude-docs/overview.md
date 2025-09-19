---
id: overview
title: Overview
---

React Native DevTools Floating Menu is a development-first tooling system that eliminates context switching by providing instant access to your entire development workflow through a persistent, pluggable floating menu that lives alongside your app during development.

## Motivation

React Native development is uniquely frustrating. Unlike web development where DevTools are a keystroke away, or native development with integrated debuggers, React Native developers constantly juggle between their app, Metro terminal, Chrome DevTools, React DevTools, Flipper, and countless other windows. Every switch breaks your flow. Every console.log means tabbing out. Every network request means opening another tool.

The reality of React Native development today:
- Checking logs means switching to Metro or Chrome DevTools
- Inspecting network requests requires Flipper or proxy tools
- Viewing environment variables needs console access
- Performance profiling demands React DevTools
- Running debug commands means finding the right terminal

Each context switch costs seconds that compound into hours of lost productivity. Worse, you lose visual context of your app's state when debugging, making it harder to correlate issues with what you're seeing.

**DevTools Floating Menu solves this by bringing every development tool directly into your app.** No more window juggling. No more lost context. Just a small floating button that expands into a powerful development command center.

On a technical level, DevTools Floating Menu provides:
- **Zero-config integration** that works with any React Native app
- **Pluggable architecture** for adding custom tools specific to your workflow
- **AppHost system** for rendering overlays without polluting your component tree
- **Hot-reload aware** tools that persist across refreshes
- **Production-safe** with automatic removal in release builds

## Enough talk, show me some code already!

[//]: # 'Example'

```tsx
import { FloatingMenu, AppHostProvider, AppOverlay } from '@monorepo/devtools-floating-menu'
import { EnvVarsModal, createEnvVarConfig } from '@monorepo/env-tools'

// Define your environment requirements
const envConfig = createEnvVarConfig({
  API_URL: { required: true, description: 'Backend API endpoint' },
  SENTRY_DSN: { required: false, description: 'Error tracking' },
})

// Configure your dev tools
const devTools = [
  {
    id: 'env-vars',
    label: 'Environment',
    icon: '🔧',
    component: EnvVarsModal,
    props: { config: envConfig },
  },
  {
    id: 'clear-cache',
    label: 'Clear Cache',
    icon: '🗑️',
    action: () => AsyncStorage.clear(),
  },
]

// Add to your app root
export default function App() {
  return (
    <AppHostProvider>
      <YourApp />
      {__DEV__ && (
        <>
          <FloatingMenu tools={devTools} position="bottom-right" />
          <AppOverlay />
        </>
      )}
    </AppHostProvider>
  )
}
```

[//]: # 'Example'

## You talked me into it, so what now?

- Follow our [Installation Guide](./installation.md) to set up the monorepo
- Jump into the [Quick Start](./quick-start.md) to see the three core concepts in action
- Explore [Built-in Tools](./guides/built-in-tools.md) for immediate productivity gains
- Learn to [Create Custom Tools](./guides/creating-tools.md) for your specific needs