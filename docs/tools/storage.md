---
title: Storage Explorer
id: tools-storage
---

Browse, edit, and manage all your app's persisted data. See every key-value pair across all storage backends in real-time.

## Supported Backends

<!-- ::storage-backends-grid -->

> **Multi-instance MMKV support** — If you use multiple MMKV instances, they're all detected automatically. Switch between instances and see key counts per instance.

---

## Installation

<!-- ::PM npm="npm install @react-buoy/storage" yarn="yarn add @react-buoy/storage" pnpm="pnpm add @react-buoy/storage" bun="bun add @react-buoy/storage" -->

That's it. The Storage Explorer auto-detects installed backends and appears in your FloatingDevTools menu.

---

## What You Can Do

<!-- ::storage-actions-grid -->

---

## Smart Features

**JSON formatting** — Values that are valid JSON are automatically pretty-printed for readability.

**Live events** — Watch storage changes happen in real-time as your app reads and writes data.

**Bulk selection** — Select multiple keys to delete or export them all at once.

---

## What's Next

- [Network Monitor](./network) — See every API call your app makes
- [Environment Inspector](./env) — Validate env vars with type checking
- [React Query](./react-query) — Inspect query cache and simulate states
