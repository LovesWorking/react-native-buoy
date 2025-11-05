#!/bin/bash

# Script to link all @react-buoy packages to wb-mobile-app for local development
# This uses the pnpm workspace protocol

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RN_BUOY_ROOT="/Users/austinjohnson/Desktop/rn-buoy"
WB_MOBILE_APP_ROOT="/Users/austinjohnson/Desktop/wb-mobile-app"

# Array of packages to link (package-folder-name:npm-package-name)
PACKAGES=(
  "devtools-floating-menu:@react-buoy/core"
  "shared:@react-buoy/shared-ui"
  "env-tools:@react-buoy/env"
  "network:@react-buoy/network"
  "storage:@react-buoy/storage"
  "debug-borders:@react-buoy/debug-borders"
  "route-events:@react-buoy/route-events"
  "react-query:@react-buoy/react-query"
)

echo -e "${BLUE}🔗 React Native Buoy - Link to Development App${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Check if directories exist
if [ ! -d "$RN_BUOY_ROOT" ]; then
  echo -e "${RED}❌ Error: rn-buoy directory not found at $RN_BUOY_ROOT${NC}"
  exit 1
fi

if [ ! -d "$WB_MOBILE_APP_ROOT" ]; then
  echo -e "${RED}❌ Error: wb-mobile-app directory not found at $WB_MOBILE_APP_ROOT${NC}"
  exit 1
fi

# Check for jq
if ! command -v jq &> /dev/null; then
  echo -e "${RED}❌ Error: jq is not installed${NC}"
  echo -e "${YELLOW}Install with: brew install jq${NC}"
  exit 1
fi

# Backup original files
echo -e "${YELLOW}📋 Creating backups...${NC}"
cp "$WB_MOBILE_APP_ROOT/package.json" "$WB_MOBILE_APP_ROOT/package.json.backup"
if [ -f "$WB_MOBILE_APP_ROOT/pnpm-workspace.yaml" ]; then
  cp "$WB_MOBILE_APP_ROOT/pnpm-workspace.yaml" "$WB_MOBILE_APP_ROOT/pnpm-workspace.yaml.backup"
fi
if [ -f "$WB_MOBILE_APP_ROOT/.npmrc" ]; then
  cp "$WB_MOBILE_APP_ROOT/.npmrc" "$WB_MOBILE_APP_ROOT/.npmrc.backup"
fi
if [ -f "$WB_MOBILE_APP_ROOT/metro.config.js" ]; then
  cp "$WB_MOBILE_APP_ROOT/metro.config.js" "$WB_MOBILE_APP_ROOT/metro.config.js.backup"
fi
echo -e "${GREEN}✅ Backups created${NC}\n"

# Step 1: Create .npmrc to skip prepare scripts
echo -e "${YELLOW}⚙️  Step 1: Configuring pnpm to skip prepare scripts...${NC}"
cat > "$WB_MOBILE_APP_ROOT/.npmrc" << 'EOF'
# Skip prepare scripts for linked packages (they don't have builder-bob installed)
ignore-scripts=true
EOF
echo -e "${GREEN}✅ .npmrc configured${NC}\n"

# Step 2: Create pnpm-workspace.yaml to treat linked packages as workspace
echo -e "${YELLOW}🔗 Step 2: Creating pnpm-workspace.yaml...${NC}"
cat > "$WB_MOBILE_APP_ROOT/pnpm-workspace.yaml" << 'EOF'
packages:
  # Link to rn-buoy packages
  - '../rn-buoy/packages/*'
EOF
echo -e "${GREEN}✅ pnpm-workspace.yaml created${NC}\n"

# Step 3: Update package.json to use workspace protocol
echo -e "${YELLOW}🔗 Step 3: Updating package.json with workspace: references...${NC}"
cd "$WB_MOBILE_APP_ROOT"

# Build the jq update expression
JQ_UPDATES=""
for package_info in "${PACKAGES[@]}"; do
  IFS=':' read -r folder_name npm_name <<< "$package_info"
  package_path="$RN_BUOY_ROOT/packages/$folder_name"

  if [ -d "$package_path" ]; then
    echo -e "  ${BLUE}→${NC} Linking $npm_name to workspace:*"
    if [ -z "$JQ_UPDATES" ]; then
      JQ_UPDATES=".dependencies[\"$npm_name\"] = \"workspace:*\""
    else
      JQ_UPDATES="$JQ_UPDATES | .dependencies[\"$npm_name\"] = \"workspace:*\""
    fi
  else
    echo -e "  ${YELLOW}⚠${NC}  Package not found: $folder_name (skipping)"
  fi
done

# Apply updates to package.json
jq "$JQ_UPDATES" package.json > package.json.tmp && mv package.json.tmp package.json

echo -e "${GREEN}✅ package.json updated${NC}\n"

# Step 4: Create/Update metro.config.js
echo -e "${YELLOW}⚙️  Step 4: Configuring Metro bundler...${NC}"
cat > "$WB_MOBILE_APP_ROOT/metro.config.js" << 'METROEOF'
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the default Expo Metro config
const config = getDefaultConfig(__dirname);

// Add support for symlinked packages (workspace linking)
config.watchFolders = [
  __dirname,
  // Add rn-buoy packages directory so Metro can watch for changes
  path.resolve(__dirname, '../rn-buoy/packages'),
];

// Configure resolver to handle symlinks
config.resolver = {
  ...config.resolver,
  // Enable symlink resolution
  unstable_enableSymlinks: true,
  // Ensure node_modules are resolved correctly
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '../rn-buoy/node_modules'),
  ],
};

module.exports = config;
METROEOF
echo -e "${GREEN}✅ Metro config created${NC}\n"

# Step 5: Install dependencies
echo -e "${YELLOW}📦 Step 5: Installing dependencies with workspace links...${NC}"
pnpm install

echo -e "${GREEN}✅ Dependencies installed with workspace links${NC}\n"

# Step 6: Success message and instructions
echo -e "${GREEN}🎉 Setup complete!${NC}\n"
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Make changes in ${YELLOW}$RN_BUOY_ROOT${NC}"
echo -e "  2. Changes will be reflected instantly in ${YELLOW}$WB_MOBILE_APP_ROOT${NC}"
echo -e "  3. Metro bundler will pick up changes automatically"
echo -e ""
echo -e "${BLUE}Important notes:${NC}"
echo -e "  • Metro resolves to source files via 'react-native' field"
echo -e "  • Most JS/TS changes are instant (no rebuild needed)"
echo -e "  • Native changes require rebuilding the app"
echo -e "  • Backups saved: package.json.backup, .npmrc.backup, pnpm-workspace.yaml.backup"
echo -e ""
echo -e "${BLUE}Troubleshooting:${NC}"
echo -e "  • If changes aren't reflected, try clearing Metro cache:"
echo -e "    ${YELLOW}cd $WB_MOBILE_APP_ROOT && pnpm start --clear${NC}"
echo -e "  • Rebuild the app if native code changed:"
echo -e "    ${YELLOW}cd $WB_MOBILE_APP_ROOT && pnpm run ios${NC} (or android)"
echo -e ""
echo -e "${BLUE}To restore:${NC}"
echo -e "  ${YELLOW}./scripts/unlink-from-dev-app.sh${NC}"
echo -e ""
