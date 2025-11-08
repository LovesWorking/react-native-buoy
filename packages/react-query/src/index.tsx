// Check if @tanstack/react-query is installed
try {
  require("@tanstack/react-query");
} catch (error) {
  throw new Error(
    "\n\n[@react-buoy/react-query] ERROR: Missing required peer dependency\n\n" +
      "This package requires @tanstack/react-query to be installed.\n\n" +
      "Install it with:\n" +
      "  npm install @tanstack/react-query\n" +
      "  or\n" +
      "  pnpm add @tanstack/react-query\n" +
      "  or\n" +
      "  yarn add @tanstack/react-query\n\n" +
      "For more information, visit: https://tanstack.com/query/latest\n"
  );
}

// Export preset configuration (easiest way to add to FloatingDevTools!)
export {
  reactQueryToolPreset,
  createReactQueryTool,
  wifiTogglePreset,
  createWifiToggleTool,
} from "./preset";

// React Query dev tools entry point
// Re-export the full dev tools surface so consumers can tree-shake as needed
export * from "./react-query";
export * from "./react-query/components";
export * from "./react-query/hooks";
export * from "./react-query/utils";
export * from "./react-query/types";
