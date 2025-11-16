# React Query Devtools Real-Time Update Analysis

## Executive Summary

This document analyzes how React Query devtools efficiently update data in real-time and compares it with a React Native implementation. The key difference is **subscription-based reactivity** vs **prop-based reactivity**.

---

## How React Query Devtools Achieve Real-Time Updates

### 1. **Query Cache Subscription Architecture**

The devtools use a sophisticated subscription system that listens to **all query cache changes**:

```typescript
// From packages/query-devtools/src/Devtools.tsx

const queryCacheMap = new Map<
  (q: Accessor<QueryCache>) => any,
  {
    setter: Setter<any>
    shouldUpdate: (event: QueryCacheNotifyEvent) => boolean
  }
>()

const setupQueryCacheSubscription = () => {
  const queryCache = createMemo(() => {
    const client = useQueryDevtoolsContext().client
    return client.getQueryCache()
  })

  // 🔑 KEY: Subscribe to ALL query cache events
  const unsubscribe = queryCache().subscribe((q) => {
    batch(() => {
      for (const [callback, value] of queryCacheMap.entries()) {
        if (!value.shouldUpdate(q)) continue
        value.setter(callback(queryCache)) // Re-compute and update
      }
    })
  })
  // ...
}
```

### 2. **Batcher Pattern for Efficient Updates**

The `createSubscribeToQueryCacheBatcher` function creates reactive signals that automatically update:

```typescript
const createSubscribeToQueryCacheBatcher = <T,>(
  callback: (queryCache: Accessor<QueryCache>) => Exclude<T, Function>,
  equalityCheck: boolean = true,
  shouldUpdate: (event: QueryCacheNotifyEvent) => boolean = () => true,
) => {
  const queryCache = createMemo(() => {
    const client = useQueryDevtoolsContext().client
    return client.getQueryCache()
  })

  // Create reactive signal
  const [value, setValue] = createSignal<T>(
    callback(queryCache),
    !equalityCheck ? { equals: false } : undefined,
  )

  // Register callback to be called on cache changes
  queryCacheMap.set(callback, {
    setter: setValue,
    shouldUpdate: shouldUpdate,
  })

  return value // Returns reactive signal
}
```

### 3. **How Explorer Receives Updates**

The Explorer component receives **reactive signals** that automatically update:

```typescript
// From Devtools.tsx line 2212-2219
<Explorer
  label="Data"
  defaultExpanded={['Data']}
  value={activeQueryStateData()}  // ⚡ Reactive signal - auto-updates!
  editable={true}
  activeQuery={activeQuery()}     // ⚡ Reactive signal - auto-updates!
/>

// Where activeQueryStateData is:
const activeQueryStateData = createSubscribeToQueryCacheBatcher(
  (queryCache) => {
    return queryCache()
      .getAll()
      .find((query) => query.queryHash === selectedQueryHash())?.state.data
  },
  false, // equalityCheck: false = always get fresh data
)
```

### 4. **What Happens When setQueryData is Called**

1. `queryClient.setQueryData()` updates the query cache
2. Query cache fires a `notify` event via `queryCache.subscribe()`
3. All registered batchers re-compute their values
4. Reactive signals update automatically
5. Components re-render with fresh data

---

## Issues in React Native Implementation

### Problem 1: **No Query Cache Subscription**

**Current Implementation:**
```typescript
// QueryInformation.tsx
<DataExplorer
  value={selectedQuery?.state.data}  // ❌ Static reference
  activeQuery={selectedQuery}       // ❌ Static reference
/>
```

**Why It Fails:**
- `selectedQuery` is a static object reference
- When `setQueryData()` is called, React Query updates the cache internally
- But React doesn't know to re-render because the prop reference hasn't changed
- The component only updates if the parent re-renders for another reason

### Problem 2: **Manual dataVersion Prop**

**Current Implementation:**
```typescript
// Explorer.tsx line 270
dataVersion?: number;

// Used in useEffect dependency (line 311)
useEffect(() => {
  // Sync local state with prop value
  setLocalInputValue(newValue);
}, [value, label, dataVersion]); // ⚠️ Manual version tracking
```

**Why It's Problematic:**
- Requires manual incrementing of `dataVersion` whenever data changes
- Easy to forget, leading to stale UI
- Not reactive - relies on parent component to track changes
- Adds unnecessary complexity

### Problem 3: **Direct State Access Instead of Subscription**

**Current Implementation:**
```typescript
// Explorer.tsx line 413
const oldData = activeQueryRef.current.state.data as unknown as JsonValue;
// ...
queryClient.setQueryData(activeQueryRef.current.queryKey, newData);
```

**Why It's Inefficient:**
- Reads directly from `activeQuery.state.data` at render time
- Doesn't subscribe to changes, so won't update when:
  - Another component calls `setQueryData`
  - Query refetches
  - Query invalidates
  - Query cache updates from elsewhere

### Problem 4: **No Batching of Updates**

**Current Implementation:**
- Each component independently reads from `activeQuery.state.data`
- No coordination between updates
- Can cause multiple re-renders for a single cache update

**Devtools Solution:**
- All subscriptions batched together
- Single re-render cycle for multiple cache changes
- More efficient and performant

---

## Correct Implementation Strategy

### Solution 1: **Subscribe to Query Cache**

Create a hook that subscribes to query cache changes:

```typescript
// useQueryCacheSubscription.ts
import { useEffect, useState, useRef } from 'react';
import { useQueryClient, QueryCacheNotifyEvent } from '@tanstack/react-query';

export function useQueryCacheSubscription<T>(
  selector: (queryCache: QueryCache) => T,
  shouldUpdate: (event: QueryCacheNotifyEvent) => boolean = () => true,
): T {
  const queryClient = useQueryClient();
  const queryCache = queryClient.getQueryCache();
  
  const [value, setValue] = useState<T>(() => selector(queryCache));
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  useEffect(() => {
    const unsubscribe = queryCache.subscribe((event) => {
      if (!shouldUpdate(event)) return;
      
      // Re-compute value from current cache state
      const newValue = selectorRef.current(queryCache);
      setValue(newValue);
    });

    return unsubscribe;
  }, [queryCache, shouldUpdate]);

  return value;
}
```

### Solution 2: **Use Subscription in QueryInformation**

```typescript
// QueryInformation.tsx
import { useQueryCacheSubscription } from './hooks/useQueryCacheSubscription';

export default function QueryInformation({
  selectedQuery,
  setSelectedQuery,
}: Props) {
  const queryClient = useQueryClient();
  
  // ⚡ Subscribe to active query data changes
  const activeQueryData = useQueryCacheSubscription(
    (queryCache) => {
      if (!selectedQuery) return undefined;
      const query = queryCache.find({ queryHash: selectedQuery.queryHash });
      return query?.state.data;
    },
    (event) => {
      // Only update if this specific query changed
      return event?.query?.queryHash === selectedQuery?.queryHash;
    }
  );

  // ⚡ Subscribe to active query object changes
  const activeQuery = useQueryCacheSubscription(
    (queryCache) => {
      if (!selectedQuery) return undefined;
      return queryCache.find({ queryHash: selectedQuery.queryHash });
    },
    (event) => {
      return event?.query?.queryHash === selectedQuery?.queryHash;
    }
  );

  return (
    <ScrollView>
      {/* ... */}
      <DataExplorer
        editable={true}
        label="Data"
        value={activeQueryData}      // ✅ Reactive - auto-updates!
        defaultExpanded={["Data"]}
        activeQuery={activeQuery}    // ✅ Reactive - auto-updates!
      />
    </ScrollView>
  );
}
```

### Solution 3: **Remove dataVersion Prop**

**Remove:**
```typescript
dataVersion?: number; // ❌ Remove this
```

**Update useEffect:**
```typescript
// Explorer.tsx
useEffect(() => {
  if (
    value !== null &&
    value !== undefined &&
    (typeof value === "string" || typeof value === "number")
  ) {
    const newValue = value.toString();
    setLocalInputValue(newValue);
  }
}, [value, label]); // ✅ Remove dataVersion - value prop is now reactive!
```

### Solution 4: **Optimize with useMemo for Deep Equality**

For better performance, use deep equality checking:

```typescript
import { useMemo } from 'react';
import { isEqual } from 'lodash'; // or use a lightweight deep-equal

export function useQueryCacheSubscription<T>(
  selector: (queryCache: QueryCache) => T,
  shouldUpdate: (event: QueryCacheNotifyEvent) => boolean = () => true,
  options?: { equalityFn?: (a: T, b: T) => boolean }
): T {
  const queryClient = useQueryClient();
  const queryCache = queryClient.getQueryCache();
  const equalityFn = options?.equalityFn || isEqual;
  
  const [value, setValue] = useState<T>(() => selector(queryCache));
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  useEffect(() => {
    const unsubscribe = queryCache.subscribe((event) => {
      if (!shouldUpdate(event)) return;
      
      const newValue = selectorRef.current(queryCache);
      
      // Only update if value actually changed (deep equality)
      if (!equalityFn(value, newValue)) {
        setValue(newValue);
      }
    });

    return unsubscribe;
  }, [queryCache, shouldUpdate, equalityFn, value]);

  return value;
}
```

---

## Best Practices Summary

### ✅ DO:

1. **Subscribe to Query Cache**
   - Use `queryCache.subscribe()` to listen for changes
   - Re-compute values from current cache state, don't store stale references

2. **Batch Updates**
   - Group multiple subscriptions together
   - Use React's batching (automatic in React 18+) or manual batching

3. **Use Selectors**
   - Create selector functions that extract exactly what you need
   - Makes subscriptions more efficient and testable

4. **Filter Updates**
   - Use `shouldUpdate` callback to only react to relevant changes
   - Prevents unnecessary re-renders

5. **Deep Equality Checks**
   - Compare old vs new values before updating state
   - Prevents unnecessary re-renders when data hasn't actually changed

### ❌ DON'T:

1. **Don't Store Query References**
   - Don't pass `query.state.data` directly as props
   - Always subscribe to get fresh data

2. **Don't Use Manual Version Tracking**
   - Don't use `dataVersion` or similar props
   - Let subscriptions handle reactivity

3. **Don't Read State Directly**
   - Don't access `activeQuery.state.data` at render time
   - Always use subscribed values

4. **Don't Forget to Cleanup**
   - Always return unsubscribe function from useEffect
   - Prevents memory leaks

5. **Don't Over-Subscribe**
   - Don't create subscriptions for every component
   - Share subscriptions at appropriate component levels

---

## Performance Considerations

### Devtools Approach:
- **Single subscription** to query cache
- **Batched updates** - all subscribers notified together
- **Selective updates** - only relevant components re-render
- **Efficient** - O(n) where n = number of active subscriptions

### Current React Native Approach:
- **No subscription** - relies on parent re-renders
- **Manual tracking** - requires dataVersion prop
- **Inefficient** - can miss updates or cause unnecessary re-renders
- **Fragile** - breaks if parent doesn't re-render

---

## Migration Checklist

- [ ] Create `useQueryCacheSubscription` hook
- [ ] Update `QueryInformation` to use subscription hook
- [ ] Remove `dataVersion` prop from Explorer
- [ ] Update Explorer's useEffect dependencies
- [ ] Test that updates happen in real-time
- [ ] Verify cleanup on unmount
- [ ] Add deep equality checks for performance
- [ ] Test with multiple simultaneous updates

---

## Key Takeaways

1. **React Query devtools use subscription-based reactivity**, not prop-based reactivity
2. **Query cache subscriptions** are the source of truth for real-time updates
3. **Batching** ensures efficient updates across multiple components
4. **Selectors** make subscriptions precise and performant
5. **Manual version tracking** is an anti-pattern - let subscriptions handle it

The fundamental difference: **Devtools subscribe to changes, your implementation waits for props to change**.

