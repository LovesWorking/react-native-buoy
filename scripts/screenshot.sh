#!/usr/bin/env bash
set -euo pipefail

#!/usr/bin/env bash
# screenshots/screenshot.sh
# Cross-platform (iOS Simulator / Android Emulator or device) screenshot helper.
# Usage:
#   bash scripts/screenshot.sh [ios|android|auto] [output_path]
# Examples:
#   bash scripts/screenshot.sh                # auto-detect, save to ./screenshots/sim-YYYYmmdd-HHMMSS.png
#   bash scripts/screenshot.sh ios            # force iOS, default output path
#   bash scripts/screenshot.sh android        # force Android, default output path
#   bash scripts/screenshot.sh auto ./screenshots/mycap.png

MODE="${1:-auto}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DEFAULT_OUT="./screenshots/sim-${TIMESTAMP}.png"
OUT="${2:-$DEFAULT_OUT}"

mkdir -p "$(dirname "$OUT")"

# Always attempt a fast reload before capturing to ensure fresh UI
if [ -f "scripts/reload.js" ]; then
  echo "Attempting fast reload before screenshot..."
  node scripts/reload.js --fast || echo "Reload attempt failed or not available; continuing."
fi

have_cmd() { command -v "$1" >/dev/null 2>&1; }

take_ios_screenshot() {
  if ! have_cmd xcrun; then
    echo "xcrun not found. Install Xcode command line tools." >&2
    return 1
  fi
  # Attempt to capture from the booted simulator.
  xcrun simctl io booted screenshot "$OUT"
  echo "iOS screenshot saved: $OUT"
}

take_android_screenshot() {
  if ! have_cmd adb; then
    echo "adb not found. Install Android Platform Tools." >&2
    return 1
  fi
  # Ensure at least one device/emulator is connected and in 'device' state
  if ! adb get-state >/dev/null 2>&1; then
    echo "No Android device/emulator detected by adb." >&2
    return 1
  fi
  # Use exec-out to stream PNG to file
  adb exec-out screencap -p > "$OUT"
  echo "Android screenshot saved: $OUT"
}

case "$MODE" in
  ios)
    take_ios_screenshot || exit 1
    ;;
  android)
    take_android_screenshot || exit 1
    ;;
  auto)
    if have_cmd xcrun; then
      if take_ios_screenshot; then exit 0; fi
      echo "Falling back to Android after iOS attempt..." >&2
    fi
    if have_cmd adb; then
      if take_android_screenshot; then exit 0; fi
    fi
    echo "Could not take screenshot. Ensure iOS Simulator or Android device/emulator is running." >&2
    exit 1
    ;;
  *)
    echo "Unknown mode: $MODE (use ios|android|auto)" >&2
    exit 1
    ;;
esac