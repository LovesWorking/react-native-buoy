# Expo Routing Interception Research Plan

## Purpose
Understand Expo's routing implementation to enable event interception/swizzling for routing changes, similar to network and storage event interception for dev tools.

---

## Phase 1: Research Plan (Current Phase)

### 1. Core Router Package Investigation
**Target: `packages/expo-router/`**
- [ ] Main entry point and exports
- [ ] Core routing APIs (useRouter, Link, router.push/replace/back, etc.)
- [ ] Navigation context providers
- [ ] Route change event system (if exists)
- [ ] Navigation lifecycle hooks

### 2. Router Implementation Architecture
**Target: `packages/expo-router/src/`**
- [ ] Router initialization and setup
- [ ] Navigation state management
- [ ] Route matching and resolution logic
- [ ] History management
- [ ] Stack/tab/drawer navigation implementations

### 3. Navigation Event System
**Key Investigation Areas:**
- [ ] How route changes are triggered internally
- [ ] Event listeners or callbacks during navigation
- [ ] Pre-navigation hooks or middleware
- [ ] Post-navigation effects or side effects
- [ ] Navigation guards or interceptors (if any)

### 4. Integration with React Navigation
**Target: React Navigation integration layer**
- [ ] How expo-router wraps React Navigation
- [ ] Navigation container setup
- [ ] Navigation state listeners
- [ ] React Navigation events that expo-router uses
- [ ] Custom navigation actions or middleware

### 5. Router Context and State
**Target: Context providers and state management**
- [ ] RouterContext implementation
- [ ] Navigation state structure
- [ ] How state changes propagate
- [ ] Global navigation store (if exists)
- [ ] Route params and state management

### 6. Link Component and Imperative Navigation
**Target: User-facing navigation APIs**
- [ ] Link component implementation
- [ ] useRouter hook implementation
- [ ] router singleton implementation
- [ ] Href processing and resolution
- [ ] Navigation action creators

### 7. Server-Side Routing (RSC)
**Target: `packages/@expo/router-server/`**
- [ ] Server-side route handling
- [ ] How RSC routing differs from client routing
- [ ] Server navigation events (if applicable)
- [ ] Integration points with client router

### 8. Route Change Detection Points
**Critical for Interception:**
- [ ] Where URL changes are processed
- [ ] Where navigation actions are dispatched
- [ ] Where route components mount/unmount
- [ ] Where navigation history is modified
- [ ] Where deep links are handled

### 9. Dev Tools Integration Points
**Existing Dev Tools:**
- [ ] Current dev tools integrations in expo-router
- [ ] Debug modes or verbose logging
- [ ] Existing event tracking or analytics hooks
- [ ] Performance monitoring integrations

### 10. Testing Infrastructure
**Target: Router test files**
- [ ] How tests simulate navigation
- [ ] Mock implementations of routing
- [ ] Test utilities for navigation events
- [ ] Examples of intercepting navigation in tests

---

## Phase 2: Research Execution (Next Phase)

### Research Methodology
1. Start with package.json and main entry points
2. Map out the public API surface
3. Trace navigation flow from user action to route change
4. Identify all event emission points
5. Document internal hooks and middleware systems
6. Test findings with minimal reproduction cases

### Key Questions to Answer
- What is the complete lifecycle of a route change?
- Where can we inject code to observe navigation?
- What information is available at each interception point?
- Are there existing extension points or APIs?
- What are the differences between Link, router.push, and back button?
- How do different navigator types (stack, tabs, drawer) affect events?

---

## Phase 3: API Documentation (Final Phase)

### Documentation Structure
1. **Overview of Routing Architecture**
2. **Navigation Event Lifecycle**
3. **Interception Techniques**
   - Method 1: [To be determined]
   - Method 2: [To be determined]
   - Method 3: [To be determined]
4. **API Reference**
   - Functions to intercept
   - Event signatures
   - Timing considerations
5. **Implementation Examples**
   - Basic navigation tracking
   - Advanced interception with state
   - Edge cases and gotchas
6. **Best Practices**
   - What to do
   - What NOT to do
   - Performance considerations
   - Compatibility notes
7. **Testing Your Implementation**
8. **Troubleshooting Guide**

---

## Investigation Priority

### High Priority (Essential)
1. Core router APIs (useRouter, Link, router object)
2. Navigation event system
3. Integration with React Navigation
4. Route change detection points

### Medium Priority (Important)
5. Router context and state management
6. Server-side routing considerations
7. Existing dev tools integration
8. Different navigator types

### Low Priority (Nice to Have)
9. Testing infrastructure patterns
10. Edge cases and error handling

---

## Success Criteria
- [ ] Complete understanding of route change lifecycle
- [ ] Identified all interception points
- [ ] Documented working example of route event capture
- [ ] No breaking changes to normal routing behavior
- [ ] Compatible with all navigator types (stack, tabs, drawers)
- [ ] Works with both imperative and declarative navigation
- [ ] Handles deep links and external navigation
- [ ] Minimal performance overhead

---

## Notes
- Focus on `expo-router` package primarily
- Expo Router is built on React Navigation - understand the boundaries
- Look for existing event systems before creating new ones
- Consider both development and production environments
- Must work with File-based routing system
- Consider React Server Components (RSC) implications
