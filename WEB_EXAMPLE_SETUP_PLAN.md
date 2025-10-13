# React Web Example App Setup Plan

## Goal
Create a React web example app with hot reloading to test the floating menu for web (not React Native web, pure web). The setup should mirror the existing `example/` React Native app structure with instant hot reload of workspace packages.

---

## Current Setup Analysis

### Existing Structure
- **Workspace**: pnpm monorepo with workspaces for `packages/*` and `example`
- **RN Example**: Uses Expo with `workspace:*` dependencies that hot reload via TypeScript path mapping
- **Target**: Create web equivalent that mirrors this hot reload behavior

### Key Requirements
1. Hot reload packages without building (like the RN example)
2. Same workspace structure - web example lives alongside current RN example
3. Test floating menu incrementally during development
4. Minimal setup - start testing quickly

---

## Proposed Architecture

### Recommended: Separate `example-web` Directory

```
/Users/aj/Desktop/rn buoy 3/
├── example/              # Existing RN app (Expo)
├── example-web/          # NEW: React web app (Vite)
│   ├── src/
│   │   ├── App.tsx       # Web version of floating menu test
│   │   └── main.tsx      # Entry point
│   ├── index.html
│   ├── package.json      # Uses workspace:* deps
│   ├── tsconfig.json     # Path mappings to packages/*/src
│   └── vite.config.ts    # Alias config for hot reload
├── packages/
│   └── devtools-floating-menu/
└── package.json          # Add example-web to workspaces
```

### Why This Approach?
- Clean separation from RN example
- Pure web implementation (not Expo web)
- Easy to test web-specific features
- Fast Vite HMR (hot module replacement)

---

## Implementation Plan

## Phase 1: Project Setup (10 min)

### 1.1 Create directory structure
```bash
mkdir -p example-web/src
```

### 1.2 Create `example-web/package.json`
```json
{
  "name": "example-web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-buoy/core": "workspace:*",
    "@react-buoy/env": "workspace:*",
    "@react-buoy/network": "workspace:*",
    "@react-buoy/react-query": "workspace:*",
    "@react-buoy/shared-ui": "workspace:*",
    "@react-buoy/storage": "workspace:*",
    "@tanstack/react-query": "^5.89.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "~5.9.2",
    "vite": "^6.0.11"
  }
}
```

### 1.3 Create `example-web/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@react-buoy/core": ["../packages/devtools-floating-menu/src"],
      "@react-buoy/core/*": ["../packages/devtools-floating-menu/src/*"],
      "@react-buoy/env": ["../packages/env-tools/src"],
      "@react-buoy/network": ["../packages/network/src"],
      "@react-buoy/react-query": ["../packages/react-query/src"],
      "@react-buoy/shared-ui": ["../packages/shared/src"],
      "@react-buoy/storage": ["../packages/storage/src"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 1.4 Create `example-web/tsconfig.node.json`
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

### 1.5 Create `example-web/vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@react-buoy/core': path.resolve(__dirname, '../packages/devtools-floating-menu/src'),
      '@react-buoy/env': path.resolve(__dirname, '../packages/env-tools/src'),
      '@react-buoy/network': path.resolve(__dirname, '../packages/network/src'),
      '@react-buoy/react-query': path.resolve(__dirname, '../packages/react-query/src'),
      '@react-buoy/shared-ui': path.resolve(__dirname, '../packages/shared/src'),
      '@react-buoy/storage': path.resolve(__dirname, '../packages/storage/src'),
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
```

---

## Phase 2: Create Test App (15 min)

### 2.1 Create `example-web/index.html`
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Buoy Web - Floating Menu Test</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 2.2 Create `example-web/src/main.tsx`
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 2.3 Create `example-web/src/App.tsx` (Minimal Test)
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

const queryClient = new QueryClient()

export const App = () => {
  const [count, setCount] = useState(0)

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1>React Buoy Web - Floating Menu Test</h1>
        <p style={{ fontSize: '1.2rem' }}>Counter: {count}</p>
        <button
          onClick={() => setCount(c => c + 1)}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Increment
        </button>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#f0f0f0',
          borderRadius: '8px'
        }}>
          <h2>Status</h2>
          <p>✅ React app running</p>
          <p>✅ Hot reload ready</p>
          <p>⏳ Waiting for FloatingDevTools web implementation</p>
        </div>
      </div>
    </QueryClientProvider>
  )
}
```

### 2.4 Create `example-web/.gitignore`
```
# Dependencies
node_modules

# Build output
dist
dist-ssr
*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment
.env
.env.local
.env.*.local
```

---

## Phase 3: Workspace Integration (5 min)

### 3.1 Update root `package.json`
Add to the `workspaces` array:
```json
{
  "workspaces": [
    "packages/*",
    "example",
    "example-web"
  ]
}
```

Add to the `scripts` section:
```json
{
  "scripts": {
    "dev:web": "pnpm --filter example-web dev",
    "dev:rn": "pnpm --filter example dev",
    "build:web": "pnpm --filter example-web build"
  }
}
```

### 3.2 Update `pnpm-workspace.yaml`
```yaml
packages:
  - 'packages/*'
  - 'example'
  - 'example-web'
```

---

## Phase 4: Initial Test (2 min)

### 4.1 Install dependencies
```bash
cd /Users/aj/Desktop/rn\ buoy\ 3/
pnpm install
```

### 4.2 Start dev server
```bash
pnpm dev:web
```

Expected output:
```
VITE v6.x.x  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  press h + enter to show help
```

### 4.3 Verify hot reload
1. Keep browser open at `http://localhost:3000/`
2. Edit `example-web/src/App.tsx` - change the heading text
3. Save file
4. Browser should auto-refresh with changes instantly

### 4.4 Verify workspace package hot reload
1. Edit `packages/devtools-floating-menu/src/index.tsx` (any file in the package)
2. Save file
3. Browser should auto-refresh with changes (no build step!)

---

## Testing Strategy

### Incremental Integration Steps

#### Step 1: Verify workspace setup
- [x] Run `pnpm dev:web`
- [x] Confirm app loads at `localhost:3000`
- [x] Test hot reload with simple component edit
- [x] Test workspace package hot reload

#### Step 2: Add floating menu (after web version exists)
Once the web implementation of FloatingDevTools is ready:

```tsx
// example-web/src/App.tsx
import { FloatingDevTools } from '@react-buoy/core'

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: '2rem' }}>
        <h1>Floating Menu Web Test</h1>

        <FloatingDevTools
          apps={[]}
          actions={{}}
        />

        {/* rest of app */}
      </div>
    </QueryClientProvider>
  )
}
```

#### Step 3: Test core hooks in isolation
```tsx
// example-web/src/TestHooks.tsx
import { useFloatingPosition } from '@react-buoy/core/core'

export const TestHooks = () => {
  // Test hooks directly before full UI integration
  const position = useFloatingPosition({
    // ... test config
  })

  return <div>Position: {JSON.stringify(position)}</div>
}
```

#### Step 4: Add full devtools suite
Port over the `installedApps` configuration from RN example:

```tsx
// example-web/src/App.tsx - Full example
import {
  EnvVarsModal,
  createEnvVarConfig,
  envVar,
} from "@react-buoy/env";
import { FloatingDevTools, InstalledApp } from "@react-buoy/core";

const installedApps: InstalledApp[] = [
  {
    id: "env",
    name: "ENV",
    description: "Environment variables debugger",
    slot: "both",
    icon: ({ size }) => <EnvLaptopIcon size={size} />,
    component: EnvVarsModal,
    props: { /* ... */ },
  },
  // ... other apps
];

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <FloatingDevTools apps={installedApps} />
      {/* Main app content */}
    </QueryClientProvider>
  )
}
```

---

## Advantages of This Approach

✅ **Hot Reload**: Edit source in `packages/*/src` → Vite reloads instantly (no build)
✅ **Parallel Development**: RN example keeps working, web example independent
✅ **Same Workspace Pattern**: `workspace:*` deps work identically
✅ **Fast Iteration**: Vite HMR is faster than Expo for web changes
✅ **TypeScript Path Mapping**: IntelliSense works across packages
✅ **Isolated Testing**: Web-specific issues don't affect RN app
✅ **Production Ready**: Can build with `pnpm build:web` for deployment

---

## How Hot Reload Works

### The Magic Behind Instant Updates

1. **TypeScript Path Mapping** (`tsconfig.json`):
   ```json
   "paths": {
     "@react-buoy/core": ["../packages/devtools-floating-menu/src"]
   }
   ```
   - TypeScript compiler knows where to find source files
   - Provides IntelliSense for imports

2. **Vite Alias Resolution** (`vite.config.ts`):
   ```typescript
   alias: {
     '@react-buoy/core': path.resolve(__dirname, '../packages/devtools-floating-menu/src')
   }
   ```
   - Vite watches these directories
   - Changes trigger HMR (Hot Module Replacement)

3. **Workspace Dependencies** (`package.json`):
   ```json
   "@react-buoy/core": "workspace:*"
   ```
   - pnpm links packages during development
   - No `node_modules` copies needed

### Edit → Save → See Changes (No Build!)

1. Edit `packages/devtools-floating-menu/src/floatingMenu/FloatingMenu.tsx`
2. Save file
3. Vite detects change in watched directory
4. Vite rebuilds only changed modules
5. Browser receives HMR update
6. React components re-render with new code
7. **Total time: < 500ms**

Compare to traditional approach:
1. Edit package source
2. Run `pnpm build` in package (10-30s)
3. Wait for package to build
4. Refresh browser
5. **Total time: 15-45s**

---

## Next Steps (Execution Order)

### Immediate (Setup)
1. ✅ Create `example-web` directory with structure above
2. ✅ Create all configuration files
3. ✅ Install dependencies (`pnpm install`)
4. ✅ Start dev server (`pnpm dev:web`)
5. ✅ Verify hot reload with simple edit

### Phase 1 (Headless Refactor - following HEADLESS_REFACTOR_ANALYSIS.md)
6. ⏳ Extract core hooks from existing FloatingMenu
7. ⏳ Create platform adapters (storage, dimensions, drag)
8. ⏳ Test each core hook in web app as you extract it

### Phase 2 (Web Implementation)
9. ⏳ Build web UI components using tested hooks
10. ⏳ Add FloatingDevTools to web example
11. ⏳ Test incrementally with each tool

### Phase 3 (Integration)
12. ⏳ Port installedApps configuration from RN example
13. ⏳ Test full devtools suite in browser
14. ⏳ Verify all features work on web

---

## Alternative: Quick Prototype (5 min)

If you want to test **right now** without manual file creation:

```bash
# Quick start with Vite scaffolding
cd /Users/aj/Desktop/rn\ buoy\ 3/
npm create vite@latest example-web -- --template react-ts
cd example-web
pnpm install

# Then manually add:
# - Vite config with aliases
# - TypeScript path mappings
# - Workspace dependencies
```

**Note**: Manual setup (Phase 1-4 above) gives you more control and better understanding.

---

## Troubleshooting

### Issue: Changes not hot reloading
**Solution**: Check that:
1. Vite alias paths are correct (absolute paths)
2. TypeScript paths match Vite aliases
3. File is saved (cmd+s / ctrl+s)
4. No TypeScript errors (check terminal)

### Issue: Import errors
**Solution**:
1. Restart Vite dev server
2. Run `pnpm install` again
3. Check `@react-buoy/*` packages are in workspace

### Issue: Type errors
**Solution**:
1. Check `tsconfig.json` paths are correct
2. Ensure `baseUrl: "."` is set
3. Run `pnpm install` to update types

### Issue: Port 3000 already in use
**Solution**:
1. Change port in `vite.config.ts`:
   ```typescript
   server: { port: 3001 }
   ```
2. Or kill process on port 3000:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

---

## Summary

This plan creates a parallel web example that mirrors your existing RN setup. The key is using Vite's alias resolution to point imports directly to package source files, enabling instant hot reload without build steps. You'll be able to develop and test the floating menu web implementation iteratively, with changes visible in < 500ms.

**Total setup time**: ~30 minutes
**Result**: Production-ready web test environment with instant hot reload
