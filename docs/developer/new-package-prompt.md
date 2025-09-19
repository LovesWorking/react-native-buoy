# Reusable Prompt For Integrating New Packages

When you add a package to this monorepo, paste the prompt below into Codex (or any comparable assistant) to reproduce the workflow we just finished. Update the sections in **bold** with package-specific names before you run it.

```
I’m working in the rn-monorepo-clean project. I just created a new package called **@monorepo/<your-package>** inside `packages/<your-package>`.

Follow this exact checklist:

1. Inspect repo state first (`git status -sb`). Never revert user changes.
2. Scan `package.json`, `tsconfig.json`, and any `exports` blocks for the new package. Align them with existing package conventions (builder config, files array, scripts, etc.).
3. If this package should re-export shared UI or utils:
   - Prefer adding subpath exports in `packages/shared/package.json` (with matching `types` and `typesVersions` entries) instead of importing from `src` paths.
   - Update `packages/shared/src/index.ts` (and sub-barrels) to expose the new entry point.
   - Replace any deep relative imports in other packages with the new alias (e.g. `@monorepo/shared/<feature>`).

4. Synchronise TypeScript configs:
   - Remove `rootDir` hacks; keep each package’s `include` list limited to its own `src`.
   - If types live in another package, rely on workspace resolution and `exports` instead of including files outside `rootDir`.

5. Replace direct `@react-native-async-storage/async-storage` usage with `useSafeAsyncStorage` when persistence is optional. Drop direct dependencies if the safe hook is enough.

6. Run `pnpm --filter @monorepo/<your-package> typecheck` (and any other relevant filters) to confirm the new import paths resolve.

7. For the floating dev tools:
   - Make sure `installedApps` entries in `example/App.tsx` include the new tool with the right `id`, `slot`, and icons.
   - Propagate the list into the dial settings modal (`DevToolsSettingsModal`) so toggles stay in sync with available apps.

8. Summarise changes clearly and propose any follow-up builds (`pnpm --filter @monorepo/shared build`, etc.).

While working, obey repo conventions:
 - Use ASCII unless files already use Unicode.
 - Add concise comments only when business logic isn’t obvious.
 - Prefer `rg` for searching.
 - Always execute shell commands from `/Users/aj/Desktop/rn-monorepo-clean` with `bash -lc`.
 - No approval prompts are available; work around any sandbox limits.

Return a short report with:
 - Key changes per file (path + purpose).
 - Tests/commands run.
 - Suggested follow-up steps.
```

Keep this file updated whenever the integration process evolves.
