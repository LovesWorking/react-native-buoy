#!/bin/bash

# Script to unlink all @react-buoy packages from wb-mobile-app
# This restores the app to use npm-published versions

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
WB_MOBILE_APP_ROOT="/Users/austinjohnson/Desktop/wb-mobile-app"

echo -e "${BLUE}🔓 React Native Buoy - Unlink from Development App${NC}"
echo -e "${BLUE}====================================================${NC}\n"

# Check if wb-mobile-app exists
if [ ! -d "$WB_MOBILE_APP_ROOT" ]; then
  echo -e "${RED}❌ Error: wb-mobile-app directory not found at $WB_MOBILE_APP_ROOT${NC}"
  exit 1
fi

cd "$WB_MOBILE_APP_ROOT"

# Check if backup exists
if [ ! -f "package.json.backup" ]; then
  echo -e "${RED}❌ Error: No package.json.backup found${NC}"
  echo -e "${YELLOW}Cannot restore original package.json${NC}"
  echo -e ""
  echo -e "You may need to manually restore package.json or reinstall from npm:"
  echo -e "  ${YELLOW}pnpm install${NC}"
  exit 1
fi

# Step 1: Restore original files
echo -e "${YELLOW}📋 Step 1: Restoring original files...${NC}"
mv package.json.backup package.json

# Restore or remove pnpm-workspace.yaml
if [ -f "pnpm-workspace.yaml.backup" ]; then
  mv pnpm-workspace.yaml.backup pnpm-workspace.yaml
  echo -e "  ${BLUE}→${NC} Restored pnpm-workspace.yaml from backup"
else
  rm -f pnpm-workspace.yaml
  echo -e "  ${BLUE}→${NC} Removed pnpm-workspace.yaml"
fi

# Restore or remove .npmrc
if [ -f ".npmrc.backup" ]; then
  mv .npmrc.backup .npmrc
  echo -e "  ${BLUE}→${NC} Restored .npmrc from backup"
else
  rm -f .npmrc
  echo -e "  ${BLUE}→${NC} Removed .npmrc"
fi

# Restore or remove metro.config.js
if [ -f "metro.config.js.backup" ]; then
  mv metro.config.js.backup metro.config.js
  echo -e "  ${BLUE}→${NC} Restored metro.config.js from backup"
else
  rm -f metro.config.js
  echo -e "  ${BLUE}→${NC} Removed metro.config.js"
fi

echo -e "${GREEN}✅ Files restored${NC}\n"

# Step 2: Remove node_modules and lockfile
echo -e "${YELLOW}🗑️  Step 2: Cleaning node_modules and lockfile...${NC}"
rm -rf node_modules pnpm-lock.yaml
echo -e "${GREEN}✅ Cleaned${NC}\n"

# Step 3: Reinstall packages from npm
echo -e "${YELLOW}📦 Step 3: Reinstalling packages from npm...${NC}"
pnpm install
echo -e "${GREEN}✅ Packages reinstalled from npm${NC}\n"

# Step 4: Success message
echo -e "${GREEN}🎉 Unlink complete!${NC}\n"
echo -e "${BLUE}wb-mobile-app is now using published npm packages.${NC}"
echo -e ""
echo -e "To link again for development, run:"
echo -e "  ${YELLOW}cd /Users/austinjohnson/Desktop/rn-buoy && ./scripts/link-to-dev-app.sh${NC}"
echo -e ""
