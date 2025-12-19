---
title: React Query DevTools
id: tools-react-query
---

Full TanStack Query inspection for React Native. Browse queries, view cached data, simulate states, and debug your data fetching in real-time.

## Installation

<!-- ::PM npm="npm install @react-buoy/react-query" yarn="yarn add @react-buoy/react-query" pnpm="pnpm add @react-buoy/react-query" bun="bun add @react-buoy/react-query" -->

That's it. The React Query DevTools auto-detects your QueryClient and appears in your FloatingDevTools menu.

---

## Query States

<!-- ::query-states-grid -->

---

## What You Can Do

<!-- ::query-actions-grid -->

> **Simulate loading & error states** — Test how your UI handles loading spinners and error boundaries without waiting for real network conditions.

---

## Mutations

Track all your mutations in real-time:

- **Status** — idle, pending, success, or error
- **Variables** — data passed to the mutation
- **Response** — returned data or error message
- **Timing** — when the mutation was submitted

---

## WiFi Toggle

Simulate offline mode with one tap. The WiFi toggle controls React Query's `onlineManager` to pause all queries — perfect for testing offline-first features.

---

## What's Next

- [Network Monitor](./network) — See every API call your app makes
- [Storage Explorer](./storage) — Browse and edit AsyncStorage & MMKV
- [Environment Inspector](./env) — Validate env vars with type checking
