const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const globals = require("globals");

const sharedRules = {
  ...js.configs.recommended.rules,
  "no-unused-vars": "off",
  "@typescript-eslint/no-unused-vars": "off",
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/ban-ts-comment": "off",
  "@typescript-eslint/no-this-alias": "off",
  "@typescript-eslint/no-require-imports": "off",
  "no-undef": "off",
  "react/react-in-jsx-scope": "off",
  "react/prop-types": "off",
  "react/display-name": "off",
  "react-hooks/exhaustive-deps": "off",
};

module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/lib/**",
      "**/dist/**",
      "**/build/**",
      "**/.expo/**",
      "**/.expo-shared/**",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        warnOnUnsupportedTypeScriptVersion: false,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.worker,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react,
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: sharedRules,
  },
];
