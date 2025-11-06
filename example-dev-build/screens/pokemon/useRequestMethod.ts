import { useState, useCallback } from "react";
import type { RequestMethod } from "./apiClient";

/**
 * Hook for managing request method state (fetch vs axios)
 *
 * This provides a simple way to toggle between fetch and axios
 * for testing network interception capabilities.
 *
 * @returns Object with current method, toggle function, and setter
 */
export const useRequestMethod = () => {
  const [requestMethod, setRequestMethod] = useState<RequestMethod>("fetch");

  const toggleRequestMethod = useCallback(() => {
    setRequestMethod((prev) => (prev === "fetch" ? "axios" : "fetch"));
  }, []);

  return {
    requestMethod,
    setRequestMethod,
    toggleRequestMethod,
    isFetch: requestMethod === "fetch",
    isAxios: requestMethod === "axios",
  };
};
