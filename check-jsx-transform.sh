#!/bin/bash

# Simple shell script to check for outdated JSX transform patterns
# Usage: ./check-jsx-transform.sh

echo "🔍 Checking for outdated JSX transform patterns..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
total_files=0
issues_found=0

echo "📁 Scanning src/ directory for React files..."
echo ""

# Find all React files
react_files=$(find src -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" | grep -v node_modules)

for file in $react_files; do
    ((total_files++))
    has_issues=false
    
    # Check for unnecessary React imports
    react_import_line=$(grep -n "^import React from ['\"]react['\"]" "$file" 2>/dev/null)
    has_jsx=$(grep -l "<[A-Za-z]" "$file" 2>/dev/null)
    
    # Check if file has JSX but imports React unnecessarily
    if [[ -n "$react_import_line" && -n "$has_jsx" ]]; then
        # Check if React is used directly (not just for JSX)
        react_usage=$(grep -E "React\.(Component|PureComponent|memo|forwardRef|use[A-Z]|Fragment|Children|createElement|cloneElement)" "$file" 2>/dev/null)
        
        if [[ -z "$react_usage" ]]; then
            if [[ "$has_issues" == false ]]; then
                echo -e "${RED}❌ Issues found in: ${file}${NC}"
                has_issues=true
                ((issues_found++))
            fi
            line_num=$(echo "$react_import_line" | cut -d: -f1)
            echo -e "   ${YELLOW}⚠️  Line $line_num: Unnecessary React import${NC}"
            echo "      $(echo "$react_import_line" | cut -d: -f2-)"
        fi
    fi
    
    # Check for React.createElement calls
    create_element_calls=$(grep -n "React\.createElement" "$file" 2>/dev/null)
    if [[ -n "$create_element_calls" ]]; then
        if [[ "$has_issues" == false ]]; then
            echo -e "${RED}❌ Issues found in: ${file}${NC}"
            has_issues=true
            ((issues_found++))
        fi
        echo -e "   ${YELLOW}⚠️  Manual React.createElement calls found:${NC}"
        echo "$create_element_calls" | while read -r line; do
            line_num=$(echo "$line" | cut -d: -f1)
            echo "      Line $line_num: $(echo "$line" | cut -d: -f2- | xargs)"
        done
    fi
    
    if [[ "$has_issues" == true ]]; then
        echo ""
    fi
done

echo ""
echo "📊 Summary:"
echo "==========="
echo -e "${BLUE}📁 Files checked: $total_files${NC}"

if [[ $issues_found -eq 0 ]]; then
    echo -e "${GREEN}🎉 No JSX transform issues found!${NC}"
    echo -e "${GREEN}   Your app is using modern JSX transform correctly.${NC}"
else
    echo -e "${RED}❌ Files with issues: $issues_found${NC}"
    echo ""
    echo -e "${YELLOW}💡 To fix these issues automatically, run:${NC}"
    echo "   node check-jsx-transform.js --fix"
    echo ""
    echo -e "${YELLOW}💡 Manual fixes needed:${NC}"
    echo "   1. Remove unnecessary 'import React from \"react\"' statements"
    echo "   2. Replace React.createElement with JSX syntax"
    echo "   3. Keep React imports only when using React APIs directly"
fi

echo ""
echo "🔧 Configuration Check:"
echo "======================="

# Check tsconfig.json
if [[ -f "tsconfig.json" ]]; then
    jsx_setting=$(grep -o '"jsx":\s*"[^"]*"' tsconfig.json 2>/dev/null | cut -d'"' -f4)
    if [[ "$jsx_setting" == "react-jsx" || "$jsx_setting" == "react-jsxdev" ]]; then
        echo -e "${GREEN}✅ tsconfig.json: jsx set to \"$jsx_setting\" (modern transform)${NC}"
    else
        echo -e "${YELLOW}⚠️  tsconfig.json: jsx set to \"$jsx_setting\" (consider \"react-jsx\")${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  tsconfig.json not found${NC}"
fi

# Check React version
if [[ -f "package.json" ]]; then
    react_version=$(grep -o '"react":\s*"[^"]*"' package.json 2>/dev/null | cut -d'"' -f4)
    if [[ -n "$react_version" ]]; then
        major_version=$(echo "$react_version" | grep -o '[0-9]\+' | head -1)
        if [[ $major_version -ge 17 ]]; then
            echo -e "${GREEN}✅ React version: $react_version (supports modern JSX transform)${NC}"
        else
            echo -e "${YELLOW}⚠️  React version: $react_version (upgrade to 17+ for modern JSX transform)${NC}"
        fi
    fi
fi

echo ""

# Exit with error code if issues found
if [[ $issues_found -gt 0 ]]; then
    exit 1
fi