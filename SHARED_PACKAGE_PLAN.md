# Shared Package Implementation Plan

## Overview
Create a shared package that provides common UI components, hooks, and utilities to all other packages in the monorepo. This will serve as the foundation for code reuse and consistency across all packages.

## Goals
1. **Centralize common code** - Single source of truth for shared functionality
2. **Enable hot reload** - Changes to shared package instantly reflect in consuming packages
3. **Support tree-shaking** - Packages only bundle what they use
4. **Maintain TypeScript support** - Full type safety across package boundaries
5. **Test integration patterns** - Verify the monorepo structure works before scaling

## Package Structure

```
packages/shared/
├── src/
│   ├── index.ts                 # Main barrel export
│   ├── ui/
│   │   ├── Button.tsx           # Customizable button component
│   │   ├── Card.tsx             # Container component with styling
│   │   └── index.ts             # UI components barrel export
│   ├── hooks/
│   │   ├── useCounter.ts        # Counter state management hook
│   │   ├── useToggle.ts         # Boolean toggle hook
│   │   └── index.ts             # Hooks barrel export
│   └── utils/
│       ├── formatters.ts        # Number/string formatting utilities
│       ├── helpers.ts           # General helper functions
│       └── index.ts             # Utils barrel export
├── package.json                 # Package configuration
├── tsconfig.json                # TypeScript configuration
└── bob.config.js                # Build configuration (if needed)
```

## Components to Build

### UI Components

#### Button Component
```typescript
// Features:
- variant: 'primary' | 'secondary' | 'danger'
- size: 'small' | 'medium' | 'large'
- onPress handler
- disabled state
- loading state with ActivityIndicator
```

#### Card Component
```typescript
// Features:
- Custom padding
- Shadow/elevation
- Border radius
- Background color
- Children content
```

### Custom Hooks

#### useCounter Hook
```typescript
// Returns:
- count: number
- increment: () => void
- decrement: () => void
- reset: () => void
- setValue: (value: number) => void
```

#### useToggle Hook
```typescript
// Returns:
- isOn: boolean
- toggle: () => void
- setOn: () => void
- setOff: () => void
```

### Utility Functions

#### formatNumber
```typescript
// Examples:
formatNumber(1000) => "1,000"
formatNumber(1000000) => "1,000,000"
```

#### debounce
```typescript
// Usage:
const debouncedSearch = debounce(searchFunction, 300)
```

## Integration Plan

### Phase 1: Create Shared Package
1. Create package structure
2. Configure package.json with Bob
3. Set up TypeScript configuration
4. Configure exports for proper module resolution

### Phase 2: Implement Components
1. Build Button component with all variants
2. Build Card component with styling options
3. Create useCounter hook with full functionality
4. Create useToggle hook
5. Implement utility functions

### Phase 3: Update Existing Packages
1. **Package-1 Integration:**
   - Import and use Button component
   - Replace local state with useCounter hook
   - Use formatNumber utility

2. **Package-2 Integration:**
   - Import and use Card component
   - Implement useToggle for feature flags
   - Use debounce utility

### Phase 4: Testing
1. Verify hot reload works when editing shared components
2. Test that changes propagate to all consuming packages
3. Ensure TypeScript types flow correctly
4. Verify build process includes only used exports

## Package Configuration

### package.json Structure
```json
{
  "name": "@react-buoy/shared-ui",
  "version": "0.1.0",
  "main": "lib/commonjs/index.js",
  "module": "lib/module/index.js",
  "types": "lib/typescript/index.d.ts",
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "import": "./lib/module/index.js",
      "require": "./lib/commonjs/index.js",
      "types": "./lib/typescript/index.d.ts"
    },
    "./ui": {
      "source": "./src/ui/index.ts",
      "import": "./lib/module/ui/index.js",
      "require": "./lib/commonjs/ui/index.js"
    },
    "./hooks": {
      "source": "./src/hooks/index.ts",
      "import": "./lib/module/hooks/index.js",
      "require": "./lib/commonjs/hooks/index.js"
    },
    "./utils": {
      "source": "./src/utils/index.ts",
      "import": "./lib/module/utils/index.js",
      "require": "./lib/commonjs/utils/index.js"
    }
  }
}
```

### Dependency Configuration
- Shared package has React/React Native as peer dependencies
- Other packages reference shared as: `"@react-buoy/shared-ui": "workspace:*"`
- Example app gets shared transitively through other packages

## Success Metrics

### Must Have
- ✅ All packages can import from shared
- ✅ Hot reload works across package boundaries
- ✅ TypeScript types are properly exported
- ✅ No circular dependencies
- ✅ Build succeeds for all packages

### Nice to Have
- ✅ Tree-shaking removes unused exports
- ✅ Source maps work for debugging
- ✅ Bundle size is optimized

## Testing Scenarios

1. **Hot Reload Test**
   - Edit Button text in shared package
   - Verify change appears in running app without rebuild

2. **Type Safety Test**
   - Add new prop to Button
   - Verify TypeScript errors in consuming packages until updated

3. **Build Test**
   - Run `pnpm build` in root
   - Verify all packages build successfully

4. **Import Test**
   - Import specific exports: `import { Button } from '@react-buoy/shared-ui/ui'`
   - Import from barrel: `import { Button, useCounter } from '@react-buoy/shared-ui'`

## Potential Issues & Solutions

### Issue: Circular Dependencies
**Solution:** Shared package cannot import from other packages

### Issue: Hot Reload Not Working
**Solution:** Ensure Metro config watches shared package source files

### Issue: TypeScript Types Not Found
**Solution:** Configure paths in tsconfig, ensure types are built

### Issue: Bundle Size Too Large
**Solution:** Use specific imports, configure tree-shaking

## Next Steps After Implementation

1. **Add Theming System** - Centralized theme provider
2. **Add Icon Library** - Shared icon components
3. **Add Animation Presets** - Reusable animations
4. **Add Form Components** - Input, Select, etc.
5. **Add Layout Components** - Stack, Grid, Spacer

## Commands Reference

```bash
# Create shared package
cd packages && mkdir shared && cd shared

# Install dependencies
pnpm add -D react-native-builder-bob

# Build shared package
pnpm build

# Watch for changes (if supported)
pnpm dev

# Test in example app
cd ../../example && pnpm start
```

## Questions to Consider

1. Should shared package be published to npm?
2. Should we version shared package independently?
3. Do we need separate shared packages (shared-ui, shared-hooks)?
4. Should shared package include business logic or just primitives?
5. How do we handle platform-specific code?

## Timeline

- **15 minutes**: Create package structure and configuration
- **20 minutes**: Implement all components, hooks, and utilities
- **10 minutes**: Integrate with existing packages
- **10 minutes**: Test hot reload and builds
- **5 minutes**: Documentation and cleanup

**Total: ~1 hour**