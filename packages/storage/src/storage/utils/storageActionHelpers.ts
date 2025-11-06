/**
 * Translates storage action types to human-readable labels
 */
export function translateStorageAction(action: string): string {
  switch (action) {
    // AsyncStorage actions
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

    // MMKV actions - simplified to match AsyncStorage
    case "set.string":
    case "set.number":
    case "set.boolean":
    case "set.buffer":
      return "SET";
    case "delete":
      return "REMOVE";
    case "clearAll":
      return "CLEAR";
    case "get.string":
    case "get.number":
    case "get.boolean":
    case "get.buffer":
      return "GET";

    default:
      return "UNKNOWN ACTION";
  }
}
