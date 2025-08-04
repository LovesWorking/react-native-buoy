# React Native Dev Tools Suite

**Multi-Tool Development Suite** A comprehensive debugging solution for React Native apps featuring React Query dev tools, environment variable inspection, Sentry monitoring, and more in a unified floating interface.

## 🚀 New Integrated FloatingStatusBubble

The package now features a unified `FloatingStatusBubble` that combines React Query dev tools with other essential debugging tools:

- **React Query Dev Tools**: Query/mutation inspection, cache management, network toggling
- **Environment Variables**: Auto-discovery and validation of EXPO*PUBLIC* variables
- **Sentry Logs**: Real-time error and event monitoring
- **Extensible**: Add your own custom debugging sections

## Migration from DevToolsBubble

**Old approach (deprecated):**

```tsx
import { DevToolsBubble } from "rn-rq-dev-tools";

<DevToolsBubble queryClient={queryClient} />;
```

**New approach (recommended):**

```tsx
import { FloatingStatusBubble } from "rn-rq-dev-tools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// Wrap your app with QueryClientProvider
<QueryClientProvider client={queryClient}>
  <FloatingStatusBubble
    userRole="admin"
    environment="development"
    // queryClient prop is optional - automatically uses context
    requiredEnvVars={["EXPO_PUBLIC_API_URL"]}
  />
</QueryClientProvider>;
```

## QueryClient Usage

The React Query dev tools automatically detect the QueryClient from React Query context, so you don't need to pass it as a prop:

```tsx
// ✅ Recommended - uses QueryClient from context
<FloatingStatusBubble userRole="admin" environment="development" />

// ✅ Also works - explicit queryClient prop
<FloatingStatusBubble
  userRole="admin"
  environment="development"
  queryClient={customQueryClient}
/>

// ❌ Remove React Query dev tools if no QueryClient available
<FloatingStatusBubble
  userRole="admin"
  environment="development"
  removeSections={["react-query"]}
/>
```

![rn-dev-tools-hq](https://github.com/LovesWorking/LovesWorking/assets/111514077/3c6a2d9f-1320-48cc-92f3-affe02f877ea)

## ✨ New Features

- **🌐 Network Toggle**: Toggle online/offline mode to test your app's offline behavior
- **🗑️ Cache Management**: Clear query cache and mutation cache with dedicated buttons
- **📱 Resizable Modal**: Drag and resize the dev tools panel for optimal viewing
- **🎨 Updated UI**: Modern, clean interface with improved usability
- **🔍 Enhanced Query Inspector**: Better query and mutation details with improved navigation
- **📋 Copy Functionality**: Copy query/mutation data to clipboard for debugging

## Example

- Find a basic example using the latest expo release with this tool here https://github.com/LovesWorking/RN-Dev-Tools-Example

### Prerequisites

- **React Native**: version 0.78.0 or above (required for React 19 support)
- **React**: version 19.1.0 or above
- **React Query**: version 5.17.19 or above
- **react-native-svg**: 15.0.0 or above

### Installation

To integrate React Query Dev Tools into your React Native project, follow these simple installation steps. Open your terminal, navigate to your project directory, and execute:

```bash
npm install react-native-react-query-devtools
```

This command adds the react-native-react-query-devtools package to your project dependencies, making the Dev Tools available for use.

## Usage

Incorporating React Query Dev Tools into your application is straightforward. Begin by importing the RnBetterDevToolsBubble component.

```javascript
import { RnBetterDevToolsBubble } from "react-native-react-query-devtools";
```

Next, integrate the RnBetterDevToolsBubble component into your app. The tool will automatically detect your clipboard library!

```javascript
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </ThemeProvider>
      {/* No onCopy needed - automatically detects clipboard! */}
      <RnBetterDevToolsBubble queryClient={queryClient} />
    </QueryClientProvider>
  );
}
```

## 🚀 Features

### Network Management

- **Online/Offline Toggle**: Test your app's behavior in different network conditions
- **Visual Indicators**: Clear status indicators for network state

### Cache Management

- **Clear Query Cache**: Remove all cached queries with one click
- **Clear Mutation Cache**: Clear all mutation history and state
- **Selective Clearing**: Context-aware clearing based on current tab (queries/mutations)

### Enhanced UI/UX

- **Resizable Panel**: Drag corners to resize the dev tools panel to your preferred size
- **Moveable Modal**: Drag the panel around the screen for optimal positioning
- **Tab Navigation**: Switch between Queries and Mutations views
- **Modern Design**: Clean, intuitive interface with improved readability

### Query & Mutation Inspector

- **Detailed Information**: View comprehensive query/mutation data
- **State Visualization**: Clear indicators for loading, error, and success states
- **Data Copying**: Copy query keys, data, and other information to clipboard
- **Real-time Updates**: Live updates as your queries and mutations change

### Copy Function

The dev tools now **automatically detect** and use your clipboard library! No configuration needed.

#### Automatic Clipboard Detection

The tool will automatically detect and use:
- **Expo**: `expo-clipboard` (if installed)
- **React Native CLI**: `@react-native-clipboard/clipboard` (if installed)

If neither is detected, you'll see a helpful warning in the console with installation instructions.


#### Manual Installation

If clipboard functionality isn't working, install the appropriate package:

For Expo:
```bash
expo install expo-clipboard
```

For React Native CLI:
```bash
npm install @react-native-clipboard/clipboard
# or
yarn add @react-native-clipboard/clipboard
```

## 🔧 Advanced Configuration

The RnBetterDevToolsBubble component accepts additional props for customization:

```typescript
interface RnBetterDevToolsBubbleProps {
  queryClient: QueryClient; // Required: The QueryClient instance to use
  // Optional: Callback when selection state changes
  onSelectionChange?: (hasSelection: boolean) => void;
  // Optional: Custom pan responder for advanced gesture handling
  panResponder?: PanResponderInstance;
}
```

## 📱 Compatibility

- ✅ **React Native 0.78.0+** (with React 19 support)
- ✅ **Expo SDK 52+**
- ✅ **iOS 15.1+**
- ✅ **Android API 24+**
- ✅ **New Architecture** compatible
- ✅ **TypeScript** support included

## 🐛 Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure you're using React Native 0.78.0+ for React 19 compatibility
2. **SVG rendering issues**: Make sure react-native-svg is properly installed and linked
3. **Copy functionality not working**: Verify your onCopy function implementation matches your platform

### Performance Tips

- The dev tools automatically optimize rendering for large query/mutation lists
- Use the clear cache functions to reset state when needed
- The resizable panel remembers your preferred size across sessions

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

## 🚀 More

**Take a shortcut from web developer to mobile development fluency with guided learning**

Enjoyed this project? Learn to use React Native to build production-ready, native mobile apps for both iOS and Android based on your existing web development skills.

<img width="1800" height="520" alt="banner" src="https://github.com/user-attachments/assets/cdf63dea-464f-44fe-bed1-a517785bfd99" />
