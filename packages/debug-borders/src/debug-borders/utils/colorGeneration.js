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
 * Color Generation Utilities
 * 
 * Generates visually distinct colors for component borders based on depth.
 * Uses HSL color space with golden angle distribution for maximum distinctiveness.
 */

// Golden angle in degrees for color distribution
const GOLDEN_ANGLE = 137.508;

// HSL parameters for generating colors
const HUE_START = 0;
const SATURATION = 70; // 70% saturation for vibrant colors
const LIGHTNESS = 50;  // 50% lightness for good visibility

/**
 * Converts HSL color to RGB hex string
 * 
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} - RGB hex color (e.g., '#ff5500')
 */
function hslToHex(h, s, l) {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;
  
  let r, g, b;
  
  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = lNorm < 0.5 
      ? lNorm * (1 + sNorm) 
      : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    
    r = hue2rgb(p, q, hNorm + 1/3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1/3);
  }
  
  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generates a color for a given depth level using the golden angle
 * This ensures maximum color distinctiveness for adjacent levels
 * 
 * @param {number} depth - The depth level (0 = root)
 * @returns {string} - RGB hex color
 */
function getColorForDepth(depth) {
  const hue = (HUE_START + depth * GOLDEN_ANGLE) % 360;
  return hslToHex(hue, SATURATION, LIGHTNESS);
}

/**
 * Generates a random color (alternative to depth-based colors)
 * 
 * @returns {string} - RGB hex color
 */
function getRandomColor() {
  const hue = Math.random() * 360;
  return hslToHex(hue, SATURATION, LIGHTNESS);
}

/**
 * Generates colors for a specific palette
 * 
 * @param {number} count - Number of colors to generate
 * @returns {Array<string>} - Array of RGB hex colors
 */
function generateColorPalette(count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(getColorForDepth(i));
  }
  return colors;
}

/**
 * Predefined color palette (for consistent colors across renders)
 */
const PREDEFINED_PALETTE = [
  '#FF5733', // Red-orange
  '#33FF57', // Green
  '#3357FF', // Blue
  '#FF33F5', // Magenta
  '#F5FF33', // Yellow
  '#33FFF5', // Cyan
  '#FF8333', // Orange
  '#8333FF', // Purple
  '#33FF83', // Light green
  '#FF3383', // Pink
];

/**
 * Gets a color from the predefined palette, cycling if depth exceeds palette size
 * 
 * @param {number} depth
 * @returns {string}
 */
function getColorFromPalette(depth) {
  return PREDEFINED_PALETTE[depth % PREDEFINED_PALETTE.length];
}

/**
 * Converts a hex color to rgba with specified alpha
 * 
 * @param {string} hex - Hex color (e.g., '#ff5733')
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} - RGBA color string
 */
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generates a color for React Native's processColor
 * Returns a number that can be passed to native code
 * 
 * @param {string} hex - Hex color
 * @returns {number}
 */
function hexToProcessColor(hex) {
  // processColor expects ARGB format as a 32-bit integer
  // Format: 0xAARRGGBB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = 255; // Fully opaque
  
  // Combine into 32-bit integer: AARRGGBB
  return (a << 24) | (r << 16) | (g << 8) | b;
}

module.exports = {
  getColorForDepth,
  getRandomColor,
  generateColorPalette,
  getColorFromPalette,
  hslToHex,
  hexToRgba,
  hexToProcessColor,
  PREDEFINED_PALETTE,
};

