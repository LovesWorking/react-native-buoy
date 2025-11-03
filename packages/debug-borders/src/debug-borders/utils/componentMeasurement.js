/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/**
 * Component Measurement Utilities
 * 
 * This module provides utilities to measure component positions and sizes
 * for both Fabric (new architecture) and Paper (legacy architecture).
 */

// Import debug logging if available
let addLog = null;
try {
  const debugInfo = require('./DebugInfo');
  addLog = debugInfo.addLog;
} catch (e) {
  // Debug info not available, use console only
}

function log(message) {
  console.log(message);
  if (addLog) {
    addLog(message);
  }
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
      // Debug: Log what's available on the first few instances
      const debugOnce = !measureInstance._debugged;
      if (debugOnce) {
        measureInstance._debugged = true;
        console.log('[DebugBorders] Instance structure:', {
          hasNode: !!instance?.node,
          hasCanonical: !!instance?.canonical,
          nodeKeys: instance?.node ? Object.keys(instance.node).slice(0, 10) : [],
          canonicalType: typeof instance?.canonical,
        });
      }
      
      // Fabric structure: instance.canonical.publicInstance is the actual public instance
      // that has getBoundingClientRect() or measure()
      let publicInstance = instance;
      
      // If instance has canonical, use that
      if (instance.canonical) {
        // Try canonical.publicInstance first (Fabric with publicInstance property)
        if (instance.canonical.publicInstance) {
          publicInstance = instance.canonical.publicInstance;
          
          if (debugOnce) {
            console.log('[DebugBorders] Using canonical.publicInstance');
            console.log('[DebugBorders] Keys:', Object.keys(publicInstance).slice(0, 15));
            console.log('[DebugBorders] Has getBoundingClientRect:', typeof publicInstance.getBoundingClientRect);
            console.log('[DebugBorders] Has measure:', typeof publicInstance.measure);
          }
        } else {
          // Otherwise use canonical directly (Legacy Fabric)
          publicInstance = instance.canonical;
          
          if (debugOnce) {
            console.log('[DebugBorders] Using canonical directly (no publicInstance property)');
          }
        }
      }
      
      // Modern Fabric: getBoundingClientRect() - synchronous
      if (typeof publicInstance.getBoundingClientRect === 'function') {
        const rect = publicInstance.getBoundingClientRect();
        
        if (debugOnce) {
          console.log('[DebugBorders] getBoundingClientRect result:', rect);
        }
        
        // Validate the rectangle
        if (
          rect &&
          typeof rect.x === 'number' &&
          typeof rect.y === 'number' &&
          typeof rect.width === 'number' &&
          typeof rect.height === 'number' &&
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
      if (typeof publicInstance.measure === 'function') {
        // Set timeout in case measure never calls back
        const timeout = setTimeout(() => {
          if (debugOnce) {
            console.log('[DebugBorders] measure() timed out');
          }
          resolve(null);
        }, 100);
        
        publicInstance.measure((x, y, width, height, pageX, pageY) => {
          clearTimeout(timeout);
          
          if (debugOnce) {
            console.log('[DebugBorders] measure() result:', {x, y, width, height, pageX, pageY});
          }
          
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
      if (debugOnce) {
        console.warn('[DebugBorders] No measurement method available on public instance');
      }
      resolve(null);
    } catch (error) {
      console.warn('[DebugBorders] Error measuring instance:', error);
      resolve(null);
    }
  });
}

/**
 * Measures multiple instances in parallel
 * 
 * @param {Array<{instance: any, fiber: Fiber, depth: number}>} instances
 * @returns {Promise<Array<{x: number, y: number, width: number, height: number, depth: number}>>}
 */
async function measureInstances(instances) {
  const startTime = Date.now();
  
  // Measure all instances in parallel
  const measurements = await Promise.all(
    instances.map(async ({instance, depth}) => {
      const rect = await measureInstance(instance);
      
      if (rect) {
        return {
          ...rect,
          depth: depth,
        };
      }
      
      return null;
    })
  );
  
  // Filter out failed measurements
  const validMeasurements = measurements.filter(m => m != null);
  
  const endTime = Date.now();
  
  // Only log if measurement took a long time or first time
  const duration = endTime - startTime;
  if (duration > 50 || validMeasurements.length === 0) {
    log(
      `[DebugBorders] Measured ${validMeasurements.length}/${instances.length} instances in ${duration}ms`
    );
  }
  
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
    hasFabricBoundingRect: typeof instance.getBoundingClientRect === 'function',
    hasPaperMeasure: typeof instance.measure === 'function',
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
  
  instances.forEach(({instance}) => {
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

