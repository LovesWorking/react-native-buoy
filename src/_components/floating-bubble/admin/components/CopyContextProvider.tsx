import React, { ReactNode } from "react";
import {
  CopyContext,
  type ClipboardFunction,
} from "../../../../context/CopyContext";
import { safeStringify } from "../../../_util/safeStringify";

interface CopyContextProviderProps {
  children: ReactNode;
  onCopy?: ClipboardFunction;
}

/**
 * Specialized provider component for copy functionality
 * Follows "Decompose by Responsibility" principle by handling only copy context logic
 */
export function CopyContextProvider({
  children,
  onCopy,
}: CopyContextProviderProps) {
  const handleCopy = async (value: any) => {
    try {
      // If it's already a string, use it directly
      const textToCopy =
        typeof value === "string"
          ? value
          : safeStringify(value, 2, {
              depthLimit: 100,
              edgesLimit: 1000,
            }); // Pretty print with limits

      return onCopy ? onCopy(textToCopy) : false;
    } catch (error) {
      console.error("Copy failed in ReactQueryDevToolsBubble:", error);
      console.error("Value type:", typeof value);
      console.error("Value constructor:", value?.constructor?.name);
      return false;
    }
  };

  return (
    <CopyContext.Provider value={{ onCopy: handleCopy }}>
      {children}
    </CopyContext.Provider>
  );
}
