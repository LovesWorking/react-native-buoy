/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

"use strict";

/**
 * Component Measurement Utilities
 *
 * This module provides utilities to measure component positions and sizes
 * for both Fabric (new architecture) and Paper (legacy architecture).
 */

// Import debug logging if available
let addLog = null;
try {
  const debugInfo = require("./DebugInfo");
  addLog = debugInfo.addLog;
} catch (e) {
  // Debug info not available
}

/**
 * Measures a component instance and returns its bounding rectangle
 *
 * For Fabric (modern): Uses getBoundingClientRect()
 * For Paper (legacy): Uses measure() callback-based API
 *
 * @param {any} instance - The component instance to measure
 * @returns {Promise<{x: number, y: number, width: number, height: number} | null>}
 */
function measureInstance(instance) {
  return new Promise((resolve) => {
    try {
      // Fabric structure: instance.canonical.publicInstance is the actual public instance
      // that has getBoundingClientRect() or measure()
      let publicInstance = instance;

      // If instance has canonical, use that
      if (instance.canonical) {
        // Try canonical.publicInstance first (Fabric with publicInstance property)
        if (instance.canonical.publicInstance) {
          publicInstance = instance.canonical.publicInstance;
        } else {
          // Otherwise use canonical directly (Legacy Fabric)
          publicInstance = instance.canonical;
        }
      }

      // Modern Fabric: getBoundingClientRect() - synchronous
      if (typeof publicInstance.getBoundingClientRect === "function") {
        const rect = publicInstance.getBoundingClientRect();

        // Validate the rectangle
        if (
          rect &&
          typeof rect.x === "number" &&
          typeof rect.y === "number" &&
          typeof rect.width === "number" &&
          typeof rect.height === "number" &&
          rect.width >= 0 &&
          rect.height >= 0
        ) {
          resolve({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          });
          return;
        }
      }

      // Legacy Paper: measure() - callback-based
      if (typeof publicInstance.measure === "function") {
        // Set timeout in case measure never calls back
        const timeout = setTimeout(() => {
          resolve(null);
        }, 100);

        publicInstance.measure((x, y, width, height, pageX, pageY) => {
          clearTimeout(timeout);

          // measure() can call callback with null values on error
          if (
            pageX != null &&
            pageY != null &&
            width != null &&
            height != null &&
            width >= 0 &&
            height >= 0
          ) {
            resolve({
              x: pageX,
              y: pageY,
              width: width,
              height: height,
            });
          } else {
            resolve(null);
          }
        });
        return;
      }

      // No measurement method available
      resolve(null);
    } catch (error) {
      resolve(null);
    }
  });
}

// Import component info extraction
const { extractComponentInfo } = require("./componentInfo");

/**
 * Measures multiple instances in parallel and extracts component info
 *
 * @param {Array<{instance: any, fiber: Fiber, depth: number}>} instances
 * @returns {Promise<Array<{x: number, y: number, width: number, height: number, depth: number, componentInfo: Object}>>}
 */
async function measureInstances(instances) {
  // Measure all instances in parallel
  const measurements = await Promise.all(
    instances.map(async ({ instance, fiber, depth }) => {
      const rect = await measureInstance(instance);

      if (rect) {
        // Extract component info for labels
        const componentInfo = extractComponentInfo(fiber, instance);

        return {
          ...rect,
          depth: depth,
          componentInfo: componentInfo,
        };
      }

      return null;
    })
  );

  // Filter out failed measurements
  const validMeasurements = measurements.filter((m) => m != null);

  return validMeasurements;
}

/**
 * Checks what measurement APIs are available on an instance
 *
 * @param {any} instance
 * @returns {{hasFabricBoundingRect: boolean, hasPaperMeasure: boolean, hasNode: boolean}}
 */
function getMeasurementCapabilities(instance) {
  return {
    hasFabricBoundingRect: typeof instance.getBoundingClientRect === "function",
    hasPaperMeasure: typeof instance.measure === "function",
    hasNode: instance.node != null,
  };
}

/**
 * Gets statistics about measurement capabilities across all instances
 *
 * @param {Array<{instance: any}>} instances
 * @returns {{fabric: number, paper: number, none: number}}
 */
function getMeasurementStats(instances) {
  const stats = {
    fabric: 0,
    paper: 0,
    none: 0,
  };

  instances.forEach(({ instance }) => {
    const caps = getMeasurementCapabilities(instance);

    if (caps.hasFabricBoundingRect) {
      stats.fabric++;
    } else if (caps.hasPaperMeasure) {
      stats.paper++;
    } else {
      stats.none++;
    }
  });

  return stats;
}

module.exports = {
  measureInstance,
  measureInstances,
  getMeasurementCapabilities,
  getMeasurementStats,
};
