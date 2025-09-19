---
id: useDynamicEnv
title: useDynamicEnv
---

## `useDynamicEnv`

Hook that probes environment variables and configuration sources, returning key/value pairs consumed by `EnvVarsModal`.

```ts
import { useDynamicEnv } from '@monorepo/env-tools';

const results = useDynamicEnv();
```

**Returns**

- `Array<{ key: string; data: unknown }>`
  - Each entry represents a discovered environment value. Non-string data is stringified with `displayValue` before rendering.

**Behavior**

- Runs on mount, collecting values from built-in sources (Expo config, process env, shared storage).
- Plays nicely with suspense-free rendering by using synchronous lookups.

Combine it with the helper `processEnvVars` if you build custom dashboards outside the modal.
