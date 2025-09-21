# Migration Plan: Move “docs” Branch to `react-native-buoy`

## Goal
Replace the contents of `https://github.com/LovesWorking/react-native-buoy` with this repo’s “docs” branch content so it becomes the new main codebase.

---

## Steps

1. **Add the destination remote**
   ```bash
   cd /path/to/current/docs-repo
   git remote add buoy https://github.com/LovesWorking/react-native-buoy.git
   ```

2. **Update repository metadata**
   - Edit root `package.json` (and each package’s `package.json`) to set `repository`, `bugs`, `homepage` to the `react-native-buoy` URLs.
   - Refresh README/docs links to point to the new repo name.

3. **Force-push the new content to `main`**
   ```bash
   git push buoy HEAD:main --force
   ```
   This fully replaces the existing `main` branch. (No PR is required because the histories are unrelated.)

4. **Adjust GitHub settings**
   - Ensure `main` is the default branch in the destination repo.
   - Remove any outdated branches or references if desired.

5. **Run validation on the destination repo**
   ```bash
   pnpm install
   pnpm run lint
   pnpm run typecheck
   pnpm run build:packages
   pnpm run smoke
   ```
   - Trigger the “Release Dry Run” workflow in GitHub Actions to confirm CI and release tooling.

6. **Follow release workflow for future publishes**
   - See `RELEASE_WORKFLOW.md` (`pnpm run release` once changesets are ready).

---

## Notes
- This plan overwrites the existing repo; back it up separately if needed before the force push.
- Once pushed, the new release infrastructure (Changesets, CI, docs) is ready to go.
