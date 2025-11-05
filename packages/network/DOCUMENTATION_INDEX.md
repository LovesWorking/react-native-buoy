# Network Package Documentation Index

Complete documentation for the rn-buoy network monitoring package.

---

## Quick Links

### Getting Started
- [README.md](README.md) - Basic usage and quick start
- [README_COMPLETE.md](README_COMPLETE.md) - **Full README with all features and API reference** ⭐

### Technical Deep Dives
- [REACT_NATIVE_NETWORK_ARCHITECTURE.md](REACT_NATIVE_NETWORK_ARCHITECTURE.md) - **React Native networking internals** ⭐
- [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md) - **Complete interception guide** ⭐

### Troubleshooting
- [QUERY_PARAMS_ISSUE_ANALYSIS.md](QUERY_PARAMS_ISSUE_ANALYSIS.md) - **Fix for query parameter display bug** ⭐

### Planning & Recommendations
- [INTERCEPTION_RECOMMENDATIONS.md](INTERCEPTION_RECOMMENDATIONS.md) - Strategic recommendations
- [NETWORK_INTERCEPTION_PLAN.md](NETWORK_INTERCEPTION_PLAN.md) - **Implementation roadmap** ⭐

---

## Document Summaries

### README_COMPLETE.md
**Purpose:** Complete user guide and API reference

**Contents:**
- Features overview
- Installation instructions
- Quick start guide
- How it works (architecture overview)
- Configuration options
- Complete API reference
- Use cases and examples
- Troubleshooting guide
- Best practices

**Audience:** Developers using rn-buoy
**Read Time:** 30 minutes

---

### REACT_NATIVE_NETWORK_ARCHITECTURE.md
**Purpose:** Deep dive into React Native's networking implementation

**Contents:**
- Architecture layers (7 layers from user code to native)
- Complete request/response flow diagrams
- Type system and interfaces
- Interception points at each layer
- Platform-specific implementations (iOS/Android)
- Extensibility mechanisms
- Performance considerations
- Critical insights for interception

**Audience:** Advanced developers, contributors
**Read Time:** 45 minutes

---

### NETWORK_INTERCEPTION_API.md
**Purpose:** Complete guide to network interception strategies

**Contents:**
- Overview of interception approaches
- Architecture summary
- 3 interception points:
  1. JavaScript XHR Interceptor (official)
  2. Method Swizzling (current implementation)
  3. Native layer interception
- Complete implementation examples
- API reference
- Best practices
- Common pitfalls
- Testing guide
- Performance considerations
- Compatibility notes

**Audience:** Developers implementing network monitoring
**Read Time:** 60 minutes

---

### QUERY_PARAMS_ISSUE_ANALYSIS.md
**Purpose:** Root cause analysis and fix for query parameter display bug

**Contents:**
- Executive summary
- Detailed data flow analysis
- Code locations where params are captured vs lost
- Why it happens (event object structure)
- 3 fix options with trade-offs
- Recommended fix (1 line change)
- Verification steps
- Edge cases to handle
- Testing checklist

**Audience:** Anyone experiencing query param issues
**Read Time:** 15 minutes

---

### INTERCEPTION_RECOMMENDATIONS.md
**Purpose:** Strategic recommendations for interception approach

**Contents:**
- Comparison of 4 approaches (XHR Interceptor, Swizzling, Native, Hybrid)
- Recommended hybrid architecture
- Implementation plan (3 phases)
- Current issues and fixes
- Edge cases to handle
- Alternative approaches
- Migration path
- Conclusion and next steps

**Audience:** Technical leads, architects
**Read Time:** 30 minutes

---

### NETWORK_INTERCEPTION_PLAN.md
**Purpose:** Phased implementation roadmap

**Contents:**
- Executive summary (current state, goals)
- Phase 1: Critical Fixes (Week 1)
  - Query param display
  - Request object handling
  - Response size limits
  - Error handling
- Phase 2: XHR Interceptor (Week 2-3)
  - Implement XHR Interceptor
  - Add mode selection
- Phase 3: Advanced Features (Week 4-6)
  - Better body capture
  - Multiple listeners
  - Request filtering
  - HAR export
- Phase 4: Polish (Week 7-8)
  - Performance monitoring
  - Request replay
  - WebSocket support
  - GraphQL support
- Timeline, success metrics, risk mitigation

**Audience:** Project managers, contributors
**Read Time:** 20 minutes

---

## Reading Paths

### Path 1: Just Want to Use It
1. Start: [README.md](README.md) (5 min)
2. Reference: [README_COMPLETE.md](README_COMPLETE.md) API section (10 min)
3. Troubleshooting: [QUERY_PARAMS_ISSUE_ANALYSIS.md](QUERY_PARAMS_ISSUE_ANALYSIS.md) if needed (5 min)

**Total: 20 minutes**

---

### Path 2: Understanding How It Works
1. Start: [README_COMPLETE.md](README_COMPLETE.md) "How It Works" section (10 min)
2. Deep dive: [REACT_NATIVE_NETWORK_ARCHITECTURE.md](REACT_NATIVE_NETWORK_ARCHITECTURE.md) (45 min)
3. Interception: [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md) sections 1-3 (30 min)

**Total: 1.5 hours**

---

### Path 3: Contributing/Fixing Issues
1. Architecture: [REACT_NATIVE_NETWORK_ARCHITECTURE.md](REACT_NATIVE_NETWORK_ARCHITECTURE.md) (45 min)
2. Implementation: [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md) complete (60 min)
3. Current issues: [INTERCEPTION_RECOMMENDATIONS.md](INTERCEPTION_RECOMMENDATIONS.md) (30 min)
4. Roadmap: [NETWORK_INTERCEPTION_PLAN.md](NETWORK_INTERCEPTION_PLAN.md) (20 min)

**Total: 2.5 hours**

---

### Path 4: Quick Fix for Query Params
1. Go directly to: [QUERY_PARAMS_ISSUE_ANALYSIS.md](QUERY_PARAMS_ISSUE_ANALYSIS.md) "The Fix" section
2. Apply 1-line change
3. Test

**Total: 5 minutes**

---

## Key Insights

### 1. fetch() Uses XMLHttpRequest Internally
- **Source:** [REACT_NATIVE_NETWORK_ARCHITECTURE.md](REACT_NATIVE_NETWORK_ARCHITECTURE.md) Section 2
- **Impact:** Intercepting XHR captures both fetch and direct XHR usage
- **Recommendation:** One interception point handles all traffic

---

### 2. Query Parameters ARE Captured
- **Source:** [QUERY_PARAMS_ISSUE_ANALYSIS.md](QUERY_PARAMS_ISSUE_ANALYSIS.md) Section 3
- **Issue:** Captured at interception layer but lost in UI rendering
- **Fix:** 1-line change in NetworkEventDetailView.tsx
- **Status:** Ready to ship

---

### 3. Two Interception Methods Available
- **Source:** [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md) Section 3
- **Method 1:** XHR Interceptor (official, safer, read-only)
- **Method 2:** Method Swizzling (current, full control, riskier)
- **Recommendation:** Hybrid approach (try XHR first, fall back to swizzling)

---

### 4. Critical Bug Fix Needed
- **Source:** [NETWORK_INTERCEPTION_PLAN.md](NETWORK_INTERCEPTION_PLAN.md) Phase 1
- **Bug:** Event handlers replaced instead of using addEventListener
- **Impact:** Breaks React Native EventTarget implementation
- **Status:** Fixed in current implementation
- **Prevention:** Always use addEventListener, never replace handlers

---

### 5. Performance Considerations
- **Source:** [REACT_NATIVE_NETWORK_ARCHITECTURE.md](REACT_NATIVE_NETWORK_ARCHITECTURE.md) Section 8
- **Overhead:** ~0.1ms per request (XHR Interceptor), ~0.5ms (Swizzling)
- **Memory:** Unbounded event array can cause issues
- **Recommendation:** Limit to 500-1000 events, only enable in dev mode

---

## FAQ

### Q: Why are my query parameters not showing?
**A:** See [QUERY_PARAMS_ISSUE_ANALYSIS.md](QUERY_PARAMS_ISSUE_ANALYSIS.md) - 1-line fix available.

### Q: Should I use XHR Interceptor or Method Swizzling?
**A:** See [INTERCEPTION_RECOMMENDATIONS.md](INTERCEPTION_RECOMMENDATIONS.md) - Hybrid approach recommended.

### Q: How does fetch interception work?
**A:** See [REACT_NATIVE_NETWORK_ARCHITECTURE.md](REACT_NATIVE_NETWORK_ARCHITECTURE.md) Section 3 - Complete flow diagram.

### Q: What are the best practices?
**A:** See [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md) Section 6 - Best practices guide.

### Q: What's the implementation roadmap?
**A:** See [NETWORK_INTERCEPTION_PLAN.md](NETWORK_INTERCEPTION_PLAN.md) - 4-phase plan over 8 weeks.

### Q: Can I capture request bodies?
**A:** Partially. See [INTERCEPTION_RECOMMENDATIONS.md](INTERCEPTION_RECOMMENDATIONS.md) Section 4.2 - FormData/Blob capture coming in Phase 3.

### Q: Does it work with axios/other libraries?
**A:** Yes! See [REACT_NATIVE_NETWORK_ARCHITECTURE.md](REACT_NATIVE_NETWORK_ARCHITECTURE.md) Section 1 - All libraries use XHR internally.

### Q: Will it conflict with Chrome debugger?
**A:** Maybe. See [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md) Section 3.1 - Hybrid mode auto-detects and adjusts.

### Q: What React Native versions are supported?
**A:** See [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md) Section 10 - Compatibility table.

---

## Visual Diagrams

### Architecture Diagram
See [REACT_NATIVE_NETWORK_ARCHITECTURE.md](REACT_NATIVE_NETWORK_ARCHITECTURE.md) Section 2 for:
- 7-layer architecture
- Complete request flow (iOS and Android paths)
- Event propagation

### Data Flow Diagram
See [QUERY_PARAMS_ISSUE_ANALYSIS.md](QUERY_PARAMS_ISSUE_ANALYSIS.md) Section 2.1 for:
- Where params are captured
- Where params are lost
- Complete data flow from interception to UI

### Interception Points
See [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md) Section 2 for:
- JavaScript layer interception
- Native layer interception
- Platform-specific implementations

---

## Code Examples

### Quick Start
```typescript
import { networkToolPreset } from '@react-buoy/network';

const installedApps = [networkToolPreset];
```
**Source:** [README_COMPLETE.md](README_COMPLETE.md) Section 2

---

### Custom Configuration
```typescript
import { createNetworkTool } from '@react-buoy/network';

const myTool = createNetworkTool({
  name: "API",
  colorPreset: "green",
});
```
**Source:** [README_COMPLETE.md](README_COMPLETE.md) Section 3

---

### XHR Interceptor
```typescript
XMLHttpRequest.__setInterceptor_DO_NOT_USE({
  requestSent(id, url, method, headers) { /* ... */ },
  responseReceived(id, url, status, headers) { /* ... */ },
  // ...
});
```
**Source:** [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md) Section 3.1

---

### Method Swizzling
```typescript
const originalFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = async (input, init) => {
  // Intercept
  const response = await originalFetch(input, init);
  return response;
};
```
**Source:** [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md) Section 3.2

---

### Query Param Fix
```typescript
// NetworkEventDetailView.tsx line 38
<UrlBreakdown url={event.url + (event.query || '')} />
```
**Source:** [QUERY_PARAMS_ISSUE_ANALYSIS.md](QUERY_PARAMS_ISSUE_ANALYSIS.md) Section 6

---

## Contributing

### Before You Start
1. Read: [REACT_NATIVE_NETWORK_ARCHITECTURE.md](REACT_NATIVE_NETWORK_ARCHITECTURE.md)
2. Understand: [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md)
3. Check roadmap: [NETWORK_INTERCEPTION_PLAN.md](NETWORK_INTERCEPTION_PLAN.md)

### Making Changes
1. Follow best practices from [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md) Section 6
2. Test with examples from [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md) Section 8
3. Update documentation

### Reporting Issues
Include:
- What you expected (reference docs)
- What actually happened
- Code example
- React Native version
- Platform (iOS/Android)

---

## Version History

### v1.0.0 (Current)
- Method swizzling implementation
- Query parameter parsing
- Event storage and UI
- Known issue: Query params not displayed (fix available)

### v1.1.0 (Planned - Phase 1)
- Query param display fixed
- Request object handling improved
- Response size limits
- Better error handling

### v1.2.0 (Planned - Phase 2)
- XHR Interceptor option
- Mode selection (xhr/swizzle/hybrid)
- Auto-detection

### v2.0.0 (Planned - Phase 3+)
- Better body capture
- Multiple listeners
- HAR export
- Advanced features

---

## Support

- GitHub Issues: [react-native-buoy/issues](https://github.com/LovesWorking/react-native-buoy/issues)
- Documentation: This directory
- Examples: See [README_COMPLETE.md](README_COMPLETE.md) Section 7

---

## License

MIT - See main repository

---

**Last Updated:** 2025-11-04
**Maintainers:** React Buoy Team
