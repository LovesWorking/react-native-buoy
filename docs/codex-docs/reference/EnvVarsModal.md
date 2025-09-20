---
id: EnvVarsModal
title: EnvVarsModal
---

## `EnvVarsModal`

Modal UI that audits environment variables, highlights missing or invalid values, and surfaces optional config. Designed for App Host `self-modal` launch mode.

```tsx
import { EnvVarsModal } from '@react-buoy/env';

<EnvVarsModal
  visible={visible}
  onClose={onClose}
  requiredEnvVars={[{ key: 'API_URL', description: 'Backend base URL' }]}
/>;
```

**Props**

- `visible: boolean`
  - **Required**
  - Controls modal visibility; returns `null` when false.
- `onClose: () => void`
  - **Required**
  - Triggered when the modal requests dismissal.
- `requiredEnvVars: RequiredEnvVar[]`
  - **Required**
  - Defines critical configuration. Used to compute health scores and missing lists.
- `onBack?: () => void`
  - Shows a back arrow in the header and calls the callback.
- `enableSharedModalDimensions?: boolean`
  - Defaults to `false`
  - When `true`, uses the shared modal persistence namespace so size aligns with other tools.

## `RequiredEnvVar`

```ts
interface RequiredEnvVar {
  key: string;
  description?: string;
  type?: 'string' | 'number' | 'boolean';
  required?: boolean;
  validator?: (value: string) => boolean;
}
```

- `required` defaults to `true`; optional vars still display but do not count toward the missing tally.
- `validator` lets you flag wrong values (e.g., URL format) independent of type.

## Behavior

- Collects runtime values through `useDynamicEnv()` and formats them via `displayValue`.
- Categorizes keys (present, missing, wrong type/value) and orders them by severity.
- Provides filters (`all`, `missing`, `issues`) and search across key, value, and description.
- Calculates health percentage for required keys and shows a color-coded badge.
- Persists modal size using `devToolsStorageKeys.env.modal()` (or shared namespace when enabled).

## Related Utilities

- `processEnvVars`, `calculateStats` – Helpers for custom dashboards.
- [`useDynamicEnv`](../reference/useDynamicEnv.md) – Hook that powers auto-collection.

Launch the modal via [`useAppHost`](./AppHostProvider.md#useapphost) to integrate with the floating menu.
