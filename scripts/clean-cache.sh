#!/bin/bash
set -e

PROJECT=$1

function clean_all() {
  echo "🧹 Cleaning all Metro caches..."
  watchman watch-del-all 2>/dev/null || echo "⚠️  Watchman not running or not installed"
  rm -rf /tmp/metro-* /tmp/haste-map-* 2>/dev/null || true
  rm -rf example/node_modules/.cache example/.metro-file-map
  rm -rf example-dev-build/node_modules/.cache example-dev-build/.metro-file-map
  echo "✅ All caches cleaned"
}

function clean_example() {
  echo "🧹 Cleaning example app cache..."
  rm -rf example/node_modules/.cache example/.metro-file-map
  echo "✅ example cache cleaned"
}

function clean_dev_build() {
  echo "🧹 Cleaning example-dev-build cache..."
  rm -rf example-dev-build/node_modules/.cache example-dev-build/.metro-file-map
  echo "✅ example-dev-build cache cleaned"
}

case "$PROJECT" in
  all|"")
    clean_all
    ;;
  example|go)
    clean_example
    ;;
  dev|dev-build)
    clean_dev_build
    ;;
  *)
    echo "Usage: ./scripts/clean-cache.sh [all|example|dev-build]"
    echo ""
    echo "Options:"
    echo "  all         - Clean all Metro caches (default)"
    echo "  example|go  - Clean only example (Expo Go) app cache"
    echo "  dev-build   - Clean only example-dev-build cache"
    exit 1
    ;;
esac
