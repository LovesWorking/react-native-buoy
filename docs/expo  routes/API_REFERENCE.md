# Expo Router Complete API Reference

## Table of Contents

1. [Components](#components)
2. [Hooks](#hooks)
3. [Router Object](#router-object)
4. [Navigation Options](#navigation-options)
5. [Type Definitions](#type-definitions)

---

## Components

### `<Stack />`

Stack navigator component for managing screen stacks.

```tsx
import { Stack } from "expo-router";
```

#### Props

| Prop               | Type                           | Description                     |
| ------------------ | ------------------------------ | ------------------------------- |
| `screenOptions`    | `NativeStackNavigationOptions` | Default options for all screens |
| `initialRouteName` | `string`                       | Initial route to render         |

#### Sub-components

##### `<Stack.Screen />`

```tsx
<Stack.Screen
  name="profile"
  options={{
    title: "Profile",
    headerShown: true,
    animation: "slide_from_right",
  }}
  getId={({ params }) => params.id}
/>
```

| Prop        | Type                           | Description                 |
| ----------- | ------------------------------ | --------------------------- |
| `name`      | `string`                       | Route name to configure     |
| `options`   | `NativeStackNavigationOptions` | Screen-specific options     |
| `getId`     | `(params) => string`           | Custom ID for push behavior |
| `redirect`  | `boolean`                      | Redirect to another route   |
| `listeners` | `object`                       | Event listeners             |

##### `<Stack.Protected />`

```tsx
<Stack.Protected guard={isAuthenticated}>
  <Stack.Screen name="dashboard" />
</Stack.Protected>
```

| Prop       | Type        | Description              |
| ---------- | ----------- | ------------------------ |
| `guard`    | `boolean`   | Condition for protection |
| `children` | `ReactNode` | Screens to protect       |

---

### `<Tabs />`

Bottom tab navigator component.

```tsx
import { Tabs } from "expo-router";
```

#### Props

| Prop               | Type                                               | Description                  |
| ------------------ | -------------------------------------------------- | ---------------------------- |
| `screenOptions`    | `BottomTabNavigationOptions`                       | Default options for all tabs |
| `initialRouteName` | `string`                                           | Initial tab to focus         |
| `backBehavior`     | `'none' \| 'initialRoute' \| 'history' \| 'order'` | Back button behavior         |

#### Sub-components

##### `<Tabs.Screen />`

```tsx
<Tabs.Screen
  name="home"
  options={{
    title: "Home",
    tabBarIcon: ({ color, size }) => (
      <Icon name="home" color={color} size={size} />
    ),
    tabBarBadge: 3,
    href: null, // Hide tab
  }}
/>
```

| Prop      | Type                         | Description          |
| --------- | ---------------------------- | -------------------- |
| `name`    | `string`                     | Tab route name       |
| `options` | `BottomTabNavigationOptions` | Tab-specific options |

##### `<Tabs.Protected />`

Same as Stack.Protected but for tabs.

---

### `<Drawer />`

Drawer navigator component.

```tsx
import { Drawer } from "expo-router/drawer";
```

#### Props

| Prop            | Type                      | Description            |
| --------------- | ------------------------- | ---------------------- |
| `screenOptions` | `DrawerNavigationOptions` | Default drawer options |
| `drawerContent` | `(props) => ReactNode`    | Custom drawer content  |

##### `<Drawer.Screen />`

```tsx
<Drawer.Screen
  name="settings"
  options={{
    drawerLabel: "Settings",
    drawerIcon: ({ color, size }) => <Icon name="settings" />,
    drawerItemStyle: { backgroundColor: "#f0f0f0" },
  }}
/>
```

---

### `<Link />`

Navigation link component.

```tsx
import { Link } from "expo-router";
```

#### Props

| Prop         | Type                   | Required | Description             |
| ------------ | ---------------------- | -------- | ----------------------- |
| `href`       | `Href`                 | Yes      | Destination route       |
| `asChild`    | `boolean`              | No       | Pass props to child     |
| `replace`    | `boolean`              | No       | Replace instead of push |
| `push`       | `boolean`              | No       | Always push new screen  |
| `withAnchor` | `boolean`              | No       | Include initial route   |
| `prefetch`   | `boolean`              | No       | Prefetch target screen  |
| `onPress`    | `(e) => void`          | No       | Custom press handler    |
| `className`  | `string`               | No       | CSS class (web only)    |
| `style`      | `StyleProp<ViewStyle>` | No       | Style object            |

#### Examples

```tsx
// Simple link
<Link href="/about">About</Link>

// With params
<Link href={{
  pathname: '/user/[id]',
  params: { id: '123' }
}}>
  View User
</Link>

// With custom component
<Link href="/settings" asChild>
  <Pressable>
    <Text>Settings</Text>
  </Pressable>
</Link>

// Prefetch for performance
<Link href="/heavy-screen" prefetch>
  Heavy Screen
</Link>
```

---

### `<Redirect />`

Immediate redirect component.

```tsx
import { Redirect } from "expo-router";
```

#### Props

| Prop   | Type   | Required | Description          |
| ------ | ------ | -------- | -------------------- |
| `href` | `Href` | Yes      | Redirect destination |

```tsx
export default function Screen() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <UserProfile user={user} />;
}
```

---

### `<Slot />`

Renders the current child route.

```tsx
import { Slot } from "expo-router";
```

```tsx
export default function Layout() {
  return (
    <View>
      <Header />
      <Slot />
      <Footer />
    </View>
  );
}
```

---

### `<Navigator />`

Custom navigator wrapper.

```tsx
import { Navigator } from "expo-router";
```

```tsx
<Navigator>
  <Screen name="home" component={HomeScreen} />
</Navigator>
```

---

## Hooks

### `useRouter()`

Returns the router object for imperative navigation.

```tsx
import { useRouter } from "expo-router";

function MyComponent() {
  const router = useRouter();

  return <Button onPress={() => router.push("/settings")}>Settings</Button>;
}
```

**Returns:** [`Router`](#router-object) object

---

### `useLocalSearchParams()`

Returns URL parameters for the current focused route.

```tsx
import { useLocalSearchParams } from "expo-router";

// In /user/[id].tsx with URL /user/123?tab=posts
export default function UserScreen() {
  const { id, tab } = useLocalSearchParams<{
    id: string;
    tab?: string;
  }>();

  // id = "123", tab = "posts"
  return (
    <Text>
      User {id}, Tab: {tab}
    </Text>
  );
}
```

**Type:** `<T = Record<string, string | string[]>>() => T`

---

### `useGlobalSearchParams()`

Returns URL parameters that update even when route is not focused.

```tsx
import { useGlobalSearchParams } from "expo-router";

function Analytics() {
  const params = useGlobalSearchParams();

  useEffect(() => {
    trackScreen(params);
  }, [params]);

  return null;
}
```

**Type:** `<T = Record<string, string | string[]>>() => T`

---

### `useSegments()`

Returns the current route segments.

```tsx
import { useSegments } from "expo-router";

// In /user/profile/settings
function MyComponent() {
  const segments = useSegments();
  // segments = ["user", "profile", "settings"]

  return <Text>{segments.join("/")}</Text>;
}
```

**Type:** `<T extends string[] = string[]>() => T`

---

### `usePathname()`

Returns the current pathname without query params.

```tsx
import { usePathname } from "expo-router";

function Breadcrumbs() {
  const pathname = usePathname();
  // pathname = "/user/profile" (even if URL has ?tab=posts)

  return <Text>Current: {pathname}</Text>;
}
```

**Returns:** `string`

---

### `useNavigation()`

Returns the React Navigation object.

```tsx
import { useNavigation } from "expo-router";

function MyScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: "Updated Title",
    });
  }, []);

  return <View />;
}
```

**Returns:** `NavigationProp`

---

### `useFocusEffect()`

Runs effect when screen comes into focus.

```tsx
import { useFocusEffect } from "expo-router";

function MyScreen() {
  useFocusEffect(
    useCallback(() => {
      // Screen is focused
      const subscription = subscribe();

      return () => {
        // Screen loses focus
        subscription.unsubscribe();
      };
    }, []),
  );

  return <View />;
}
```

**Type:** `(effect: () => void | (() => void)) => void`

---

### `useNavigationContainerRef()`

Returns ref to the root navigation container.

```tsx
import { useNavigationContainerRef } from "expo-router";

function GlobalNavigationHandler() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (navigationRef.current?.isReady()) {
      // Navigation is ready
    }
  }, []);

  return null;
}
```

**Returns:** `RefObject<NavigationContainerRef>`

---

### `useRootNavigationState()`

Returns the navigation state of the root navigator.

```tsx
import { useRootNavigationState } from "expo-router";

function NavigationDebugger() {
  const state = useRootNavigationState();

  return <Text>Routes: {state.routes.length}</Text>;
}
```

**Returns:** `NavigationState`

---

## Router Object

The router object provides imperative navigation methods.

```tsx
import { router } from "expo-router";
// or
const router = useRouter();
```

### Methods

#### `navigate(href, options?)`

Navigate to a route (intelligently push or pop).

```tsx
router.navigate("/profile");
router.navigate({
  pathname: "/user/[id]",
  params: { id: "123" },
});
```

| Parameter | Type                | Description        |
| --------- | ------------------- | ------------------ |
| `href`    | `Href`              | Destination route  |
| `options` | `NavigationOptions` | Navigation options |

---

#### `push(href, options?)`

Always push a new screen onto the stack.

```tsx
router.push("/details");
router.push({
  pathname: "/post/[id]",
  params: { id: postId },
});
```

---

#### `replace(href, options?)`

Replace current screen without adding to history.

```tsx
router.replace("/home");
```

---

#### `back()`

Go back to the previous screen.

```tsx
router.back();
```

---

#### `canGoBack()`

Check if can navigate back.

```tsx
if (router.canGoBack()) {
  router.back();
}
```

**Returns:** `boolean`

---

#### `dismiss(count?)`

Dismiss screens from the stack.

```tsx
router.dismiss(); // Dismiss one screen
router.dismiss(2); // Dismiss two screens
```

| Parameter | Type     | Default | Description                  |
| --------- | -------- | ------- | ---------------------------- |
| `count`   | `number` | 1       | Number of screens to dismiss |

---

#### `dismissTo(href, options?)`

Dismiss screens until reaching the specified route.

```tsx
router.dismissTo("/home");
router.dismissTo({
  pathname: "/tab/[name]",
  params: { name: "profile" },
});
```

---

#### `dismissAll()`

Return to the first screen in the stack.

```tsx
router.dismissAll();
```

---

#### `canDismiss()`

Check if current screen can be dismissed.

```tsx
if (router.canDismiss()) {
  router.dismiss();
}
```

**Returns:** `boolean`

---

#### `setParams(params)`

Update current route's parameters.

```tsx
router.setParams({
  filter: "active",
  sort: "date",
});
```

| Parameter | Type                     | Description          |
| --------- | ------------------------ | -------------------- |
| `params`  | `Record<string, string>` | Parameters to update |

---

#### `prefetch(href)`

Prefetch a screen for faster navigation.

```tsx
router.prefetch("/heavy-screen");
```

---

#### `reload()`

Reload the current route (experimental).

```tsx
router.reload();
```

---

## Navigation Options

### Stack Navigation Options

```tsx
interface NativeStackNavigationOptions {
  // Header options
  title?: string;
  headerShown?: boolean;
  headerTransparent?: boolean;
  headerBlurEffect?: string;
  headerStyle?: StyleProp<ViewStyle>;
  headerTintColor?: string;
  headerTitleStyle?: StyleProp<TextStyle>;
  headerBackTitle?: string;
  headerBackTitleVisible?: boolean;
  headerLeft?: (props) => ReactNode;
  headerRight?: (props) => ReactNode;
  headerTitle?: string | ((props) => ReactNode);
  headerLargeTitle?: boolean;
  headerSearchBarOptions?: SearchBarOptions;

  // Animation options
  animation?:
    | "default"
    | "fade"
    | "flip"
    | "none"
    | "simple_push"
    | "slide_from_bottom"
    | "slide_from_right"
    | "slide_from_left";
  presentation?:
    | "card"
    | "modal"
    | "transparentModal"
    | "containedModal"
    | "containedTransparentModal"
    | "fullScreenModal"
    | "formSheet";
  animationDuration?: number;
  animationTypeForReplace?: "push" | "pop";

  // Gesture options
  gestureEnabled?: boolean;
  gestureDirection?: "horizontal" | "vertical";
  gestureResponseDistance?: number;
  fullScreenGestureEnabled?: boolean;

  // Other options
  statusBarStyle?: "light" | "dark" | "auto";
  statusBarAnimation?: "fade" | "slide" | "none";
  statusBarHidden?: boolean;
  statusBarTranslucent?: boolean;
  orientation?: "portrait" | "landscape" | "all";
}
```

### Tab Navigation Options

```tsx
interface BottomTabNavigationOptions {
  // Tab bar options
  title?: string;
  tabBarLabel?: string | ((props) => ReactNode);
  tabBarIcon?: (props: {
    focused: boolean;
    color: string;
    size: number;
  }) => ReactNode;
  tabBarBadge?: string | number;
  tabBarBadgeStyle?: StyleProp<TextStyle>;
  tabBarAccessibilityLabel?: string;
  tabBarTestID?: string;
  href?: string | null; // null to hide tab

  // Tab bar style
  tabBarActiveTintColor?: string;
  tabBarInactiveTintColor?: string;
  tabBarActiveBackgroundColor?: string;
  tabBarInactiveBackgroundColor?: string;
  tabBarShowLabel?: boolean;
  tabBarLabelStyle?: StyleProp<TextStyle>;
  tabBarIconStyle?: StyleProp<ViewStyle>;
  tabBarItemStyle?: StyleProp<ViewStyle>;
  tabBarStyle?: StyleProp<ViewStyle>;

  // Header options
  headerShown?: boolean;
  header?: (props) => ReactNode;

  // Other options
  unmountOnBlur?: boolean;
  freezeOnBlur?: boolean;
}
```

### Drawer Navigation Options

```tsx
interface DrawerNavigationOptions {
  // Drawer item options
  title?: string;
  drawerLabel?: string | ((props) => ReactNode);
  drawerIcon?: (props: {
    focused: boolean;
    color: string;
    size: number;
  }) => ReactNode;
  drawerActiveTintColor?: string;
  drawerInactiveTintColor?: string;
  drawerActiveBackgroundColor?: string;
  drawerInactiveBackgroundColor?: string;
  drawerItemStyle?: StyleProp<ViewStyle>;
  drawerLabelStyle?: StyleProp<TextStyle>;

  // Drawer options
  drawerPosition?: "left" | "right";
  drawerType?: "front" | "back" | "slide" | "permanent";
  drawerHideStatusBarOnOpen?: boolean;
  drawerStatusBarAnimation?: "fade" | "slide" | "none";
  swipeEnabled?: boolean;
  swipeEdgeWidth?: number;

  // Header options
  headerShown?: boolean;
  header?: (props) => ReactNode;
}
```

---

## Type Definitions

### Href Type

```tsx
type Href =
  | string
  | {
      pathname: string;
      params?: Record<string, any>;
    };
```

### Route Type

```tsx
type Route = string; // Route path like '/user/[id]'
```

### RouteParams Type

```tsx
type RouteParams<T> = T extends Route
  ? ExtractParams<T>
  : Record<string, string | string[]>;
```

### NavigationOptions Type

```tsx
interface NavigationOptions {
  withAnchor?: boolean;
  experimental?: {
    nativeBehavior?: "stack-replace" | "tabs-reset-on-press";
    isNestedNavigator?: boolean;
  };
}
```

### UnknownOutputParams Type

```tsx
type UnknownOutputParams = Record<string, string | string[]>;
```

### ScreenProps Type

```tsx
interface ScreenProps {
  name: string;
  options?: object;
  listeners?: object;
  getId?: (params: object) => string;
  initialParams?: object;
}
```

### ErrorBoundaryProps Type

```tsx
interface ErrorBoundaryProps {
  error: Error;
  retry: () => void;
}
```

### Layout Settings Type

```tsx
interface LayoutSettings {
  initialRouteName?: string;
  [key: string]: any;
}

// Usage
export const unstable_settings: LayoutSettings = {
  initialRouteName: "index",
};
```

---

## Special Exports

### SplashScreen

Control splash screen visibility.

```tsx
import * as SplashScreen from "expo-router/SplashScreen";

// Prevent auto-hide
SplashScreen.preventAutoHideAsync();

// Hide when ready
SplashScreen.hideAsync();
```

### withLayoutContext

Create custom navigators.

```tsx
import { withLayoutContext } from "expo-router";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const { Navigator } = createNativeStackNavigator();

export const CustomStack = withLayoutContext<
  StackNavigationOptions,
  typeof Navigator
>(Navigator);
```

### ErrorBoundary

Custom error boundary component.

```tsx
import { ErrorBoundary } from "expo-router";

export function CustomErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View>
      <Text>Error: {error.message}</Text>
      <Button onPress={retry} title="Retry" />
    </View>
  );
}
```
