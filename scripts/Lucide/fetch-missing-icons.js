#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Missing icons with correct mappings
const missingIcons = {
  'AlertCircle': 'circle-alert',
  'AlertTriangle': 'triangle-alert',
  'BarChart3': 'bar-chart-3',
  'CheckCircle': 'circle-check',
  'CheckCircle2': 'circle-check-2',
  'Filter': 'list-filter',
  'TestTube2': 'test-tube',
  'Unlock': 'lock-open',
  'XCircle': 'circle-x'
};

// Fetch SVG from GitHub
function fetchSvg(iconName, fileName) {
  return new Promise((resolve, reject) => {
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
          reject(new Error(`Failed to fetch ${iconName} (${fileName}): ${res.statusCode}`));
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

async function fetchMissingIcons() {
  console.log('Fetching missing Lucide icons...\n');
  
  let additionalComponents = '';
  const successful = [];
  const failed = [];
  
  for (const [iconName, fileName] of Object.entries(missingIcons)) {
    try {
      process.stdout.write(`Fetching ${iconName} (${fileName})...`);
      const svgString = await fetchSvg(iconName, fileName);
      const component = convertSvgToReactNative(svgString, iconName);
      additionalComponents += component + '\n\n';
      successful.push(iconName);
      console.log(' ✓');
    } catch (error) {
      failed.push({ name: iconName, error: error.message });
      console.log(' ✗');
    }
  }
  
  if (successful.length > 0) {
    // Read existing file and append new icons
    const outputPath = path.join(__dirname, '..', 'src', '_shared', 'icons', 'lucide-icons.tsx');
    const existingContent = fs.readFileSync(outputPath, 'utf-8');
    
    // Add the new components before the last line
    const updatedContent = existingContent + '\n' + additionalComponents;
    
    fs.writeFileSync(outputPath, updatedContent);
    
    console.log(`\n✅ Successfully added ${successful.length} missing icons`);
  }
  
  if (failed.length > 0) {
    console.log(`\n⚠️  Still failed (${failed.length}):`);
    failed.forEach(({ name, error }) => console.log(`  - ${name}: ${error}`));
  }
}

// Run the fetch
fetchMissingIcons().catch(console.error);