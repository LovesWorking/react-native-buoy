# Expo Router Complete Guide for Mobile (iOS & Android)

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [File Structure & Notation](#file-structure--notation)
4. [Navigation Patterns](#navigation-patterns)
5. [Protected Routes](#protected-routes)
6. [Layouts](#layouts)
7. [Best Practices](#best-practices)
8. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

## Quick Start

### Installation

```bash
npx expo install expo-router
```

### Basic Setup

```tsx
// app/_layout.tsx - Your root layout (required)
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
```

```tsx
// app/index.tsx - Your home screen
export default function Home() {
  return <Text>Welcome Home</Text>;
}
```

## Core Concepts

### File-Based Routing

Every file in the `app` directory automatically becomes a route. The file structure directly maps to URLs:

```
app/
  index.tsx       → /
  about.tsx       → /about
  profile.tsx     → /profile
```

### URL-First Architecture

- Every screen has a URL by default
- Deep linking works out of the box
- Share specific screens via URLs
- Navigate using familiar web patterns

## File Structure & Notation

### Essential Notation Guide

| Notation         | Purpose        | Example                  | URL Result               |
| ---------------- | -------------- | ------------------------ | ------------------------ |
| No notation      | Static route   | `app/settings.tsx`       | `/settings`              |
| `[param]`        | Dynamic route  | `app/user/[id].tsx`      | `/user/123`              |
| `(group)`        | Route group    | `app/(tabs)/home.tsx`    | `/home`                  |
| `index.tsx`      | Default route  | `app/profile/index.tsx`  | `/profile`               |
| `_layout.tsx`    | Layout wrapper | `app/(tabs)/_layout.tsx` | Wraps all tabs           |
| `+not-found.tsx` | 404 handler    | `app/+not-found.tsx`     | Catches unmatched routes |

### Recommended Project Structure

```
app/
  _layout.tsx                 # Root layout
  +not-found.tsx             # Global 404 handler
  +native-intent.tsx         # Deep link handler

  (auth)/                    # Auth group (protected)
    _layout.tsx              # Auth layout wrapper
    sign-in.tsx              # Sign in screen
    sign-up.tsx              # Sign up screen

  (app)/                     # Main app (requires auth)
    _layout.tsx              # App layout
    (tabs)/                  # Tab navigator
      _layout.tsx            # Tab layout
      index.tsx              # Home tab
      profile.tsx            # Profile tab
      settings.tsx           # Settings tab

    user/
      [id].tsx               # Dynamic user profile

    modal.tsx                # Modal screen
```

## Navigation Patterns

### Basic Navigation

#### Using Links (Recommended)

```tsx
import { Link } from 'expo-router';

// Simple link
<Link href="/about">About</Link>

// With params
<Link href="/user/123">View User</Link>

// Dynamic with params object
<Link
  href={{
    pathname: '/user/[id]',
    params: { id: userId }
  }}
>
  View Profile
</Link>

// With query params
<Link href="/products?category=electronics">Electronics</Link>
```

#### Using Router (Imperative)

```tsx
import { useRouter } from "expo-router";

function MyComponent() {
  const router = useRouter();

  return (
    <Button
      onPress={() => {
        // Navigate (intelligently push or pop)
        router.navigate("/about");

        // Always push new screen
        router.push("/user/123");

        // Replace current screen
        router.replace("/home");

        // Go back
        router.back();

        // Update params
        router.setParams({ filter: "active" });
      }}
    />
  );
}
```

### Stack Navigation

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#f4511e" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen
        name="details"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
```

### Tab Navigation

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "blue",
        tabBarInactiveTintColor: "gray",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

## Protected Routes

### Basic Protection Pattern (SDK 53+)

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";
import { useSession } from "../ctx";

export default function RootLayout() {
  const { session } = useSession();

  return (
    <Stack>
      {/* Protected routes - only accessible when authenticated */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="profile" />
      </Stack.Protected>

      {/* Public routes - only accessible when NOT authenticated */}
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
    </Stack>
  );
}
```

### Complete Authentication Setup

#### 1. Create Auth Context

```tsx
// ctx/auth.tsx
import { createContext, useContext, PropsWithChildren } from "react";
import { useStorageState } from "./useStorageState";

const AuthContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

export function useSession() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState("session");

  return (
    <AuthContext.Provider
      value={{
        signIn: () => setSession("user-token"),
        signOut: () => setSession(null),
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

#### 2. Wrap App with Provider

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";
import { SessionProvider, useSession } from "../ctx/auth";

export default function Root() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
```

### Nested Protected Routes

```tsx
// app/_layout.tsx
const isLoggedIn = true;
const isAdmin = true;
const isPremium = true;

export default function Layout() {
  return (
    <Stack>
      {/* Public routes */}
      <Stack.Screen name="landing" />

      {/* Requires login */}
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="dashboard" />

        {/* Requires admin role */}
        <Stack.Protected guard={isAdmin}>
          <Stack.Screen name="admin" />
        </Stack.Protected>

        {/* Requires premium subscription */}
        <Stack.Protected guard={isPremium}>
          <Stack.Screen name="premium-features" />
        </Stack.Protected>
      </Stack.Protected>
    </Stack>
  );
}
```

## Layouts

### Stack Layout

```tsx
// app/stack/_layout.tsx
import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
        headerShown: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Stack Home" }} />
    </Stack>
  );
}
```

### Tab Layout with Badges

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";

export default function TabLayout() {
  const unreadCount = 5;

  return (
    <Tabs>
      <Tabs.Screen
        name="messages"
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color }) => <Icon name="message" color={color} />,
        }}
      />
    </Tabs>
  );
}
```

### Drawer Layout

```tsx
// app/drawer/_layout.tsx
import { Drawer } from "expo-router/drawer";

export default function DrawerLayout() {
  return (
    <Drawer>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Home",
          title: "Home Screen",
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: "Settings",
          title: "Settings",
        }}
      />
    </Drawer>
  );
}
```

### Modal Presentation

```tsx
// app/_layout.tsx
export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
```

## Best Practices

### 1. Use Protected Routes for Authentication

```tsx
// ✅ GOOD: Clean, declarative protection
<Stack.Protected guard={isAuthenticated}>
  <Stack.Screen name="(app)" />
</Stack.Protected>;

// ❌ BAD: Manual redirects in components
if (!isAuthenticated) {
  return <Redirect href="/login" />;
}
```

### 2. Organize with Route Groups

```tsx
// ✅ GOOD: Clear separation
app/
  (public)/       # Public routes
    landing.tsx
    about.tsx
  (auth)/         # Auth routes
    sign-in.tsx
    sign-up.tsx
  (app)/          # Main app routes
    (tabs)/
      home.tsx
      profile.tsx

// ❌ BAD: Flat structure
app/
  landing.tsx
  sign-in.tsx
  home.tsx
  profile.tsx
```

### 3. Use Links for Navigation

```tsx
// ✅ GOOD: Declarative, supports prefetching
<Link href="/profile" prefetch>Profile</Link>

// ❌ BAD: Always using imperative navigation
<Button onPress={() => router.push('/profile')}>Profile</Button>
```

### 4. Dynamic Routes with Type Safety

```tsx
// ✅ GOOD: Type-safe params
<Link
  href={{
    pathname: '/user/[id]',
    params: { id: user.id }
  }}
>
  View User
</Link>

// ❌ BAD: String concatenation
<Link href={`/user/${user.id}`}>View User</Link>
```

### 5. Handle Loading States

```tsx
// ✅ GOOD: Show loading while auth checks
function RootNavigator() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <SplashScreen />;
  }

  return <Stack>...</Stack>;
}

// ❌ BAD: Flash of wrong screen
function RootNavigator() {
  const { session } = useSession();
  return <Stack>...</Stack>; // May show wrong screen briefly
}
```

## Common Mistakes to Avoid

### 1. Duplicate Screen Declarations

```tsx
// ❌ WRONG: Screen declared twice
<Stack>
  <Stack.Protected guard={isAdmin}>
    <Stack.Screen name="profile" />
  </Stack.Protected>
  <Stack.Screen name="profile" /> // Duplicate!
</Stack>
```

### 2. Missing Initial Routes

```tsx
// ❌ WRONG: No back button on deep links
export default function Layout() {
  return <Stack />;
}

// ✅ CORRECT: Set initial route
export const unstable_settings = {
  initialRouteName: "index",
};

export default function Layout() {
  return <Stack />;
}
```

### 3. Incorrect Protected Route Guards

```tsx
// ❌ WRONG: Guard changes don't redirect
<Stack.Protected guard={someCondition}>

// ✅ CORRECT: Guards are reactive
<Stack.Protected guard={!!session}>
```

### 4. Web-Only Features in Mobile

```tsx
// ❌ WRONG: Using web-only attributes
<Link href="/about" target="_blank">About</Link>

// ✅ CORRECT: Mobile-first approach
<Link href="/about">About</Link>
```

### 5. Not Handling Deep Links

```tsx
// ✅ CORRECT: Handle external links
// app/+native-intent.tsx
export async function redirectSystemPath({ path, initial }) {
  if (path.includes("outdated-route")) {
    return "/new-route";
  }
  return path;
}
```

## Navigation Actions Reference

### Stack Actions

```tsx
const router = useRouter();

// Remove screens from stack
router.dismiss(); // Dismiss current screen
router.dismiss(2); // Dismiss 2 screens
router.dismissAll(); // Go to first screen in stack
router.dismissTo("/home"); // Dismiss until reaching /home

// Check if can dismiss
if (router.canDismiss()) {
  router.dismiss();
}
```

### Parameter Management

```tsx
// Get params
const { id, filter } = useLocalSearchParams();
const globalParams = useGlobalSearchParams();

// Update params
router.setParams({ filter: "active" });

// Navigate with params
router.push({
  pathname: "/search",
  params: { q: "expo router" },
});
```

### Prefetching

```tsx
// Prefetch screens for faster navigation
<Link href="/heavy-screen" prefetch>
  Go to Heavy Screen
</Link>;

// Or imperatively
router.prefetch("/heavy-screen");
```
