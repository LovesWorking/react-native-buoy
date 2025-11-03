// Export types
export * from "./types";

// Export components
export { DebugBordersModal } from "./components/DebugBordersModal";
export { DebugBordersStandaloneOverlay } from "./components/DebugBordersStandaloneOverlay";

// Export utilities (JS modules - will be typed when converted to TS)
// Note: These are CommonJS modules, so we use require for now
export const DebugBordersManager = require("./utils/DebugBordersManager");
export const fiberTreeTraversal = require("./utils/fiberTreeTraversal");
export const componentMeasurement = require("./utils/componentMeasurement");
export const colorGeneration = require("./utils/colorGeneration");

