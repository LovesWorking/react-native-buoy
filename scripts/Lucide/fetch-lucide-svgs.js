#!/usr/bin/env node

/**
 * Script to fetch Lucide icon SVGs from GitHub and convert to React Native components
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// List of all icons used in the codebase
const iconNames = [
  'Activity',
  'AlertCircle', 
  'AlertTriangle',
  'BarChart3',
  'Box',
  'Bug',
  'Check',
  'CheckCircle',
  'CheckCircle2',
  'ChevronDown',
  'ChevronLeft',
  'ChevronRight',
  'ChevronUp',
  'Clock',
  'Copy',
  'Database',
  'Download',
  'Eye',
  'EyeOff',
  'FileJson',
  'FileText',
  'Film',
  'Filter',
  'FlaskConical',
  'Globe',
  'GripVertical',
  'Hand',
  'HardDrive',
  'Hash',
  'Image',
  'Key',
  'Layers',
  'Lock',
  'Maximize2',
  'Minimize2',
  'Music',
  'Navigation',
  'Palette',
  'Pause',
  'Play',
  'Plus',
  'Power',
  'RefreshCw',
  'Route',
  'Search',
  'Server',
  'Settings',
  'Shield',
  'Smartphone',
  'TestTube2',
  'Timer',
  'TouchpadIcon',
  'Trash',
  'Trash2',
  'TriangleAlert',
  'Unlock',
  'Upload',
  'User',
  'Wifi',
  'WifiOff',
  'X',
  'XCircle',
  'Zap'
];

// Map of special icon name conversions
const iconNameMap = {
  'AlertCircle': 'alert-circle',
  'AlertTriangle': 'alert-triangle',
  'BarChart3': 'bar-chart-3',
  'CheckCircle': 'check-circle',
  'CheckCircle2': 'check-circle-2',
  'ChevronDown': 'chevron-down',
  'ChevronLeft': 'chevron-left',
  'ChevronRight': 'chevron-right',
  'ChevronUp': 'chevron-up',
  'EyeOff': 'eye-off',
  'FileJson': 'file-json',
  'FileText': 'file-text',
  'FlaskConical': 'flask-conical',
  'GripVertical': 'grip-vertical',
  'HardDrive': 'hard-drive',
  'Maximize2': 'maximize-2',
  'Minimize2': 'minimize-2',
  'RefreshCw': 'refresh-cw',
  'TestTube2': 'test-tube-2',
  'TouchpadIcon': 'touchpad',
  'Trash2': 'trash-2',
  'TriangleAlert': 'triangle-alert',
  'WifiOff': 'wifi-off',
  'XCircle': 'x-circle'
};

// Convert icon name to kebab-case for lucide
function getIconFileName(iconName) {
  if (iconNameMap[iconName]) {
    return iconNameMap[iconName];
  }
  return iconName.toLowerCase();
}

// Fetch SVG from GitHub
function fetchSvg(iconName) {
  return new Promise((resolve, reject) => {
    const fileName = getIconFileName(iconName);
    const url = `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/${fileName}.svg`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Failed to fetch ${iconName}: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

// Convert SVG string to React Native SVG component
function convertSvgToReactNative(svgString, iconName) {
  // Extract viewBox
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
  
  // Extract all elements
  const elements = [];
  
  // Extract paths
  const pathRegex = /<path\s+d="([^"]+)"[^>]*\/?>/g;
  let match;
  while ((match = pathRegex.exec(svgString)) !== null) {
    elements.push(`    <Path d="${match[1]}" />`);
  }
  
  // Extract circles
  const circleRegex = /<circle\s+([^>]+)\/?>/g;
  while ((match = circleRegex.exec(svgString)) !== null) {
    const attrs = match[1];
    const cx = attrs.match(/cx="([^"]+)"/)?.[1];
    const cy = attrs.match(/cy="([^"]+)"/)?.[1];
    const r = attrs.match(/r="([^"]+)"/)?.[1];
    if (cx && cy && r) {
      elements.push(`    <Circle cx="${cx}" cy="${cy}" r="${r}" />`);
    }
  }
  
  // Extract rectangles
  const rectRegex = /<rect\s+([^>]+)\/?>/g;
  while ((match = rectRegex.exec(svgString)) !== null) {
    const attrs = match[1];
    const x = attrs.match(/x="([^"]+)"/)?.[1];
    const y = attrs.match(/y="([^"]+)"/)?.[1];
    const width = attrs.match(/width="([^"]+)"/)?.[1];
    const height = attrs.match(/height="([^"]+)"/)?.[1];
    const rx = attrs.match(/rx="([^"]+)"/)?.[1];
    if (x && y && width && height) {
      if (rx) {
        elements.push(`    <Rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" />`);
      } else {
        elements.push(`    <Rect x="${x}" y="${y}" width="${width}" height="${height}" />`);
      }
    }
  }
  
  // Extract lines
  const lineRegex = /<line\s+([^>]+)\/?>/g;
  while ((match = lineRegex.exec(svgString)) !== null) {
    const attrs = match[1];
    const x1 = attrs.match(/x1="([^"]+)"/)?.[1];
    const y1 = attrs.match(/y1="([^"]+)"/)?.[1];
    const x2 = attrs.match(/x2="([^"]+)"/)?.[1];
    const y2 = attrs.match(/y2="([^"]+)"/)?.[1];
    if (x1 && y1 && x2 && y2) {
      elements.push(`    <Line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`);
    }
  }
  
  // Extract polylines
  const polylineRegex = /<polyline\s+points="([^"]+)"[^>]*\/?>/g;
  while ((match = polylineRegex.exec(svgString)) !== null) {
    elements.push(`    <Polyline points="${match[1]}" />`);
  }
  
  // Extract polygons
  const polygonRegex = /<polygon\s+points="([^"]+)"[^>]*\/?>/g;
  while ((match = polygonRegex.exec(svgString)) !== null) {
    elements.push(`    <Polygon points="${match[1]}" />`);
  }
  
  // Build component
  return `export const ${iconName}Icon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => (
  <Svg
    width={size}
    height={size}
    viewBox="${viewBox}"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
${elements.join('\n')}
  </Svg>
);`;
}

async function fetchAllIcons() {
  console.log('Fetching Lucide SVG icons from GitHub...\n');
  
  let output = `/**
 * Auto-generated Lucide icons as React Native SVG components
 * Generated on ${new Date().toISOString()}
 * Total icons: ${iconNames.length}
 */

import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';

`;
  
  const successful = [];
  const failed = [];
  
  for (const iconName of iconNames) {
    try {
      process.stdout.write(`Fetching ${iconName}...`);
      const svgString = await fetchSvg(iconName);
      const component = convertSvgToReactNative(svgString, iconName);
      output += component + '\n\n';
      successful.push(iconName);
      console.log(' ✓');
    } catch (error) {
      failed.push({ name: iconName, error: error.message });
      console.log(' ✗');
    }
  }
  
  // Write output file
  const outputPath = path.join(__dirname, '..', 'src', '_shared', 'icons', 'lucide-icons.tsx');
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, output);
  
  console.log(`\n✅ Successfully generated ${successful.length}/${iconNames.length} icons`);
  console.log(`📁 Output saved to: src/_shared/icons/lucide-icons.tsx`);
  
  if (failed.length > 0) {
    console.log(`\n⚠️  Failed icons (${failed.length}):`);
    failed.forEach(({ name, error }) => console.log(`  - ${name}: ${error}`));
  }
}

// Run the fetch
fetchAllIcons().catch(console.error);