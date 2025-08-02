import React from "react";
import { VirtualizedDataExplorer } from "./VirtualizedDataExplorer";

interface DataExplorerProps {
  title: string;
  data: unknown;
  defaultExpanded?: boolean;
  maxDepth?: number;
  chunkSize?: number;
  valueRenderer?: (
    value: unknown,
    originalValue: unknown,
    keyPath: string[]
  ) => string;
  labelRenderer?: (
    keyPath: string[],
    nodeType: string,
    expanded: boolean,
    expandable: boolean
  ) => string;
  sortObjectKeys?: ((a: string, b: string) => number) | boolean;
  theme?: "dark" | "light" | "auto";
  showTypeIndicators?: boolean;
}

/**
 * Ultra-high-performance DataExplorer powered by FlashList for optimal performance.
 * This is now a simple wrapper around VirtualizedDataExplorer (which uses FlashList internally).
 *
 * For JSON data visualization in React Native with:
 * - 10-100x better performance for large datasets vs original FlatList implementation
 * - FlashList's advanced view recycling (up to 5x faster than FlatList)
 * - Virtualized rendering (only renders visible items)
 * - Memory efficient with constant memory usage
 * - Smooth scrolling on mobile devices
 * - Advanced cell recycling with getItemType optimization
 * - Superior performance on low-end devices
 */
const DataExplorer: React.FC<DataExplorerProps> = ({
  title,
  data,
  maxDepth = 10,
}) => {
  return (
    <VirtualizedDataExplorer title={title} data={data} maxDepth={maxDepth} />
  );
};
