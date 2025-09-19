# DevTools Floating Menu Documentation

> Comprehensive development tools for React Native that eliminate context switching and boost developer productivity

## 📚 Documentation Structure

### Getting Started
- [**Overview**](./overview.md) - Understand the motivation and architecture
- [**Installation**](./installation.md) - Set up in your project
- [**Quick Start**](./quick-start.md) - Learn the three core concepts

### Guides
- [**Creating Custom Tools**](./guides/creating-tools.md) - Build your own development tools
- [**AppHost System**](./guides/apphost-system.md) - Manage overlays and modals
- [**Tool Registration**](./guides/tool-registration.md) - Add tools to the floating menu
- [**Tool Communication**](./guides/tool-communication.md) - Inter-tool messaging

### API Reference
- [**FloatingMenu**](./reference/FloatingMenu.md) - Main menu component API
- [**useAppHost**](./reference/useAppHost.md) - Hook for tool integration
- [**AppHostProvider**](./reference/AppHostProvider.md) - Context provider API
- [**AppOverlay**](./reference/AppOverlay.md) - Overlay rendering component

### Package Documentation
- [**Environment Tools**](./packages/env-tools.md) - Environment variable management
- [**Network Package**](./packages/network.md) - HTTP request inspection
- [**React Query Integration**](./packages/react-query.md) - Query debugging tools
- [**Shared Components**](./packages/shared.md) - Common UI and utilities

### Examples
- [**Basic Setup**](./examples/basic-setup.md) - Simple integration example
- [**Network Inspector**](./examples/network-inspector.md) - HTTP debugging setup
- [**Performance Monitor**](./examples/performance-monitor.md) - FPS and memory tracking
- [**Custom Tools**](./examples/custom-tools.md) - Advanced tool creation

### Additional Resources
- [**Troubleshooting**](./troubleshooting.md) - Common issues and solutions
- [**Migration Guide**](./migration.md) - Upgrading from other solutions
- [**Contributing**](./contributing.md) - How to contribute
- [**Package Development**](./guides/package-development.md) - Creating new packages

## 🚀 Quick Links

### For New Users
1. Start with the [Overview](./overview.md) to understand the problem we're solving
2. Follow the [Installation](./installation.md) guide
3. Try the [Quick Start](./quick-start.md) example
4. Explore [Examples](./examples/basic-setup.md) for real implementations

### For Developers
1. Learn to [Create Custom Tools](./guides/creating-tools.md)
2. Understand the [AppHost System](./guides/apphost-system.md)
3. Review [API Reference](./reference/FloatingMenu.md) for detailed options
4. Check [Package Development](./guides/package-development.md) for contributing

## 📦 Available Packages

| Package | Description | Documentation |
|---------|-------------|---------------|
| `@monorepo/devtools-floating-menu` | Core floating menu system | [Docs](./reference/FloatingMenu.md) |
| `@monorepo/env-tools` | Environment variable tools | [Docs](./packages/env-tools.md) |
| `@monorepo/network` | Network inspection tools | [Docs](./packages/network.md) |
| `@monorepo/react-query` | React Query dev tools | [Docs](./packages/react-query.md) |
| `@monorepo/shared` | Shared components & utils | [Docs](./packages/shared.md) |

## 🎯 Core Concepts

### 1. Tool Registration
Tools are JavaScript objects that define what appears in your floating menu:
```tsx
const tool = {
  id: 'my-tool',
  label: 'My Tool',
  icon: '🔧',
  action: () => console.log('Tool activated'),
}
```

### 2. AppHost System
Render overlays without polluting your component tree:
```tsx
<AppHostProvider>
  <YourApp />
  <AppOverlay />
</AppHostProvider>
```

### 3. Tool Actions
Tools can execute immediately or open panels:
```tsx
// Action tool
{ action: () => clearCache() }

// Panel tool
{ component: SettingsPanel }
```

## 💡 Philosophy

DevTools Floating Menu follows these principles:

1. **Zero Context Switching** - All tools accessible within your app
2. **Pluggable Architecture** - Add only the tools you need
3. **Production Safe** - Automatically removed in release builds
4. **Hot Reload Aware** - Tools persist across refreshes
5. **Performance First** - Minimal impact on app performance

## 🛠️ Common Use Cases

- **Environment Debugging** - Inspect and validate env variables
- **Network Monitoring** - Track API calls and responses
- **Storage Management** - Clear caches and AsyncStorage
- **Performance Profiling** - Monitor FPS and memory usage
- **Feature Flags** - Toggle features without rebuilding
- **Console Viewing** - See logs without external tools
- **Quick Actions** - Reload, reset, or navigate instantly

## 📖 Documentation Standards

This documentation follows React Query's documentation patterns:
- **Progressive Disclosure** - Simple to advanced
- **Complete Examples** - All code is runnable
- **Direct Writing** - No fluff, straight to the point
- **Consistent Structure** - Same format throughout

See our [Documentation Style Guide](../claude-react-query-documentation-style-guide.md) for writing conventions.

## 🤝 Community

- [GitHub Discussions](https://github.com/your-org/rn-monorepo-clean/discussions) - Ask questions
- [Issues](https://github.com/your-org/rn-monorepo-clean/issues) - Report bugs
- [Pull Requests](https://github.com/your-org/rn-monorepo-clean/pulls) - Contribute code
- [Discord](https://discord.gg/your-invite) - Chat with the community

## 📄 License

MIT - See [LICENSE](../LICENSE) for details

---

Built with ❤️ for React Native developers who value their time