# Publishing Prep TODO

## Package Scope Strategy
- [ ] Register npm scope `@react-buoy` and align branding across docs/assets
- [ ] Approve final package name mapping:
  - [ ] `packages/devtools-floating-menu` → `@react-buoy/core`
  - [ ] `packages/shared` → `@react-buoy/shared-ui`
  - [ ] `packages/react-query` → `@react-buoy/react-query`
  - [ ] `packages/env-tools` → `@react-buoy/env`
  - [ ] `packages/storage` → `@react-buoy/storage`
  - [ ] `packages/network` → `@react-buoy/network`
- [ ] Document naming conventions (kebab-case, optional suffixes, reserved `/core`) in `README.md` and package creation guides

## Repository Refactors
- [ ] Update each package’s `package.json` metadata (name, description, keywords, homepage, repository, bugs, publishConfig)
- [ ] Align workspace tooling (`pnpm-workspace.yaml`, `lerna.json`, `tsconfig.json`, bob configs) with new scoped names
- [x] Replace all legacy `@monorepo/*` import paths with the new `@react-buoy/*` scope across packages and `example/`
- [ ] Run `pnpm run build`, `pnpm run typecheck`, and `pnpm run lint` to validate renames
- [ ] Refresh docs (`CREATE_PACKAGE_GUIDE.md`, `SHARED_PACKAGE_PLAN.md`, `docs/`, etc.) with updated package list and import examples

## Publishing Readiness
- [x] Choose release/versioning workflow (e.g., pnpm + Changesets for versioning, with Lerna for orchestration)
- [ ] Implement release scripts and CI automation (build/lint/typecheck, publish dry-run, tagging)
- [ ] Ensure each package has complete `exports`, `types`, README, and changelog content for npm
- [ ] Add or update smoke tests per package; wire into CI
- [ ] Confirm licensing, contributing guidelines, and code ownership docs for external users

## Next Milestones
- [ ] Ratify plan with team and adjust timelines
- [ ] Script or automate package renaming/import updates; test on a feature branch
- [ ] Perform a prerelease (alpha/beta) publish dry-run before public release
