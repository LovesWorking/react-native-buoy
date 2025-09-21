# Contributing to React Buoy

Thanks for helping make the React Buoy dev tools better! This monorepo uses pnpm workspaces and Changesets. The checklist below keeps everything consistent.

## Prerequisites
- Node.js 20+
- pnpm 10.10.0 (matching the repo configuration)

## Local Setup
```bash
pnpm install
pnpm run build:packages
pnpm run lint
```

## Development Workflow
1. Create a topic branch from `main`.
2. Make your changes.
3. Run the quality pipeline before opening a PR:
   ```bash
   pnpm run lint
   pnpm run typecheck
   pnpm run build:packages
   pnpm run smoke
   ```
4. Record a changeset for every publishable change:
   ```bash
   pnpm changeset
   ```
   Follow the prompts to select the affected package(s) and bump type.
5. Commit with a descriptive message and open a pull request.

## Releasing
Maintainers can run:
```bash
pnpm run release
```
The script runs lint/typecheck/build/smoke, applies collected changesets, creates a release commit, and publishes the packages.

For CI, use the "Release Dry Run" workflow in GitHub Actions before cutting a real release.

## Code Style
- TypeScript strict mode is enforced; avoid `any`.
- Use the shared UI primitives from `@react-buoy/shared-ui` when building new tools.
- Keep docs in sync—update README files and guides whenever you add new features.

## Reporting Issues
Open an issue with a minimal repro or link to a failing GitHub Actions run. Please include environment details (platform, React Native version).

## Conduct
Be kind and respectful. We want everyone to feel welcome when contributing.
