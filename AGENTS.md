# AGENTS.md

## Project Overview

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Critical Rules

### Development Server Management

**NEVER kill, restart, or start the development server (Expo/Metro) unless explicitly asked by the user.**

- Do NOT use `pkill`, `kill`, `lsof -ti`, or similar commands to stop dev servers
- Do NOT run `npx expo start` or `npm start` unless specifically requested
- The user manages their own dev server - assume it's already running
- If you need to verify something is working, ask the user to test it instead of restarting the server

#### DevTools Integration

- **React Native DevTools**: Use MCP `open_devtools` command to launch debugging tools
- **Network Inspection**: Monitor API calls and network requests in DevTools
- **Element Inspector**: Debug component hierarchy and styles
- **Performance Profiler**: Identify performance bottlenecks
- **Logging**: Use `console.log` for debugging (remove before production), `console.warn` for deprecation notices, `console.error` for actual errors, and implement error boundaries for production error handling

### Testing & Quality Assurance

#### Automated Testing with MCP Tools

- **Component Testing**: Add `testID` props to components for automation
- **Visual Testing**: Use MCP `automation_take_screenshot` to verify UI appearance
- **Interaction Testing**: Use MCP `automation_tap_by_testid` to simulate user interactions
- **View Verification**: Use MCP `automation_find_view_by_testid` to validate component rendering
