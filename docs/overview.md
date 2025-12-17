---
title: Overview
id: overview
---

Buoy is a floating dev tools menu for React Native. It turns **hours into seconds** for developers, QA, and product teams on tasks like regression testing, bug reproduction, and environment validation.

One floating button. Every tool your team needs. Works in dev, staging, and production.

## Who It's For

<!-- ::start:Audience-Grid -->

<!-- ::start:Audience title="Developers" tagline="Stop guessing. See exactly what's happening." -->
- **Storage event history** — Watch data changes in real-time. Step forward and backward through events.
- **Network inspector** — Every request, response, header, and error. No more console.log debugging.
- **Reproduce anything** — Open the tools, see the exact state, and reproduce bugs locally in seconds.

*"Before: Bug report → Ask for details → Add console.logs → Rebuild → Try to reproduce → Guess at state → Repeat"*

*"After: Bug report → Open Buoy → See exact state → Fix"*
<!-- ::end:Audience -->

<!-- ::start:Audience title="QA" tagline="Test things that were previously untestable." -->
- **Trigger any state** — Loading states, error states, empty states, edge cases. Now you can test them all.
- **Edit data live** — Change values in seconds. No more waiting for database changes.
- **Validate everything** — Storage validators flag missing keys, wrong types, and invalid values instantly.
- **Real regression testing** — Test the app AND the API. Stale data, race conditions, permission edge cases.

*"Before: Need edge case → Ask dev to update DB → Wait 30+ min → Test → Need another change → Wait again → Repeat"*

*"After: Need edge case → Edit value in Buoy → Test → Edit again → Test again → Done in seconds"*
<!-- ::end:Audience -->

<!-- ::start:Audience title="Customer Support" tagline="See exactly what your users see." -->
- **Impersonation tools** — Sync as a user and see their exact state. No more "works on my machine."
- **Copy debug data** — Grab storage state, network logs, and environment info for bug reports.
- **Instant answers** — Is the data wrong or is it a refresh issue? Check storage. Is the API failing? Check network.

*"Before: Customer reports issue → Ask for screenshots → Ask for more info → Escalate to dev → Dev can't reproduce → Back and forth for days"*

*"After: Customer reports issue → Impersonate user → See exact state → Copy debug data → Dev reproduces instantly"*
<!-- ::end:Audience -->

<!-- ::start:Audience title="Product & Everyone Else" tagline="Remove the friction that slows everyone down." -->
- **Feature flags in seconds** — No more asking someone to enable a feature on your account.
- **Skip the login dance** — Need to test as admin? As a new user? As a banned user? Just set it.
- **Jump to any route** — Go directly to the screen you need. Validate auth checks and permissions.

*"Before: Need feature flag → Slack dev → Wait → Need admin role → Slack another dev → Wait → Log out → Log in → Navigate to screen"*

*"After: Open Buoy → Toggle flag → Set role → Jump to route → Done"*
<!-- ::end:Audience -->

<!-- ::end:Audience-Grid -->

---

This isn't a "nice to have." It's the difference between hours of debugging and coordination versus seconds. The time savings compound across your entire team.

## What You Get

| Tool | What It Does |
|------|--------------|
| **Network** | See every API call — request, response, timing, errors |
| **Storage** | Browse and edit AsyncStorage & MMKV in real-time |
| **Environment** | Validate env vars with type checking and required field validation |
| **Debug Borders** | Tap any element to see its testID, accessibility label, and styles |
| **Route Events** | Track navigation changes and browse your route structure |
| **React Query** | Inspect query cache, trigger refetches, simulate offline mode |
| **Render Highlighter** | Spot unnecessary re-renders as they happen |

## Why Buoy

- **Zero config** — Install a package, it appears in the menu. No wiring.
- **Works everywhere** — Dev, staging, production. Same tools for everyone.
- **Modular** — Only install what you need. Each tool is a separate package.
- **Team-friendly** — Onboard new devs in minutes with consistent debugging.

## Quick Start

```tsx
import { FloatingDevTools } from "@react-buoy/core";

export default function App() {
  return (
    <>
      <YourApp />
      <FloatingDevTools environment="local" />
    </>
  );
}
```

Install any tool package and it automatically appears in the menu. No configuration needed.

## Build Your Own Tools

Need something specific to your app? Drop in any React component as a custom tool. Build internal debugging utilities, feature flag toggles, or team-specific inspectors that integrate seamlessly with the floating menu.

## Next Steps

- [Installation](./installation) — Add Buoy to your project
- [Quick Start](./quick-start) — Full setup in 2 minutes
- [Custom Tools](./custom-tools) — Build your own debugging tools
- [Tools Reference](./tools/network) — Detailed docs for each tool
