# Next Steps

## Documentation & Branding
- [ ] Update the top-level README (and package READMEs) with the `@react-buoy/*` scope and fresh npm badges.
- [ ] Add an initial 0.1.1 release note / GitHub release linking to all packages.
- [ ] Review docs site content (VitePress, guides, reference pages) for outdated references or screenshots.

## Automation & Testing
- [ ] Optionally wire the full release command (`pnpm run release`) into a GitHub Actions workflow for automated publishes.
- [ ] Expand the smoke suite beyond import checks (minimal usage snippets per package).
- [ ] Consider adding focused unit/integration tests where useful.

## Package API & Types
- [ ] Ensure all types consumed by other packages are exported through public entrypoints (no deep `lib/*` imports).
- [ ] Document expected storage keys / behavior for consumers to avoid conflicts.

## Project Planning
- [ ] Outline a public roadmap (issues/milestones) for upcoming features or improvements.
- [ ] Create GitHub issues for immediate follow-ups (docs cleanup, automation, testing, etc.).

