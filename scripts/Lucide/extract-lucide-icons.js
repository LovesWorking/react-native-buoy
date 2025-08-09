#!/usr/bin/env node

/**
 * Script to extract Lucide icons as React Native SVG components
 * This fetches the SVG data for each icon and converts it to React Native SVG format
 */

const fs = require('fs');
const path = require('path');

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

// Convert icon name to kebab-case for lucide
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

// Convert SVG string to React Native SVG component
function convertSvgToReactNative(svgString, iconName) {
  // Extract viewBox
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
  
  // Extract all path data
  const paths = [];
  const pathRegex = /<path\s+d="([^"]+)"[^>]*>/g;
  let match;
  while ((match = pathRegex.exec(svgString)) !== null) {
    paths.push(match[1]);
  }
  
  // Extract circles
  const circles = [];
  const circleRegex = /<circle\s+([^>]+)>/g;
  while ((match = circleRegex.exec(svgString)) !== null) {
    const attrs = match[1];
    const cx = attrs.match(/cx="([^"]+)"/)?.[1];
    const cy = attrs.match(/cy="([^"]+)"/)?.[1];
    const r = attrs.match(/r="([^"]+)"/)?.[1];
    if (cx && cy && r) {
      circles.push({ cx, cy, r });
    }
  }
  
  // Extract rectangles
  const rects = [];
  const rectRegex = /<rect\s+([^>]+)>/g;
  while ((match = rectRegex.exec(svgString)) !== null) {
    const attrs = match[1];
    const x = attrs.match(/x="([^"]+)"/)?.[1];
    const y = attrs.match(/y="([^"]+)"/)?.[1];
    const width = attrs.match(/width="([^"]+)"/)?.[1];
    const height = attrs.match(/height="([^"]+)"/)?.[1];
    const rx = attrs.match(/rx="([^"]+)"/)?.[1];
    if (x && y && width && height) {
      rects.push({ x, y, width, height, rx });
    }
  }
  
  // Extract lines
  const lines = [];
  const lineRegex = /<line\s+([^>]+)>/g;
  while ((match = lineRegex.exec(svgString)) !== null) {
    const attrs = match[1];
    const x1 = attrs.match(/x1="([^"]+)"/)?.[1];
    const y1 = attrs.match(/y1="([^"]+)"/)?.[1];
    const x2 = attrs.match(/x2="([^"]+)"/)?.[1];
    const y2 = attrs.match(/y2="([^"]+)"/)?.[1];
    if (x1 && y1 && x2 && y2) {
      lines.push({ x1, y1, x2, y2 });
    }
  }
  
  // Extract polylines
  const polylines = [];
  const polylineRegex = /<polyline\s+points="([^"]+)"[^>]*>/g;
  while ((match = polylineRegex.exec(svgString)) !== null) {
    polylines.push(match[1]);
  }
  
  // Extract polygons
  const polygons = [];
  const polygonRegex = /<polygon\s+points="([^"]+)"[^>]*>/g;
  while ((match = polygonRegex.exec(svgString)) !== null) {
    polygons.push(match[1]);
  }
  
  // Build component
  let component = `export const ${iconName}Icon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => (
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
  >`;
  
  // Add paths
  paths.forEach(d => {
    component += `\n    <Path d="${d}" />`;
  });
  
  // Add circles
  circles.forEach(({ cx, cy, r }) => {
    component += `\n    <Circle cx="${cx}" cy="${cy}" r="${r}" />`;
  });
  
  // Add rectangles
  rects.forEach(({ x, y, width, height, rx }) => {
    if (rx) {
      component += `\n    <Rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" />`;
    } else {
      component += `\n    <Rect x="${x}" y="${y}" width="${width}" height="${height}" />`;
    }
  });
  
  // Add lines
  lines.forEach(({ x1, y1, x2, y2 }) => {
    component += `\n    <Line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  });
  
  // Add polylines
  polylines.forEach(points => {
    component += `\n    <Polyline points="${points}" />`;
  });
  
  // Add polygons
  polygons.forEach(points => {
    component += `\n    <Polygon points="${points}" />`;
  });
  
  component += '\n  </Svg>\n);\n';
  
  return component;
}

async function extractIcons() {
  console.log('Extracting Lucide icons...\n');
  
  try {
    // Try to import lucide-react to get SVG data
    const lucide = require('lucide-react-native');
    
    let output = `/**
 * Auto-generated Lucide icons as React Native SVG components
 * Generated on ${new Date().toISOString()}
 */

import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';

`;
    
    const failedIcons = [];
    
    for (const iconName of iconNames) {
      try {
        const Icon = lucide[iconName];
        if (!Icon) {
          console.log(`⚠️  Icon not found: ${iconName}`);
          failedIcons.push(iconName);
          continue;
        }
        
        // Try to get the SVG string from the icon
        // This is a bit hacky but lucide icons have consistent structure
        const kebabName = toKebabCase(iconName);
        
        // Since we can't easily extract SVG from lucide-react-native,
        // we'll use the known SVG structure
        // For now, create a placeholder that can be manually filled
        
        output += `// ${iconName}\n`;
        output += `export const ${iconName}Icon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => {
  const Icon = require('lucide-react-native').${iconName};
  return <Icon size={size} color={color} strokeWidth={strokeWidth} {...props} />;
};\n\n`;
        
        console.log(`✓ Processed ${iconName}`);
      } catch (error) {
        console.log(`✗ Failed to process ${iconName}:`, error.message);
        failedIcons.push(iconName);
      }
    }
    
    // Write output file
    const outputPath = path.join(__dirname, '..', 'src', '_shared', 'icons', 'lucide-icons.tsx');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, output);
    
    console.log(`\n✅ Generated ${iconNames.length - failedIcons.length} icons`);
    console.log(`📁 Output saved to: ${outputPath}`);
    
    if (failedIcons.length > 0) {
      console.log(`\n⚠️  Failed icons (${failedIcons.length}):`);
      failedIcons.forEach(icon => console.log(`  - ${icon}`));
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    // Fallback: generate template file for manual conversion
    console.log('\nGenerating template file for manual conversion...');
    generateTemplate();
  }
}

function generateTemplate() {
  const output = `/**
 * Lucide icons as React Native SVG components
 * Template for manual conversion
 * 
 * To get SVG data for each icon:
 * 1. Visit https://lucide.dev/icons
 * 2. Search for each icon
 * 3. Copy the SVG code
 * 4. Convert to React Native SVG format
 */

import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';

${iconNames.map(iconName => `
// ${iconName}
// Get SVG from: https://lucide.dev/icons/${toKebabCase(iconName)}
export const ${iconName}Icon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* TODO: Add path data here */}
    <Path d="" />
  </Svg>
);`).join('\n')}
`;
  
  const outputPath = path.join(__dirname, '..', 'src', '_shared', 'icons', 'lucide-icons-template.tsx');
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, output);
  console.log(`📁 Template saved to: ${outputPath}`);
}

// Run the extraction
extractIcons().catch(console.error);