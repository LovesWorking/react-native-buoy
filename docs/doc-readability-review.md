# Floating Dev Tools Docs – Follow-Up Checklist

## Top priorities
- Add a short “Concepts” page (App Host, Installed Apps, Launch Modes, Settings) so newcomers have one glossary they can skim before diving into guides.
- Write a troubleshooting snippet for the README (bubble missing, tool not opening, persistence not restoring) with one-line fixes.
- Capture persistence behaviour in the App Host guide (storage keys, singleton promotion) and link to it from the reference pages instead of repeating paragraphs.

## Quick wins
- Drop a few screenshots or GIFs of the bubble, dial, and bundled tools to break up text-only pages.
- Mention that shared icons live in `@monorepo/shared` wherever we show them so readers know where they come from.
- Add an “Add your own tool” checklist (5 bullets) that sits above the longer guide for people who just need the steps.

## Consistency pass
- Scan code blocks once more to ensure imports match the packages (`DevToolsSettingsModal`, `useAppHost`, `requiredEnvVars`, etc.).
- Settle on one set of names for the UI pieces (bubble, row, dial) and swap any stragglers.
- Link each plugin page back to the Quick Start so readers know when the tool is bundled versus optional.

## Nice-to-haves
- Publish a minimal Expo example or Snack that mirrors the Quick Start for hands-on testing.
- Start a lightweight “What’s new” note that lists recent changes (position persistence fix, settings merge) now that the internal plans live under `docs/internal/`.
