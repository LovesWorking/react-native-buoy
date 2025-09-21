# Release Prep Checklist

## Completed
- [x] Force-pushed current codebase to `react-native-buoy` repo.
- [x] Updated package metadata (`repository`, `homepage`, `bugs`) to point at the new repo.
- [x] Added `publishConfig` (`access: public`, `tag: latest`) for all packages.
- [x] Created bootstrap changeset (`.changeset/initial-release.md`).
- [x] Verified lint/typecheck/build/smoke scripts pass.
- [x] Added MIT `LICENSE`, `CONTRIBUTING.md`, `CODEOWNERS`, release docs.
- [x] Created `RELEASE_WORKFLOW.md` & `MIGRATION_PLAN.md` for hand-off.

## In Progress / Next Actions
- [x] Fix TypeScript build errors triggered during Changesets pack step:
  - [x] Update `@react-buoy/core` imports (avoid deep `lib/*` paths, rely on public exports).
  - [x] Confirm `@react-buoy/env` builds cleanly in isolation.
- [x] Re-run dry run after fixes: `pnpm changeset publish --dry-run --no-git-tag`.
- [ ] Execute full release once dry run succeeds: `pnpm run release` then `git push origin main --follow-tags`.
- [ ] Update READMEs/badges (if any still reference `better-dev-tools`).

## Optional / Follow-ups
- [ ] Automate release via GitHub Actions (if desired).
- [ ] Add additional tests/examples as needed.
