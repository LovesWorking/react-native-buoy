/**
 * Translates storage action types to human-readable labels
 */
export function translateStorageAction(action: string): string {
  switch (action) {
    case "setItem":
      return "SET";
    case "removeItem":
      return "REMOVE";
    case "mergeItem":
      return "MERGE";
    case "clear":
      return "CLEAR";
    case "multiSet":
      return "MULTI SET";
    case "multiRemove":
      return "MULTI REMOVE";
    case "multiMerge":
      return "MULTI MERGE";
    default:
      return "UNKNOWN ACTION";
  }
}
