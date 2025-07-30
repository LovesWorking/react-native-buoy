# React Native Admin Panel

A comprehensive, customizable admin panel for React Native applications with Sentry integration and floating status bubble interface.

## 🎯 Features

- **Floating Status Bubble**: Draggable admin interface that doesn't interfere with your app
- **Sentry Logs**: Built-in viewer for Sentry events and breadcrumbs
- **Optional Sections**: Easy to enable/disable admin features
- **Customizable**: Add your own admin sections with consistent styling
- **Production Ready**: Easy to disable debug tools for production builds
- **TypeScript**: Full type safety throughout

## 📦 Installation

```bash
npm install your-admin-package
# or
yarn add your-admin-package
```

### Dependencies

This package requires these peer dependencies:

```bash
npm install react-native-safe-area-context lucide-react-native
```

## 🚀 Quick Start

### Basic Setup

```tsx
import { FloatingStatusBubble } from "your-admin-package";

export default function App() {
  return (
    <YourApp>
      <FloatingStatusBubble userRole="admin" environment="dev" />
    </YourApp>
  );
}
```

### With Optional Sentry Integration

If you're using Sentry in your app, you can integrate the logger:

```tsx
// Only if you have @sentry/react-native installed
import * as Sentry from "@sentry/react-native";
import { FloatingStatusBubble, sentryLogger } from "your-admin-package";

// Configure Sentry to capture events for the admin panel
Sentry.init({
  dsn: "your-sentry-dsn",
  beforeSend: sentryLogger.captureEvent,
  beforeBreadcrumb: sentryLogger.captureBreadcrumb,
  // ... other Sentry config
});

export default function App() {
  return (
    <YourApp>
      <FloatingStatusBubble userRole="admin" environment="dev" />
    </YourApp>
  );
}
```

## 🎨 Customization

### Adding Custom Admin Sections

```tsx
import {
  FloatingStatusBubble,
  ExpandableSectionWithModal,
} from "your-admin-package";
import { Database } from "lucide-react-native";

function MyCustomSection() {
  return (
    <ExpandableSectionWithModal
      icon={Database}
      iconColor="#10B981"
      iconBackgroundColor="rgba(16, 185, 129, 0.1)"
      title="Database Tools"
      subtitle="Manage database connections"
    >
      {(closeModal) => <DatabaseToolsModal onClose={closeModal} />}
    </ExpandableSectionWithModal>
  );
}

export default function App() {
  return (
    <YourApp>
      <FloatingStatusBubble userRole="admin" environment="dev">
        <MyCustomSection />
      </FloatingStatusBubble>
    </YourApp>
  );
}
```

### Disabling Default Sections

```tsx
// Remove Sentry logs for production
<FloatingStatusBubble
  userRole="admin"
  environment="prod"
  removeSections={["sentry-logs"]}
>
  <ProductionOnlySection />
</FloatingStatusBubble>
```

## 🔧 API Reference

### FloatingStatusBubble

Main component that provides the floating admin interface.

```tsx
interface FloatingStatusBubbleProps {
  userRole: UserRole;
  environment: Environment;
  children?: ReactNode;
  removeSections?: DefaultSection[];
}

type UserRole = "admin" | string;
type Environment = "local" | "dev" | "prod";
type DefaultSection = "sentry-logs";
```

### ExpandableSectionWithModal

Utility component for creating custom admin sections with modals.

```tsx
interface ExpandableSectionWithModalProps {
  icon: LucideIcon;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  subtitle: string;
  children: ReactNode | ((closeModal: () => void) => ReactNode);
  modalSnapPoints?: string[];
  enableDynamicSizing?: boolean;
  modalBackgroundColor?: string;
  handleIndicatorColor?: string;
  onModalOpen?: () => void;
  onModalClose?: () => void;
}
```

### SentryLogger

Logger for capturing Sentry events in the admin panel.

```tsx
class SentryLogger {
  captureEvent: (event: SentryEvent) => SentryEvent;
  captureBreadcrumb: (breadcrumb: SentryBreadcrumb) => SentryBreadcrumb | null;
  captureTransaction: (event: SentryEvent) => SentryEvent;
  captureSpan: (span: SentryEvent) => SentryEvent;
}

// Use the default instance
import { sentryLogger } from "your-admin-package";
```

## 📋 Usage Patterns

### Development Environment

```tsx
// Include all debugging tools
<FloatingStatusBubble userRole="admin" environment="dev">
  {/* Sentry logs included by default */}
  <ApiTestingSection />
  <DatabaseDebugSection />
</FloatingStatusBubble>
```

### Production Environment

```tsx
// Remove dev tools, keep essential admin functions
<FloatingStatusBubble
  userRole="admin"
  environment="prod"
  removeSections={["sentry-logs"]}
>
  <SystemHealthSection />
  <UserManagementSection />
</FloatingStatusBubble>
```

### Conditional Features

```tsx
function AdminInterface({ environment, userRole }) {
  const isProduction = environment === "prod";

  return (
    <FloatingStatusBubble
      userRole={userRole}
      environment={environment}
      removeSections={isProduction ? ["sentry-logs"] : []}
    >
      {!isProduction && <DevOnlySection />}
      <AlwaysAvailableSection />
      {userRole === "admin" && <AdminOnlySection />}
    </FloatingStatusBubble>
  );
}
```

## 🎨 Styling

All components follow a consistent dark theme:

- Background: `#171717` / `#0F0F0F`
- Text: `#FFFFFF` / `#9CA3AF`
- Borders: `rgba(255, 255, 255, 0.08)`
- Accent colors based on component purpose

### Custom Modal Content

When creating modal content, follow these patterns:

```tsx
function MyModalContent({ onClose }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F0F" }}>
      {/* Header with close button */}
      <View style={headerStyles}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
          My Feature
        </Text>
        <TouchableOpacity onPress={onClose}>
          <X size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }}>{/* Your content */}</ScrollView>

      {/* Bottom spacing */}
      <View style={{ paddingBottom: insets.bottom + 20 }} />
    </View>
  );
}
```

## 🛠 Advanced Features

### Environment-Based Configuration

```tsx
const getAdminConfig = (environment: Environment) => {
  switch (environment) {
    case "prod":
      return { removeSections: ["sentry-logs"] as const };
    case "dev":
      return { removeSections: [] as const };
    case "local":
      return { removeSections: [] as const };
    default:
      return { removeSections: ["sentry-logs"] as const };
  }
};

<FloatingStatusBubble
  userRole="admin"
  environment={environment}
  {...getAdminConfig(environment)}
>
  <MyCustomSection />
</FloatingStatusBubble>;
```

### Custom Section Order

```tsx
// Control exact order of sections
<FloatingStatusBubble
  userRole="admin"
  environment="dev"
  removeSections={["sentry-logs"]} // Remove from default position
>
  <HighPrioritySection />
  <SentryLogDumpSection /> {/* Add back where you want it */}
  <LowerPrioritySection />
</FloatingStatusBubble>
```

## 📚 Examples

See the [examples directory](./examples) for complete implementation examples:

- Basic setup
- Sentry integration
- Custom sections
- Production configuration
- Advanced patterns

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

1. **Modal not opening**: Ensure `react-native-reanimated` is properly installed and configured for animations
2. **Sentry logs not showing**: Verify `sentryLogger` is configured in Sentry.init()
3. **Styling issues**: Make sure your app supports the required CSS properties
4. **TypeScript errors**: Ensure all peer dependencies are installed with correct versions

### Support

- GitHub Issues: [Report bugs or request features](https://github.com/your-repo/issues)
- Documentation: [Full documentation](https://your-docs-site.com)
- Community: [Discord/Slack community](https://your-community-link.com)
