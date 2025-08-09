#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Final missing icons
const finalIcons = {
  'BarChart3': 'chart-bar',
  'CheckCircle2': 'check-check'
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

async function fetchFinalIcons() {
  console.log('Fetching final missing icons...\n');
  
  let additionalComponents = '';
  
  for (const [iconName, fileName] of Object.entries(finalIcons)) {
    try {
      process.stdout.write(`Fetching ${iconName} (${fileName})...`);
      const svgString = await fetchSvg(iconName, fileName);
      const component = convertSvgToReactNative(svgString, iconName);
      additionalComponents += component + '\n\n';
      console.log(' ✓');
    } catch (error) {
      console.log(' ✗ - ' + error.message);
    }
  }
  
  if (additionalComponents) {
    // Read existing file and append new icons
    const outputPath = path.join(__dirname, '..', 'src', '_shared', 'icons', 'lucide-icons.tsx');
    const existingContent = fs.readFileSync(outputPath, 'utf-8');
    
    // Add the new components
    const updatedContent = existingContent + '\n' + additionalComponents;
    
    fs.writeFileSync(outputPath, updatedContent);
    
    console.log(`\n✅ All icons have been generated!`);
    console.log(`📁 Complete file at: src/_shared/icons/lucide-icons.tsx`);
  }
}

// Run the fetch
fetchFinalIcons().catch(console.error);