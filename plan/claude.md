# React Native Builder Bob - Repository Analysis

## Repository Overview
React Native Builder Bob is a monorepo containing two main CLI tools for scaffolding and building React Native libraries:

1. **`create-react-native-library`**: CLI for scaffolding new React Native libraries
2. **`react-native-builder-bob`**: Build tool for compiling and packaging libraries

## Architecture & Structure

### Monorepo Setup
- Uses Yarn Workspaces for dependency management
- Lerna for versioning and publishing (independent versioning)
- TypeScript throughout with strict type checking
- ESLint + Prettier for code quality
- Vitest for testing

### Key Components

#### `create-react-native-library` Package
- **Entry Point:** `src/index.ts` - Uses yargs for CLI interface
- **Core Logic:** Interactive prompts for library configuration (`input.ts`)
- **Template System:** EJS-based templating with multiple template types (`template.ts`)
- **Available Templates:** JS-only, native modules (Turbo/Fabric), Nitro modules, Expo libraries
- **Example Generation:** Automatically creates example apps for testing

#### `react-native-builder-bob` Package
- **Entry Point:** `src/index.ts` - Two main commands: `init` and `build`
- **Build Targets:** CommonJS, ES Modules, TypeScript declarations, Codegen
- **Configuration:** Uses arktype for runtime schema validation
- **Compilation:** Babel-based transformation with customizable presets
- **Architecture Support:** New Architecture (Turbo Modules, Fabric Views), Nitro modules

## Core Workflows

### Library Creation Flow
1. Prompts user for library configuration (name, type, language, example app)
2. Generates template configuration object
3. Applies EJS templates based on selected options
4. Creates example app if requested
5. Initializes git repository and creates initial commit
6. Provides next steps for development

### Build Process
1. Loads configuration from package.json or bob config file
2. Validates configuration using arktype schemas
3. Compiles source files using Babel for JS/TS targets
4. Generates TypeScript declarations using tsc
5. Handles React Native codegen for new architecture components
6. Supports watch mode for development

## Template System
Sophisticated template system supporting:
- **Common templates**: Shared across all library types
- **Language-specific**: Kotlin+Swift, Kotlin+Objective-C, JavaScript-only
- **Architecture-specific**: Turbo Modules, Fabric Views, Nitro modules
- **Example apps**: Vanilla React Native, Expo

## Key Features
- **Multi-target compilation**: CommonJS, ES modules, TypeScript definitions
- **New Architecture support**: Turbo Modules, Fabric Views, Codegen integration
- **Experimental Nitro support**: Next-gen native modules
- **Local development mode**: Links libraries for immediate testing
- **Automated workflows**: Git initialization, dependency management, example app generation
- **Extensive configuration**: Flexible build options, custom scripts, source maps

## Build System Details
- **Babel-based compilation** with customizable presets
- **TypeScript declaration generation** using tsc
- **Source map support** for debugging
- **Flow type preservation** option
- **JSX runtime configuration** (automatic/classic)
- **Custom build scripts** support

## File Structure Reference

```
├── packages/                    # All packages live here
│   ├── create-react-native-library/
│   │   ├── src/
│   │   │   ├── index.ts         # CLI entry point with yargs
│   │   │   ├── input.ts         # User input handling & prompts
│   │   │   ├── template.ts      # Template processing & EJS
│   │   │   ├── constants.ts     # Shared constants
│   │   │   ├── inform.ts        # User messaging & next steps
│   │   │   ├── exampleApp/      # Example app generation
│   │   │   └── utils/           # Utility functions
│   │   ├── templates/           # EJS template files
│   │   │   ├── common/          # Shared templates
│   │   │   ├── js-library/      # JavaScript-only
│   │   │   ├── native-library-new/ # Native modules
│   │   │   ├── nitro-module/    # Nitro modules
│   │   │   └── ...
│   │   ├── bin/                 # CLI executable
│   │   └── package.json
│   └── react-native-builder-bob/
│       ├── src/
│       │   ├── index.ts         # CLI entry point
│       │   ├── build.ts         # Build command implementation
│       │   ├── init.ts          # Init command implementation
│       │   ├── schema.ts        # Configuration schema (arktype)
│       │   ├── babel.ts         # Babel configuration
│       │   ├── targets/         # Build target implementations
│       │   │   ├── commonjs.ts
│       │   │   ├── module.ts
│       │   │   ├── typescript.ts
│       │   │   ├── codegen/
│       │   │   └── custom.ts
│       │   └── utils/           # Build utilities
│       │       ├── compile.ts   # Babel compilation
│       │       ├── loadConfig.ts
│       │       ├── logger.ts
│       │       └── workerize.ts
│       ├── babel-preset.js      # Babel preset export
│       ├── metro-config.js      # Metro config export
│       └── package.json
├── docs/                        # Documentation workspace
├── package.json                 # Root workspace config
├── lerna.json                   # Lerna configuration
├── tsconfig.json                # Shared TypeScript config
├── eslint.config.mjs            # Shared ESLint config
└── yarn.lock                    # Lockfile
```

## Configuration Schema

### Bob Configuration (arktype-based)
```typescript
{
  source: string,           // Source directory
  output: string,           // Output directory
  targets: Target[],        // Build targets array
  exclude: string           // Glob pattern for excluded files
}
```

### Available Build Targets
- **`commonjs`**: CommonJS modules with Babel options
- **`module`**: ES modules with ESM support
- **`typescript`**: TypeScript declarations via tsc
- **`codegen`**: React Native codegen processing
- **`custom`**: Custom build scripts

### Template Configuration
```typescript
{
  versions: {
    bob: string,            // Builder bob version
    nitro?: string          // Nitro modules version
  },
  project: {
    slug: string,           // Project identifier
    name: string,           // Display name
    package: string,        // Package name
    native: boolean,        // Has native code
    swift: boolean,         // Uses Swift
    moduleConfig: ModuleConfig,  // Module type
    viewConfig: ViewConfig       // View type
  },
  author: AuthorInfo,
  repo: string,             // Git repository URL
  example: ExampleApp,      // Example app type
  year: number
}
```

## CLI Commands Reference

### create-react-native-library
```bash
# Interactive mode
npx create-react-native-library

# With options
npx create-react-native-library MyLibrary \
  --type library \
  --languages js \
  --author-name "Author" \
  --author-email "email@example.com"
```

### react-native-builder-bob
```bash
# Initialize configuration
npx bob init

# Build all targets
npx bob build

# Build specific target
npx bob build --target commonjs
```

## Dependencies & Tools Used

### Core Dependencies
- **yargs**: CLI argument parsing
- **ejs**: Template rendering
- **babel**: JavaScript/TypeScript compilation
- **arktype**: Runtime schema validation
- **prompts**: Interactive CLI prompts
- **fs-extra**: Enhanced file system operations

### Development Tools
- **TypeScript**: Type safety and compilation
- **ESLint**: Code linting with satya164 config
- **Vitest**: Testing framework
- **Prettier**: Code formatting
- **Lerna**: Monorepo versioning and publishing

## Analysis Summary
The repository is well-architected with clear separation of concerns, comprehensive testing, and extensive documentation. It provides a complete toolkit for React Native library development with support for modern architectures and development workflows.