# Repository Overview

## Monorepo Structure
- Yarn/Lerna workspace with two CLIs: `create-react-native-library` and `react-native-builder-bob`, alongside shared docs/config (`package.json`, `lerna.json`, `docs/`).
- Tooling assumes Node-based workflows: yarn scripts, TypeScript config, and lefthook for git hooks.

## create-react-native-library
- Yargs CLI resolves package versions, prompts for metadata, and orchestrates scaffolding (`packages/create-react-native-library/src/index.ts:41`).
- Question flow adapts by context (local vs publishable), enforces npm naming, and pulls defaults from git config (`packages/create-react-native-library/src/input.ts:117`).
- Example apps bootstrapped via `npx` for Community CLI/Test App/Expo, then cleaned and patched to match selected template (`packages/create-react-native-library/src/exampleApp/generateExampleApp.ts:45`).
- Template configuration derives naming, identifiers, language mix, and module/view variants to drive EJS templates (`packages/create-react-native-library/src/template.ts:92`).
- Local flow can auto-link into a host app and add Nitro modules; remote flow initializes git and prints next steps (`packages/create-react-native-library/src/utils/local.ts:11`, `packages/create-react-native-library/src/index.ts:137`).
- Utilities cover prompts with non-interactive safeguards, npm version resolution, initial commits, and NPX availability checks.

## react-native-builder-bob
- CLI exposes `init` and `build` commands (`packages/react-native-builder-bob/src/index.ts:5`).
- `init` configures `package.json` exports/files/scripts, handles optional Flow/TS support, updates ignore lists, and can generate a `tsconfig` (`packages/react-native-builder-bob/src/init.ts:12`).
- `build` loads `bob.config.*`/`package.json` config, validates with arktype, and dispatches worker threads per target (`packages/react-native-builder-bob/src/build.ts:24`).
- Targets: Babel builds for CommonJS/ESM, `tsc` declaration output with package metadata validation, React Native codegen with post-processing patches, and custom script execution (`packages/react-native-builder-bob/src/utils/compile.ts:23`, `packages/react-native-builder-bob/src/targets/typescript.ts:1`, `packages/react-native-builder-bob/src/targets/codegen/index.ts:1`, `packages/react-native-builder-bob/src/targets/custom.ts:1`).
- Internal Babel plugin appends file extensions while respecting platform forks and codegen specs (`packages/react-native-builder-bob/src/babel.ts:1`).
- Worker harness proxies log messages back to grouped reporters for clean multi-target output (`packages/react-native-builder-bob/src/utils/workerize.ts:1`).

## Shared Utilities & Conventions
- Consistent `spawn` wrapper captures stdout/stderr and raises rich errors (`packages/create-react-native-library/src/utils/spawn.ts:1`, `packages/react-native-builder-bob/src/utils/spawn.ts:1`).
- Codegen helpers rename generated Android packages and strip app-level artifacts until upstream fixes land (`packages/react-native-builder-bob/src/targets/codegen/patches/patchCodegenAndroidPackage.ts:1`, `packages/react-native-builder-bob/src/targets/codegen/patches/removeCodegenAppLevelCode.ts:1`).
- Templates live under `packages/create-react-native-library/templates/`, covering JS-only, Expo, Turbo/Nitro module/view implementations, plus common files for local vs published scenarios.

## Suggested Next Steps
1. Inspect templates under `packages/create-react-native-library/templates/` for the variants you plan to generate.
2. Review unit tests in `packages/react-native-builder-bob/src/__tests__` to understand expected configuration behaviors.
3. Run `yarn watch` or a local `bob build` to observe the build pipelines end-to-end.
