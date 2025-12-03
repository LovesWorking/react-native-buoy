# 📱 Expo Router Master Guide for Mobile (iOS & Android)

> **The Complete Reference for Building Native Mobile Navigation with Expo Router**

## 🚀 Quick Navigation

- [Getting Started](#getting-started) - Set up your first route in 2 minutes
- [Decision Guide](#decision-guide) - Choose the right pattern for your use case
- [Complete Examples](#complete-examples) - Copy-paste ready implementations
- [API Quick Reference](#api-quick-reference) - All APIs at a glance
- [Troubleshooting](#troubleshooting) - Common issues and solutions

---

## Getting Started

### Installation & Basic Setup

```bash
# Install Expo Router
npx expo install expo-router

# If starting fresh
npx create-expo-app --template tabs@latest
```

### Minimal Working Example

```tsx
// app/_layout.tsx (Required - Root layout)
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
```

```tsx
// app/index.tsx (Home screen)
import { Link } from "expo-router";
import { View, Text } from "react-native";

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome to Expo Router!</Text>
      <Link href="/about">Go to About</Link>
    </View>
  );
}
```

```tsx
// app/about.tsx (About screen)
import { useRouter } from "expo-router";
import { View, Text, Button } from "react-native";

export default function About() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>About Screen</Text>
      <Button title="Go Back" onPress={() => router.back()} />
    </View>
  );
}
```

---

## Decision Guide

### "What Should I Use When?"

#### Choosing Navigation Type

| Need                            | Use This   | Example                 |
| ------------------------------- | ---------- | ----------------------- |
| Linear flow (onboarding, forms) | **Stack**  | `<Stack />`             |
| Main app sections               | **Tabs**   | `<Tabs />`              |
| Settings/menu access            | **Drawer** | `<Drawer />`            |
| Temporary overlay               | **Modal**  | `presentation: 'modal'` |
| No visual navigation            | **Slot**   | `<Slot />`              |

#### Choosing Navigation Method

| Scenario                 | Use This              | Code                                   |
| ------------------------ | --------------------- | -------------------------------------- |
| User taps UI element     | **Link**              | `<Link href="/profile">Profile</Link>` |
| After async action       | **router.navigate()** | `router.navigate('/success')`          |
| Replace history          | **router.replace()**  | `router.replace('/home')`              |
| Form submission redirect | **Redirect**          | `<Redirect href="/dashboard" />`       |
| Conditional navigation   | **Protected routes**  | `<Stack.Protected guard={isAuth}>`     |

#### Choosing Route Type

| Need                        | Pattern       | File Structure          |
| --------------------------- | ------------- | ----------------------- |
| Static page                 | Regular file  | `app/about.tsx`         |
| User profiles, items        | Dynamic route | `app/user/[id].tsx`     |
| Organize without URL change | Route group   | `app/(tabs)/home.tsx`   |
| Default page for directory  | Index file    | `app/profile/index.tsx` |
| Shared wrapper              | Layout file   | `app/(app)/_layout.tsx` |

---

## Complete Examples

### Example 1: Authentication Flow with Protected Routes

```tsx
// app/_layout.tsx - Root layout with auth
import { Stack } from "expo-router";
import { SessionProvider, useSession } from "../lib/auth";
import { SplashScreen } from "expo-router";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function Root() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useSession();

  // Hide splash when auth state is loaded
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null; // Splash screen is still visible
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Protected: Only accessible when authenticated */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      {/* Public: Only accessible when NOT authenticated */}
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
```

```tsx
// app/(auth)/_layout.tsx - Auth screens layout
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="sign-in" options={{ title: "Sign In" }} />
      <Stack.Screen name="sign-up" options={{ title: "Sign Up" }} />
      <Stack.Screen
        name="forgot-password"
        options={{ title: "Reset Password" }}
      />
    </Stack>
  );
}
```

```tsx
// app/(auth)/sign-in.tsx - Sign in screen
import { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useSession } from "../../lib/auth";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useSession();
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
      // Navigation happens automatically due to protected routes
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Sign In" onPress={handleSignIn} />

      <Link href="/sign-up">Don't have an account? Sign Up</Link>
      <Link href="/forgot-password">Forgot Password?</Link>
    </View>
  );
}
```

```tsx
// app/(app)/_layout.tsx - Main app layout
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "blue" }}>
      <Tabs.Screen
        name="(home)"
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

### Example 2: E-commerce App with Complex Navigation

```
app/
  _layout.tsx                    # Root with modal support
  (shop)/                        # Shopping experience
    _layout.tsx                  # Tab layout
    (home)/
      _layout.tsx                # Stack for home
      index.tsx                  # Home feed
      product/[id].tsx           # Product details
    (categories)/
      _layout.tsx                # Stack for categories
      index.tsx                  # Category list
      [category].tsx             # Category products
    cart.tsx                     # Cart tab
    account.tsx                  # Account tab
  checkout/                      # Checkout flow (modal)
    _layout.tsx                  # Stack for checkout
    address.tsx
    payment.tsx
    confirmation.tsx
  search.tsx                     # Global search (modal)
```

```tsx
// app/_layout.tsx - Root with modal support
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(shop)" options={{ headerShown: false }} />
      <Stack.Screen
        name="checkout"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          presentation: "modal",
          animation: "fade",
        }}
      />
    </Stack>
  );
}
```

```tsx
// app/(shop)/_layout.tsx - Tab layout
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

export default function ShopLayout() {
  const router = useRouter();

  return (
    <Tabs>
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerRight: () => (
            <Pressable onPress={() => router.push("/search")}>
              <Ionicons name="search" size={24} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="(categories)"
        options={{
          title: "Categories",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
          tabBarBadge: 3, // Show item count
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

```tsx
// app/(shop)/(home)/product/[id].tsx - Product details
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { View, Text, Button, ScrollView, Image } from "react-native";
import { useState, useEffect } from "react";

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // Fetch product details
    fetchProduct(id).then(setProduct);
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product);
    // Navigate to cart
    router.navigate("/cart");
  };

  const handleBuyNow = () => {
    addToCart(product);
    // Open checkout modal
    router.push("/checkout/address");
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: product?.name || "Loading...",
          headerBackTitle: "Shop",
        }}
      />
      <ScrollView>
        <Image source={{ uri: product?.image }} style={{ height: 300 }} />
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 24 }}>{product?.name}</Text>
          <Text style={{ fontSize: 20, color: "green" }}>
            ${product?.price}
          </Text>
          <Text>{product?.description}</Text>

          <Button title="Add to Cart" onPress={handleAddToCart} />
          <Button title="Buy Now" onPress={handleBuyNow} />
        </View>
      </ScrollView>
    </>
  );
}
```

### Example 3: Social Media App with Nested Navigation

```tsx
// app/(app)/_layout.tsx - Main app with tabs
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { position: "absolute" },
        tabBarBackground: () => (
          <BlurView intensity={100} style={{ flex: 1 }} />
        ),
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          href: "/feed", // Always link to root of feed
        }}
      />
      <Tabs.Screen name="discover" options={{ title: "Discover" }} />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarBadge: "●", // Red dot for unread
        }}
      />
      <Tabs.Screen
        name="profile/[username]"
        options={{
          title: "Profile",
          href: "/profile/me", // Always link to own profile
        }}
      />
    </Tabs>
  );
}
```

```tsx
// app/(app)/feed/_layout.tsx - Feed with nested stack
import { Stack } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index", // Ensure back navigation works
};

export default function FeedLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="post/[id]"
        options={{
          headerTitle: "Post",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="comments/[postId]"
        options={{
          headerTitle: "Comments",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
```

---

## API Quick Reference

### Navigation Components

```tsx
// Stack Navigator
<Stack screenOptions={{ animation: 'slide_from_right' }}>
  <Stack.Screen name="home" options={{ title: 'Home' }} />
  <Stack.Protected guard={isAuth}>
    <Stack.Screen name="profile" />
  </Stack.Protected>
</Stack>

// Tab Navigator
<Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
  <Tabs.Screen
    name="home"
    options={{
      tabBarIcon: ({ color }) => <Icon name="home" color={color} />,
      tabBarBadge: 3
    }}
  />
</Tabs>

// Drawer Navigator
<Drawer>
  <Drawer.Screen
    name="home"
    options={{ drawerLabel: 'Home' }}
  />
</Drawer>

// Link Component
<Link href="/profile" asChild prefetch>
  <Pressable><Text>Profile</Text></Pressable>
</Link>

// Redirect Component
<Redirect href="/login" />

// Slot Component (pass-through layout)
<Slot />
```

### Essential Hooks

```tsx
// Navigation hooks
const router = useRouter(); // Imperative navigation
const params = useLocalSearchParams(); // Current route params
const globalParams = useGlobalSearchParams(); // Global params
const segments = useSegments(); // Route segments array
const pathname = usePathname(); // Current path

// Navigation methods
router.navigate("/home"); // Smart navigation
router.push("/details"); // Always push
router.replace("/login"); // Replace current
router.back(); // Go back
router.dismiss(); // Dismiss modal
router.dismissAll(); // Go to root
router.setParams({ filter: "active" }); // Update params
router.prefetch("/heavy-screen"); // Preload screen

// Focus effects
useFocusEffect(
  useCallback(() => {
    // Run when screen focuses
    return () => {
      // Cleanup when unfocused
    };
  }, []),
);
```

### File Naming Patterns

```
app/
  _layout.tsx         → Layout wrapper
  index.tsx          → Default route (/)
  about.tsx          → Static route (/about)
  [id].tsx           → Dynamic route (/123)
  [...slug].tsx      → Catch-all (/a/b/c)
  (group)/           → Route group (no URL impact)
  +not-found.tsx     → 404 handler
  +native-intent.tsx → Deep link handler
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: "No back button on deep links"

```tsx
// Solution: Set initialRouteName
export const unstable_settings = {
  initialRouteName: "index",
};
```

#### Issue: "Protected routes not redirecting"

```tsx
// Solution: Ensure guard is reactive
<Stack.Protected guard={!!session}> // ✅ Boolean
<Stack.Protected guard={session}>    // ❌ Might not trigger
```

#### Issue: "Tab not showing"

```tsx
// Solution: Check href option
<Tabs.Screen
  name="hidden"
  options={{ href: null }} // Hides tab
/>
```

#### Issue: "Modal not dismissing"

```tsx
// Solution: Use router.dismiss()
const router = useRouter();
router.dismiss(); // Not router.back()
```

#### Issue: "Params not updating"

```tsx
// Solution: Use setParams
router.setParams({ id: newId }); // Updates current route
```

#### Issue: "Navigation not working in effect"

```tsx
// Solution: Check if component is focused
const navigation = useNavigation();

if (navigation.isFocused()) {
  router.navigate("/home");
}
```

---

## Best Practices Checklist

### ✅ DO:

- Use Protected routes for authentication
- Organize with route groups `(auth)`, `(app)`
- Set `initialRouteName` for proper back navigation
- Use `<Link>` for user-triggered navigation
- Prefetch heavy screens with `prefetch`
- Handle loading states during auth checks
- Use typed params with TypeScript
- Test deep linking scenarios

### ❌ DON'T:

- Declare the same screen multiple times
- Use string concatenation for dynamic routes
- Navigate in render without guards
- Mix web-only props in mobile (`target="_blank"`)
- Forget to hide splash screen after auth loads
- Use `router.back()` for modals (use `dismiss()`)
- Navigate without checking `canDismiss()` or `canGoBack()`

---

## Quick Recipes

### Recipe: Add Loading Screen

```tsx
function RootNavigator() {
  const { isLoading } = useSession();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <Stack>...</Stack>;
}
```

### Recipe: Custom Tab Bar

```tsx
<Tabs
  tabBar={(props) => <CustomTabBar {...props} />}
  screenOptions={{ tabBarShowLabel: false }}
>
```

### Recipe: Header Search Button

```tsx
<Stack.Screen
  name="home"
  options={{
    headerRight: () => (
      <Link href="/search">
        <Icon name="search" />
      </Link>
    ),
  }}
/>
```

### Recipe: Conditional Tabs

```tsx
<Tabs>
  <Tabs.Protected guard={isPremium}>
    <Tabs.Screen name="premium" />
  </Tabs.Protected>
</Tabs>
```

### Recipe: Deep Link Handler

```tsx
// app/+native-intent.tsx
export async function redirectSystemPath({ path }) {
  if (path.startsWith("/old-route")) {
    return "/new-route";
  }
  return path;
}
```

---

## Resources

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [React Navigation Docs](https://reactnavigation.org/)
- [Example Projects](https://github.com/expo/expo/tree/main/templates)

---

**Remember:** Expo Router is built on React Navigation but with file-based routing. Every file is a route, every directory can have a layout, and everything works with URLs out of the box!
