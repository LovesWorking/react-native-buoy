/**
 * Pre-configured benchmark tool for FloatingDevTools
 *
 * This preset provides performance benchmarking functionality.
 * Record, save, and compare performance metrics.
 *
 * @example
 * ```tsx
 * import { benchmarkPreset } from '@react-buoy/benchmark';
 *
 * <FloatingDevTools apps={[benchmarkPreset]} />
 * ```
 */

import React from "react";
import { BenchmarkIcon } from "@react-buoy/shared-ui";
import { BenchmarkModal } from "./components/BenchmarkModal";

/**
 * Pre-configured benchmark tool for FloatingDevTools.
 * Provides performance benchmarking with recording, saving, and comparison features.
 *
 * Features:
 * - Start/Stop recording sessions
 * - View saved benchmark reports
 * - Compare two benchmarks side-by-side
 * - Delete individual or all benchmarks
 */
export const benchmarkPreset = {
  id: "benchmark",
  name: "BENCH",
  description: "Performance benchmarking",
  slot: "both" as const,
  icon: ({ size }: { size: number }) => (
    <BenchmarkIcon size={size} color="#F59E0B" />
  ),
  component: BenchmarkModal,
  props: {
    enableSharedModalDimensions: true,
  },
};

/**
 * Create a custom benchmark tool configuration.
 * Use this if you want to override default settings.
 *
 * @example
 * ```tsx
 * import { createBenchmarkTool } from '@react-buoy/benchmark';
 *
 * const myBenchmarkTool = createBenchmarkTool({
 *   name: "PERF",
 *   iconColor: "#059669",
 * });
 * ```
 */
export function createBenchmarkTool(options?: {
  /** Tool name (default: "BENCH") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color (default: "#F59E0B" - amber) */
  iconColor?: string;
  /** Custom tool ID (default: "benchmark") */
  id?: string;
}) {
  const iconColor = options?.iconColor || "#F59E0B";

  return {
    id: options?.id || "benchmark",
    name: options?.name || "BENCH",
    description: options?.description || "Performance benchmarking",
    slot: "both" as const,
    icon: ({ size }: { size: number }) => (
      <BenchmarkIcon size={size} color={iconColor} />
    ),
    component: BenchmarkModal,
    props: {
      enableSharedModalDimensions: true,
    },
  };
}
