# Lucide to React Native SVG Converter

Convert Lucide icons to optimized React Native SVG components, eliminating runtime conversion overhead and reducing bundle size.

## Why Use This?

- **Performance**: No runtime SVG-to-React Native conversion
- **Size**: Only include icons you actually use
- **Type Safety**: Full TypeScript support
- **Tree Shaking**: Import only what you need
- **Customizable**: Direct control over SVG properties

## Installation

The scripts are already included in this repository. No additional installation needed.

## Quick Start

```bash
# Convert specific icons
npm run icons trash settings user

# Auto-detect and convert all icons used in your project
npm run icons:update
```

## Available Scripts

### 1. `lucide-to-rn.js` - Main Converter Script

The primary script for converting Lucide icons to React Native SVG components.

```javascript
#!/usr/bin/env node

/**
 * Lucide to React Native SVG Converter
 * 
 * Usage:
 *   node lucide-to-rn.js <icon-names...> [options]
 * 
 * Examples:
 *   node lucide-to-rn.js trash settings user
 *   node lucide-to-rn.js trash settings --output ./icons.tsx
 *   node lucide-to-rn.js --from-imports ./src
 *   node lucide-to-rn.js --list
 *   node lucide-to-rn.js --search "arrow"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  output: null,
  fromImports: false,
  list: false,
  search: null,
  append: false,
  typescript: true,
  help: false
};

const iconNames = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--output' || arg === '-o') {
    options.output = args[++i];
  } else if (arg === '--from-imports' || arg === '-i') {
    options.fromImports = args[++i] || './src';
  } else if (arg === '--list' || arg === '-l') {
    options.list = true;
  } else if (arg === '--search' || arg === '-s') {
    options.search = args[++i];
  } else if (arg === '--append' || arg === '-a') {
    options.append = true;
  } else if (arg === '--js') {
    options.typescript = false;
  } else if (arg === '--help' || arg === '-h') {
    options.help = true;
  } else if (!arg.startsWith('-')) {
    iconNames.push(arg);
  }
}

// Show help
if (options.help || (args.length === 0 && !options.fromImports && !options.list && !options.search)) {
  console.log(`
Lucide to React Native SVG Converter

Usage:
  node lucide-to-rn.js <icon-names...> [options]

Options:
  -o, --output <path>     Output file path (default: ./lucide-icons.tsx)
  -i, --from-imports      Extract icons from imports in source files
  -l, --list              List all available Lucide icons
  -s, --search <term>     Search for icons by name
  -a, --append            Append to existing file instead of overwriting
  --js                    Generate JavaScript instead of TypeScript
  -h, --help              Show this help message

Examples:
  # Convert specific icons
  node lucide-to-rn.js trash settings user

  # Save to specific file
  node lucide-to-rn.js trash settings --output ./src/icons.tsx

  # Extract all icons used in your project
  node lucide-to-rn.js --from-imports ./src

  # Search for icons
  node lucide-to-rn.js --search "arrow"

  # List all available icons
  node lucide-to-rn.js --list
  `);
  process.exit(0);
}

// Icon name mappings (PascalCase to kebab-case)
const specialMappings = {
  'Activity': 'activity',
  'AlertCircle': 'circle-alert',
  'AlertTriangle': 'triangle-alert',
  'BarChart': 'bar-chart',
  'BarChart2': 'bar-chart-2',
  'BarChart3': 'chart-bar',
  'BarChart4': 'bar-chart-4',
  'CheckCircle': 'circle-check',
  'CheckCircle2': 'check-check',
  'ChevronDown': 'chevron-down',
  'ChevronLeft': 'chevron-left',
  'ChevronRight': 'chevron-right',
  'ChevronUp': 'chevron-up',
  'CircleCheck': 'circle-check',
  'CircleX': 'circle-x',
  'EyeOff': 'eye-off',
  'FileJson': 'file-json',
  'FileText': 'file-text',
  'FlaskConical': 'flask-conical',
  'GripVertical': 'grip-vertical',
  'HardDrive': 'hard-drive',
  'ListFilter': 'list-filter',
  'LockOpen': 'lock-open',
  'Maximize2': 'maximize-2',
  'Minimize2': 'minimize-2',
  'RefreshCw': 'refresh-cw',
  'TestTube': 'test-tube',
  'TestTube2': 'test-tube',
  'TouchpadIcon': 'touchpad',
  'Trash2': 'trash-2',
  'TriangleAlert': 'triangle-alert',
  'WifiOff': 'wifi-off',
  'XCircle': 'circle-x',
  'Filter': 'list-filter',
  'Unlock': 'lock-open'
};

// Convert icon name to file name
function getIconFileName(iconName) {
  // First check special mappings
  if (specialMappings[iconName]) {
    return specialMappings[iconName];
  }
  
  // Convert PascalCase to kebab-case
  return iconName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

// Fetch all available icons from GitHub
async function fetchAvailableIcons() {
  return new Promise((resolve, reject) => {
    https.get('https://api.github.com/repos/lucide-icons/lucide/contents/icons', {
      headers: { 'User-Agent': 'lucide-to-rn' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const files = JSON.parse(data);
          const icons = files
            .filter(f => f.name.endsWith('.svg'))
            .map(f => f.name.replace('.svg', ''));
          resolve(icons);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// List all available icons
async function listIcons() {
  try {
    console.log('Fetching available icons...\n');
    const icons = await fetchAvailableIcons();
    console.log('Available Lucide icons:');
    console.log('=======================');
    icons.forEach(icon => console.log(`  ${icon}`));
    console.log(`\nTotal: ${icons.length} icons`);
  } catch (error) {
    console.error('Failed to fetch icon list:', error.message);
  }
}

// Search for icons
async function searchIcons(term) {
  try {
    console.log(`Searching for "${term}"...\n`);
    const icons = await fetchAvailableIcons();
    const matches = icons.filter(icon => icon.includes(term.toLowerCase()));
    
    if (matches.length === 0) {
      console.log('No matching icons found.');
    } else {
      console.log('Matching icons:');
      console.log('===============');
      matches.forEach(icon => console.log(`  ${icon}`));
      console.log(`\nFound: ${matches.length} icons`);
    }
  } catch (error) {
    console.error('Failed to search icons:', error.message);
  }
}

// Extract icons from imports
function extractIconsFromImports(dir) {
  console.log(`Scanning ${dir} for lucide-react-native imports...\n`);
  
  const icons = new Set();
  
  // Find all TypeScript/JavaScript files
  const findCmd = `find ${dir} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) 2>/dev/null`;
  let files;
  try {
    files = execSync(findCmd, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
  } catch (e) {
    console.error('Failed to find files:', e.message);
    return [];
  }
  
  // Extract icon imports from each file
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Match import { Icon1, Icon2 } from 'lucide-react-native'
      const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react-native['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const imports = match[1].split(',').map(s => s.trim());
        imports.forEach(imp => {
          // Remove "as" aliases
          const iconName = imp.split(/\s+as\s+/)[0].trim();
          if (iconName && !iconName.startsWith('type ')) {
            icons.add(iconName);
          }
        });
      }
    } catch (e) {
      // Ignore read errors
    }
  });
  
  const iconList = Array.from(icons).sort();
  console.log(`Found ${iconList.length} unique icons in ${files.length} files\n`);
  return iconList;
}

// Fetch SVG from GitHub
function fetchSvg(iconName) {
  return new Promise((resolve, reject) => {
    const fileName = getIconFileName(iconName);
    const url = `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/${fileName}.svg`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
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

// Convert SVG to React Native component
function convertSvgToReactNative(svgString, iconName, typescript = true) {
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
  
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
  
  const propsType = typescript ? ': IconProps' : '';
  
  return `export const ${iconName}Icon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }${propsType}) => (
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

// Main function
async function main() {
  // Handle list command
  if (options.list) {
    await listIcons();
    return;
  }
  
  // Handle search command
  if (options.search) {
    await searchIcons(options.search);
    return;
  }
  
  // Get icons to convert
  let iconsToConvert = iconNames;
  
  if (options.fromImports) {
    const extractedIcons = extractIconsFromImports(options.fromImports);
    iconsToConvert = [...new Set([...iconsToConvert, ...extractedIcons])];
  }
  
  if (iconsToConvert.length === 0) {
    console.log('No icons to convert. Use --help for usage information.');
    return;
  }
  
  console.log(`Converting ${iconsToConvert.length} icons...\n`);
  
  // Generate output
  const ext = options.typescript ? 'tsx' : 'jsx';
  const outputPath = options.output || `./lucide-icons.${ext}`;
  
  let output = '';
  
  if (!options.append || !fs.existsSync(outputPath)) {
    output = `/**
 * Lucide icons as React Native SVG components
 * Generated on ${new Date().toISOString()}
 * Icons: ${iconsToConvert.join(', ')}
 */

import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';
`;
    
    if (options.typescript) {
      output += `
interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  [key: string]: any;
}
`;
    }
    
    output += '\n';
  } else {
    output = fs.readFileSync(outputPath, 'utf-8');
  }
  
  const successful = [];
  const failed = [];
  
  for (const iconName of iconsToConvert) {
    try {
      process.stdout.write(`Converting ${iconName}...`);
      const svgString = await fetchSvg(iconName);
      const component = convertSvgToReactNative(svgString, iconName, options.typescript);
      
      // Check if icon already exists
      if (!output.includes(`export const ${iconName}Icon`)) {
        output += '\n' + component + '\n';
        successful.push(iconName);
        console.log(' ✓');
      } else {
        console.log(' (already exists)');
      }
    } catch (error) {
      failed.push({ name: iconName, error: error.message });
      console.log(' ✗');
    }
  }
  
  // Write output
  fs.writeFileSync(outputPath, output);
  
  console.log(`\n✅ Successfully converted ${successful.length} icons`);
  if (failed.length > 0) {
    console.log(`⚠️  Failed: ${failed.length} icons`);
    failed.forEach(({ name, error }) => console.log(`  - ${name}: ${error}`));
  }
  console.log(`📁 Output saved to: ${outputPath}`);
}

// Run
main().catch(console.error);
```

### 2. Helper Scripts (Optional)

These additional scripts were used during development but can be useful for specific tasks:

#### `fetch-lucide-svgs.js` - Batch Fetch Icons
```javascript
// Fetches a predefined list of icons
// Useful for initial setup or bulk conversion
```

#### `fetch-missing-icons.js` - Fetch Specific Missing Icons
```javascript
// Fetches icons that failed in the initial conversion
// Handles special name mappings
```

## Usage Examples

### Basic Conversion

```bash
# Convert specific icons
node scripts/lucide-to-rn.js trash settings user clock

# Output:
# Converting 4 icons...
# Converting trash... ✓
# Converting settings... ✓
# Converting user... ✓
# Converting clock... ✓
# ✅ Successfully converted 4 icons
# 📁 Output saved to: ./lucide-icons.tsx
```

### Auto-detect from Codebase

```bash
# Scan your entire project and convert all imported icons
node scripts/lucide-to-rn.js --from-imports ./src --output ./src/icons.tsx

# Or use the npm script
npm run icons:update
```

### Search for Icons

```bash
# Find all arrow-related icons
node scripts/lucide-to-rn.js --search arrow

# Output:
# Searching for "arrow"...
# 
# Matching icons:
# ===============
#   arrow-big-down
#   arrow-big-left
#   arrow-big-right
#   arrow-big-up
#   arrow-down
#   arrow-left
#   arrow-right
#   arrow-up
#   ...
```

### List All Available Icons

```bash
# See all 1000+ available Lucide icons
node scripts/lucide-to-rn.js --list
```

### Append to Existing File

```bash
# Add new icons without overwriting existing ones
node scripts/lucide-to-rn.js user badge --append --output ./src/icons.tsx
```

### Generate JavaScript Instead of TypeScript

```bash
# For projects not using TypeScript
node scripts/lucide-to-rn.js trash settings --js --output ./icons.js
```

## NPM Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "icons": "node scripts/lucide-to-rn.js",
    "icons:update": "node scripts/lucide-to-rn.js --from-imports ./src --output ./src/_shared/icons/lucide-icons.tsx",
    "icons:list": "node scripts/lucide-to-rn.js --list",
    "icons:search": "node scripts/lucide-to-rn.js --search"
  }
}
```

## Using the Generated Icons

Once converted, import and use the icons in your React Native components:

```tsx
import { TrashIcon, SettingsIcon, UserIcon } from './icons/lucide-icons';

function MyComponent() {
  return (
    <View>
      <TrashIcon size={24} color="#FF0000" />
      <SettingsIcon size={32} color="#0000FF" strokeWidth={1.5} />
      <UserIcon size={20} color="#00FF00" />
    </View>
  );
}
```

## Icon Props

All generated icons accept the following props:

- `size` (number): Icon size in pixels (default: 24)
- `color` (string): Stroke color (default: "currentColor")
- `strokeWidth` (number): Stroke width (default: 2)
- `...props`: Any additional SVG props

## Benefits Over lucide-react-native

1. **No Runtime Conversion**: Icons are pre-converted to React Native SVG
2. **Smaller Bundle**: Only include icons you actually use
3. **Better Performance**: No conversion overhead at runtime
4. **Full Control**: Modify generated icons if needed
5. **Tree Shaking**: Bundlers can eliminate unused icons

## Troubleshooting

### Icon Not Found

If an icon fails to convert, it might have a different name in the Lucide repository. Check the name mappings in the script or search for the icon:

```bash
node scripts/lucide-to-rn.js --search "part-of-icon-name"
```

### Special Name Mappings

Some icons have different names in the Lucide repository. The script handles these automatically:

- `AlertCircle` → `circle-alert`
- `CheckCircle` → `circle-check`
- `Filter` → `list-filter`
- `Unlock` → `lock-open`
- And more...

### File Permissions

Make sure the script is executable:

```bash
chmod +x scripts/lucide-to-rn.js
```

## Contributing

To add new name mappings or improve the converter, edit the `specialMappings` object in `lucide-to-rn.js`.

## License

This tool is part of the react-native-react-query-devtools project.