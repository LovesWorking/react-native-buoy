#!/bin/bash

echo "📊 Metro Cache Health Report"
echo "=============================="
echo

# Check system temp caches
if [ -d "/tmp/metro-cache" ] || ls /tmp/metro-* >/dev/null 2>&1; then
  SYSTEM_CACHE_SIZE=$(du -sh /tmp/metro-* 2>/dev/null | awk '{sum+=$1} END {print sum}')
  echo "System /tmp cache: ${SYSTEM_CACHE_SIZE:-0}MB"
else
  echo "System /tmp cache: None (good!)"
fi

# Check project-specific caches
if [ -d "example/node_modules/.cache" ]; then
  EXAMPLE_CACHE_SIZE=$(du -sh example/node_modules/.cache 2>/dev/null | awk '{print $1}')
  echo "example cache: ${EXAMPLE_CACHE_SIZE}"
else
  echo "example cache: Not created yet"
fi

if [ -d "example-dev-build/node_modules/.cache" ]; then
  DEV_CACHE_SIZE=$(du -sh example-dev-build/node_modules/.cache 2>/dev/null | awk '{print $1}')
  echo "example-dev-build cache: ${DEV_CACHE_SIZE}"
else
  echo "example-dev-build cache: Not created yet"
fi

# Check file map caches
echo
echo "File map caches:"
[ -d "example/.metro-file-map" ] && echo "  example: ✓" || echo "  example: Not created yet"
[ -d "example-dev-build/.metro-file-map" ] && echo "  example-dev-build: ✓" || echo "  example-dev-build: Not created yet"

# Check Watchman status
echo
echo "Watchman status:"
if command -v watchman >/dev/null 2>&1; then
  watchman watch-list 2>/dev/null || echo "  Watchman not running"
else
  echo "  Watchman not installed"
fi

# Check for potential issues
echo
if [ -d "/tmp/metro-cache" ]; then
  echo "⚠️  WARNING: Shared /tmp/metro-cache detected"
  echo "   This suggests old cache files exist. Consider running:"
  echo "   ./scripts/clean-cache.sh all"
fi

# Check if both apps running
EXAMPLE_RUNNING=$(lsof -ti:8081 2>/dev/null)
DEV_RUNNING=$(lsof -ti:8082 2>/dev/null)

echo
if [ -n "$EXAMPLE_RUNNING" ] && [ -n "$DEV_RUNNING" ]; then
  echo "✅ Both apps running on correct ports"
  echo "   example: :8081 (PID: $EXAMPLE_RUNNING)"
  echo "   dev-build: :8082 (PID: $DEV_RUNNING)"
elif [ -n "$EXAMPLE_RUNNING" ] || [ -n "$DEV_RUNNING" ]; then
  echo "ℹ️  Single app running (multi-instance not detected)"
  [ -n "$EXAMPLE_RUNNING" ] && echo "   example: :8081 (PID: $EXAMPLE_RUNNING)"
  [ -n "$DEV_RUNNING" ] && echo "   dev-build: :8082 (PID: $DEV_RUNNING)"
else
  echo "ℹ️  No apps currently running"
fi

echo
echo "=============================="
echo "Cache health check complete"
