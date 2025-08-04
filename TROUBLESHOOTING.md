# Troubleshooting

## react-native-reanimated errors

If you see errors like `useSharedValue is not a function` or similar, ensure that:

### 1. Install react-native-reanimated
```bash
npm install react-native-reanimated
# or
yarn add react-native-reanimated
```

### 2. Configure Babel
Add the reanimated plugin to your `babel.config.js`:

```js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // ... other plugins
    'react-native-reanimated/plugin', // <- Add this as the LAST plugin
  ],
};
```

### 3. Clear Metro Cache
After adding the babel plugin, clear your Metro cache:

```bash
npx react-native start --reset-cache
```

### 4. Rebuild the app
For iOS:
```bash
cd ios && pod install
npx react-native run-ios
```

For Android:
```bash
cd android && ./gradlew clean
npx react-native run-android
```

### 5. Ensure proper import order
If you're using Expo, make sure to import react-native-reanimated at the top of your App.js/index.js:

```js
import 'react-native-reanimated'
// ... rest of your imports
```

## Other common issues

### Clipboard errors
If you see clipboard-related errors, install one of these packages:
- For Expo: `expo install expo-clipboard`
- For React Native CLI: `npm install @react-native-clipboard/clipboard`

### AsyncStorage warnings
To enable position persistence, install:
```bash
npm install @react-native-async-storage/async-storage
```