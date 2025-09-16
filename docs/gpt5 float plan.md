# DevTools Runtime: Plug‑and‑Play Start Menu for Tools

This document proposes a simple, flexible runtime so each tool manages its own open/close state while the Floating Menu auto‑hides when any tool is open. The goal is to eliminate boilerplate (`visible`, `onClose`) in the app layer and make tools plug‑and‑play.

## Goals

- Tools own their visibility and lifecycle; no parent wiring of `visible`/`onClose`.
- Floating Menu auto‑hides while any tool is open, then reappears once all tools are closed.
- Tool authors register once and provide a `launch` action; everything else is optional sugar.
- Backwards compatible with current usage patterns.

## Core Idea

- Introduce a lightweight DevTools Runtime (context + tiny event bus).
- Tools notify the runtime when they open/close (or use a wrapper that does it for them).
- Floating Menu subscribes to a derived `isAnyAppOpen` flag to hide/show itself.
- Launching a tool from the menu becomes a single `requestLaunch(id)` call; tools decide how to open.

## Architecture

### DevToolsProvider (Runtime)

Provides a shared context at the app root. Holds:

- Tool registry: `{ id, name, icon, launch }[]`
- Open tracker: `openApps: Set<string>` with derived `isAnyAppOpen: boolean`
- Methods:
  - `registerTool(config)` / `unregisterTool(id)`
  - `requestLaunch(id)`
  - `notifyOpened(id)` / `notifyClosed(id)`

### Hooks

- `useDevTools()`
  - Access registry, `isAnyAppOpen`, and `requestLaunch`.
- `useIsAnyAppOpen()`
  - Lightweight selector for visibility control.
- `useToolRegistration(config)`
  - Registers/unregisters a tool (idempotent; cleans up on unmount).
- `useDevToolLifecycle({ id, visible })`
  - Notify runtime when the tool opens/closes. Zero coupling to the menu.

### Optional Wrapper: DevToolModal

- Thin wrapper around `JsModal` (or any UI shell) that:
  - Controls local `visible` state (`useDevToolModal(id)` returns `{ open, close, visible }`).
  - Internally calls `notifyOpened/notifyClosed` based on `visible`.
  - Persists dimensions/position via existing storage utils.

## Floating Menu Integration

- Source menu entries from the runtime registry instead of hard‑coded props.
- On click: call `requestLaunch(appId)`, then optimistically hide the menu.
  - If the runtime does not receive `notifyOpened(appId)` within a short timeout, unhide (launch failed or deferred).
- Visibility:
  - `menuHidden = internalHidden || isAnyAppOpen`.
  - Preserve current "hide to right edge" behavior; `isAnyAppOpen` is additive.

## Tool Author Experience

### Minimal (tool manages its own state)

```tsx
// Tool.tsx
export function EnvTool() {
  const [visible, setVisible] = useState(false);
  useToolRegistration({
    id: 'env',
    name: 'Env',
    icon: EnvIcon,
    launch: () => setVisible(true),
  });
  useDevToolLifecycle({ id: 'env', visible });

  return (
    <JsModal visible={visible} onClose={() => setVisible(false)}>
      {/* content */}
    </JsModal>
  );
}
```

### Batteries‑Included (built‑in state)

```tsx
// EnvTool.tsx
const { open, close, visible } = useDevToolModal('env');
useToolRegistration({ id: 'env', name: 'Env', icon: EnvIcon, launch: open });

return (
  <DevToolModal id="env" visible={visible} onClose={close} header={{ title: 'Environment' }}>
    {/* content */}
  </DevToolModal>
);
```

With either approach, the parent no longer manages `visible` or `onClose`.

## Interoperability & Backwards Compatibility

- Keep the current pattern working (explicit `visible`/`onClose`).
- If a tool doesn’t call lifecycle notifications, the menu still hides on `requestLaunch()` with a timeout fallback.
- Multiple tools can open at once: runtime tracks a set; menu returns when `openApps.size === 0`.

## Persistence & Safety

- Use existing `safeAsyncStorage` for per‑tool state (dimensions, position, preferences).
- Guard `registerTool` against duplicate IDs; cleanup on unmount.
- Android back button: tools call `notifyClosed(id)` when dismissed.

## Phased Implementation Plan

1. Add `DevToolsProvider` and context (runtime state + methods).
2. Implement hooks: `useDevTools`, `useIsAnyAppOpen`, `useToolRegistration`, `useDevToolLifecycle`.
3. Add `DevToolModal` + `useDevToolModal` (optional sugar over `JsModal`).
4. Wire `FloatingMenu` to runtime registry & `isAnyAppOpen`.
5. Migrate one tool (Env) as reference; keep old API path intact.
6. Document “authoring a tool” (this doc) and create simple examples.

## Open Questions / Non‑Goals

- Do we need cross‑tool coordination (e.g., enforce single‑instance)?
- Should the runtime broadcast focus/blur between multiple open tools?
- Non‑goal: Replace app‑specific state; tools can keep their own internals.

## Appendix: API Sketch

```ts
type ToolConfig = {
  id: string;
  name: string;
  icon?: React.ComponentType<any> | React.ReactNode;
  launch: () => void | Promise<void>;
};

type DevToolsContextValue = {
  tools: ToolConfig[];
  registerTool: (config: ToolConfig) => void;
  unregisterTool: (id: string) => void;
  requestLaunch: (id: string) => void;
  notifyOpened: (id: string) => void;
  notifyClosed: (id: string) => void;
  isAnyAppOpen: boolean;
  openApps: ReadonlySet<string>;
};

// Hooks
declare function useDevTools(): DevToolsContextValue;
declare function useIsAnyAppOpen(): boolean;
declare function useToolRegistration(config: ToolConfig): void;
declare function useDevToolLifecycle(args: { id: string; visible: boolean }): void;
declare function useDevToolModal(id: string): {
  open: () => void;
  close: () => void;
  visible: boolean;
};
```

