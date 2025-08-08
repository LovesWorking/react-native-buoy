import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: false,
  splitting: false,
  minify: !options.watch,
  bundle: true,
  skipNodeModulesBundle: true,
  target: 'es2020',
  platform: 'neutral',
  external: [
    'react',
    'react-native',
    '@tanstack/react-query',
    'react-native-reanimated',
    'react-native-gesture-handler',
    'react-native-safe-area-context',
    'react-native-svg',
    '@react-native-async-storage/async-storage',
    '@sentry/react-native',
    '@shopify/flash-list'
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use strict";'
    }
  },
  onSuccess: options.watch ? 'echo "✅ Build complete"' : undefined
}))