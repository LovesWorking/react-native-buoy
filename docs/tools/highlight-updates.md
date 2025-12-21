---
title: Highlight Updates
id: tools-highlight-updates
---

See exactly WHY your components re-render. Visual overlays show renders in real-time, and tapping any badge reveals the cause—mount, state change, prop change, or parent re-render.

## Render Causes

<!-- ::render-causes-grid -->

> **Know the WHY** — Every render is tagged with its cause. No more guessing why your component updated.

---

## Installation

<!-- ::PM npm="npm install @react-buoy/highlight-updates" yarn="yarn add @react-buoy/highlight-updates" pnpm="pnpm add @react-buoy/highlight-updates" bun="bun add @react-buoy/highlight-updates" -->

That's it. Highlight Updates appears in your FloatingDevTools menu.

---

## What You Can Do

<!-- ::highlight-features-grid -->

---

## Two Modes

Toggle between modes directly from the FloatingDevTools menu:

**Overlay Mode** — Quick visual overlay that shows renders as they happen. Perfect for spotting unnecessary re-renders while you interact with your app.

**Modal Mode** — Full inspector with render history, filtering, and detailed cause breakdowns. Great for deep debugging sessions.

---

## Hook Value Tracking

When a state change causes a render, Highlight Updates shows you the **before and after values** of your hooks. See exactly which `useState` or `useReducer` value changed.

---

## What's Next

- [Environment Inspector](./env) — View and search environment variables
- [Network Monitor](./network) — See every API call your app makes
- [React Query DevTools](./react-query) — Inspect query cache and simulate states
