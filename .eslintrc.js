module.exports = {
  extends: [
    "@react-native",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react", "sentry-tracking"],
  rules: {
    // React Native specific
    "react-native/no-inline-styles": "off",

    // React rules
    "react/no-unescaped-entities": "off",
    "react/prop-types": "off",
    "react/display-name": "off",
    "react/jsx-fragments": "off",

    // TypeScript rules - relaxed for library development
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-require-imports": "warn",

    // React Hooks
    "react-hooks/exhaustive-deps": "warn",

    // Sentry tracking for dev tools
    "sentry-tracking/require-ignore-label": "error",

    // General
    "prefer-arrow-callback": ["warn", { allowNamedFunctions: true }],
    // "no-console": "warn",
  },
  overrides: [
    {
      files: ["src/**/*.ts", "src/**/*.tsx"],
      rules: {
        // Library-specific rules can go here
      },
    },
  ],
  ignorePatterns: [
    "ios",
    "android",
    "*.lock",
    "*.html",
    "node_modules",
    "dist",
    ".expo",
    ".expo-router",
    "web-build",
    "*.keystore",
    "*.pem",
    "*.p8",
    "*.p12",
    "*.mobileprovision",
    "scripts",
    "build.js",
    "check-jsx-transform.js",
    "install-linting-deps.sh",
  ],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: "latest",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
