import { useState, useCallback, useEffect } from "react";
import type { RequestMethod } from "./apiClient";
import { safeGetItem, safeSetItem } from "@react-buoy/shared-ui";

const REQUEST_METHOD_STORAGE_KEY = "@devtools/pokemon/requestMethod";

/**
 * Hook for managing request method state (fetch vs axios vs graphql)
 *
 * This provides a simple way to toggle between fetch, axios, and graphql
 * for testing network interception capabilities.
 *
 * The selected method is persisted to AsyncStorage and restored on mount.
 *
 * @returns Object with current method, toggle function, and setter
 */
export const useRequestMethod = () => {
  const [requestMethod, setRequestMethod] = useState<RequestMethod | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved request method on mount
  useEffect(() => {
    const loadRequestMethod = async () => {
      try {
        const saved = await safeGetItem(REQUEST_METHOD_STORAGE_KEY);
        if (saved && (saved === "fetch" || saved === "axios" || saved === "graphql")) {
          setRequestMethod(saved as RequestMethod);
        } else {
          setRequestMethod("fetch"); // Default if nothing saved
        }
      } catch (error) {
        setRequestMethod("fetch"); // Default on error
      } finally {
        setIsLoaded(true);
      }
    };

    loadRequestMethod();
  }, []);

  // Save to storage whenever it changes (after initial load)
  useEffect(() => {
    if (!isLoaded) return;

    const saveRequestMethod = async () => {
      try {
        await safeSetItem(REQUEST_METHOD_STORAGE_KEY, requestMethod);
      } catch (error) {
        // Ignore save errors
      }
    };

    saveRequestMethod();
  }, [requestMethod, isLoaded]);

  const toggleRequestMethod = useCallback(() => {
    setRequestMethod((prev) => {
      if (prev === "fetch") return "axios";
      if (prev === "axios") return "graphql";
      return "fetch";
    });
  }, []);

  return {
    requestMethod: requestMethod as RequestMethod | null,
    setRequestMethod,
    toggleRequestMethod,
    isFetch: requestMethod === "fetch",
    isAxios: requestMethod === "axios",
    isGraphQL: requestMethod === "graphql",
    isLoaded,
  };
};
