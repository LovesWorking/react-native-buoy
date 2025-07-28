# FloatingStatusBubble

A draggable, floating status bubble component for React Native applications that provides environment information, admin controls, and debugging utilities.

## Features

- 🎯 **Draggable Interface**: Smooth gesture-based positioning with edge snapping
- 🌍 **Environment Display**: Visual indicators for different environments (LOCAL, DEV, PROD)
- 👤 **User Status**: Shows admin, internal, or regular user status
- 🔧 **Debug Controls**: Toggle network status and debug logging (in local environment)
- 📱 **Responsive**: Adapts to screen size and safe areas
- 🎨 **Customizable**: Configurable through props with sensible defaults

## Installation

```bash
npm install react-native-floating-status-bubble
# or
yarn add react-native-floating-status-bubble
```

### Dependencies

This component requires the following peer dependencies:

```bash
npm install react-native-gesture-handler react-native-reanimated
```

Make sure to follow the installation guides for:
- [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/docs/installation)
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/installation)

## Usage

### Basic Usage

```tsx
import React, { useState } from 'react';
import { FloatingStatusBubble } from 'react-native-floating-status-bubble';

export default function App() {
  const [isOnline, setIsOnline] = useState(true);
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);

  const handleAdminPress = () => {
    console.log('Admin panel opened');
  };

  const handleNetworkToggle = () => {
    setIsOnline(!isOnline);
  };

  const handleDebugToggle = () => {
    setIsDebugEnabled(!isDebugEnabled);
  };

  return (
    <FloatingStatusBubble
      environment={{ label: 'DEV', backgroundColor: '#F97316', isLocal: false }}
      isAdmin={true}
      isOnline={isOnline}
      isDebugEnabled={isDebugEnabled}
      onAdminPress={handleAdminPress}
      onNetworkToggle={handleNetworkToggle}
      onDebugToggle={handleDebugToggle}
    />
  );
}
```

### Advanced Usage with Custom Configuration

```tsx
import React from 'react';
import { FloatingStatusBubble, EnvironmentConfig } from 'react-native-floating-status-bubble';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MyApp = () => {
  const insets = useSafeAreaInsets();
  
  const prodEnvironment: EnvironmentConfig = {
    label: 'PROD',
    backgroundColor: '#DC2626',
    isLocal: false,
  };

  return (
    <FloatingStatusBubble
      environment={prodEnvironment}
      isAdmin={false}
      isInternal={true}
      isAuthorized={true}
      isOnline={true}
      isDebugEnabled={false}
      safeAreaInsets={insets}
      hitSlop={15}
      onAdminPress={() => console.log('Admin pressed')}
      onNetworkToggle={() => console.log('Network toggled')}
      onDebugToggle={() => console.log('Debug toggled')}
    />
  );
};
```

## Props

### FloatingStatusBubbleProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `environment` | `EnvironmentConfig` | `{ label: 'DEV', backgroundColor: '#F97316', isLocal: false }` | Environment configuration |
| `isAdmin` | `boolean` | `false` | Whether user has admin privileges |
| `isInternal` | `boolean` | `false` | Whether user has internal access |
| `isAuthorized` | `boolean` | `true` | Whether user is authorized to see the bubble |
| `isOnline` | `boolean` | `true` | Whether network is online |
| `isDebugEnabled` | `boolean` | `false` | Whether debug logging is enabled |
| `onAdminPress` | `() => void` | `undefined` | Callback when admin panel should open |
| `onNetworkToggle` | `() => void` | `undefined` | Callback when network toggle is pressed |
| `onDebugToggle` | `() => void` | `undefined` | Callback when debug toggle is pressed |
| `safeAreaInsets` | `{ top: number; bottom: number }` | `{ top: 44, bottom: 34 }` | Safe area insets |
| `hitSlop` | `number` | `10` | Custom hit slop for touchables |

### EnvironmentConfig

| Property | Type | Description |
|----------|------|-------------|
| `label` | `string` | Environment label (e.g., 'LOCAL', 'DEV', 'PROD') |
| `backgroundColor` | `string` | Hex color for environment indicator |
| `isLocal` | `boolean` | Whether this is a local development environment |

## Environment Examples

### Local Development
```tsx
const localEnv: EnvironmentConfig = {
  label: 'LOCAL',
  backgroundColor: '#06B6D4',
  isLocal: true, // Shows debug toggle
};
```

### Development
```tsx
const devEnv: EnvironmentConfig = {
  label: 'DEV',
  backgroundColor: '#F97316',
  isLocal: false,
};
```

### Production
```tsx
const prodEnv: EnvironmentConfig = {
  label: 'PROD',
  backgroundColor: '#DC2626',
  isLocal: false,
};
```

## Behavior

### Dragging
- The bubble can be dragged around the screen
- It automatically snaps to screen edges
- When partially hidden, only the grip handle remains visible
- Visual feedback during dragging with border color changes

### Environment Indicator
- Displays a colored dot and label for the current environment
- Different colors help distinguish between LOCAL, DEV, and PROD

### User Status
- Shows user type with appropriate colors:
  - **Admin**: Green indicator
  - **Internal**: Blue indicator  
  - **User**: Gray indicator

### Debug Controls (Local Only)
- Debug toggle only appears in local environments (`isLocal: true`)
- Network toggle allows simulating online/offline states
- Callback functions provide integration points for your app logic

## Integration Tips

1. **State Management**: Use your app's state management to control the bubble's state
2. **Network Simulation**: Connect `onNetworkToggle` to your network management library
3. **Debug Logging**: Use `onDebugToggle` to control your app's debug output
4. **Admin Panel**: Connect `onAdminPress` to open your admin interface

## Requirements

- React Native 0.60+
- react-native-gesture-handler
- react-native-reanimated

## License

MIT 