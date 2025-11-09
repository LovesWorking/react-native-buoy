#!/usr/bin/env bash
set -euo pipefail

print_step() {
  printf '\n\033[1;34m==> %s\033[0m\n' "$1"
}

print_success() {
  printf '\033[1;32m%s\033[0m\n' "$1"
}

print_warning() {
  printf '\033[1;33m%s\033[0m\n' "$1"
}

print_error() {
  printf '\033[1;31m%s\033[0m\n' "$1" >&2
}

# Parse arguments
PRERELEASE_ID="beta"
DRY_RUN=false
SKIP_TESTS=false
NO_GIT=true

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --with-git)
      NO_GIT=false
      shift
      ;;
    --help)
      echo "Usage: $0 [prerelease-id] [options]"
      echo ""
      echo "Arguments:"
      echo "  prerelease-id    Pre-release identifier (default: beta)"
      echo "                   Examples: beta, alpha, rc, canary"
      echo ""
      echo "Options:"
      echo "  --dry-run        Show what would be published without actually publishing"
      echo "  --skip-tests     Skip lint, typecheck, and smoke tests"
      echo "  --with-git       Create git commits and tags (default: no git operations)"
      echo "  --help           Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                    # Release as beta (0.1.32 -> 0.1.33-beta.0)"
      echo "  $0 alpha              # Release as alpha (0.1.32 -> 0.1.33-alpha.0)"
      echo "  $0 --dry-run          # See what would happen without publishing"
      echo "  $0 beta --with-git    # Release beta and commit to git"
      exit 0
      ;;
    -*)
      echo "Unknown option: $1"
      exit 1
      ;;
    *)
      PRERELEASE_ID="$1"
      shift
      ;;
  esac
done

CHG_DIR=".changeset"
mkdir -p "$CHG_DIR"

if [ "$DRY_RUN" = true ]; then
  print_warning "🔍 DRY RUN MODE - No packages will be published"
fi

print_step "Ensuring clean working tree"
if [ -n "$(git status --porcelain)" ]; then
  print_error "Working tree is dirty. Commit or stash changes before running the release script."
  exit 1
fi

print_step "Generating $PRERELEASE_ID changeset for all packages"
changeset_file="$CHG_DIR/auto-beta-release-$(date +%s).md"
{
  echo "---"
  for pkg_json in packages/*/package.json; do
    [ -f "$pkg_json" ] || continue
    pkg_name=$(node -p "require('./$pkg_json').name")
    if [ -n "$pkg_name" ]; then
      echo "\"$pkg_name\": patch"
    fi
  done
  echo "---"
  echo
  echo "Automated $PRERELEASE_ID release for all packages."
} > "$changeset_file"

print_step "Entering pre-release mode"
pnpm changeset pre enter "$PRERELEASE_ID"

print_step "Installing dependencies"
pnpm install --frozen-lockfile

if [ "$SKIP_TESTS" = false ]; then
  print_step "Running lint"
  pnpm run lint

  print_step "Running typecheck"
  pnpm run typecheck

  print_step "Running smoke tests"
  pnpm run smoke
else
  print_warning "⚠️  Skipping tests (--skip-tests flag provided)"
fi

print_step "Building packages"
pnpm run build:packages

# Save the current git ref before versioning (changeset version creates commits)
if [ "$DRY_RUN" = true ]; then
  ORIGINAL_REF=$(git rev-parse HEAD)
fi

print_step "Applying version bumps"
pnpm changeset version

print_step "Reinstalling to update lockfiles"
pnpm install

print_step "Exiting pre-release mode"
pnpm changeset pre exit

if [ "$DRY_RUN" = true ]; then
  print_step "DRY RUN: Would publish the following packages"
  for pkg_json in packages/*/package.json; do
    [ -f "$pkg_json" ] || continue
    pkg_name=$(node -p "require('./$pkg_json').name")
    pkg_version=$(node -p "require('./$pkg_json').version")
    echo "  - $pkg_name@$pkg_version (tag: $PRERELEASE_ID)"
  done

  print_step "Cleaning up (reverting version changes)"
  git reset --hard "$ORIGINAL_REF"
  git clean -fd .changeset/
  pnpm install

  print_success "✅ Dry run complete. No packages were published."
  exit 0
fi

print_step "Publishing packages with $PRERELEASE_ID tag"

# Order matters: shared UI first so dependents see fresh type output
ordered_dirs=(
  "packages/shared"
  "packages/devtools-floating-menu"
  "packages/env-tools"
  "packages/network"
  "packages/storage"
  "packages/react-query"
  "packages/route-events"
  "packages/debug-borders"
  "packages/bottom-sheet"
)

for dir in "${ordered_dirs[@]}"; do
  pkg_json="$dir/package.json"
  if [ ! -f "$pkg_json" ]; then
    print_warning "Skipping $dir (package.json not found)"
    continue
  fi

  pkg_name=$(node -p "require('./$pkg_json').name")
  pkg_version=$(node -p "require('./$pkg_json').version")

  if npm view "$pkg_name@$pkg_version" version >/dev/null 2>&1; then
    print_warning "Skipping $pkg_name@$pkg_version (already on npm)"
    continue
  fi

  print_step "Building $pkg_name"
  pnpm --filter "$pkg_name" run build

  print_step "Publishing $pkg_name@$pkg_version"
  pnpm publish --filter "$pkg_name" --access public --tag "$PRERELEASE_ID" --no-git-checks

  print_success "✅ Published $pkg_name@$pkg_version"
done

if [ "$NO_GIT" = false ]; then
  print_step "Creating release commit"
  git add .
  if ! git diff --cached --quiet; then
    git commit -m "chore: release $PRERELEASE_ID packages"

    print_step "Pushing commit and tags"
    git push
    git push --follow-tags
  else
    print_warning "No git changes to commit"
  fi
else
  print_warning "⚠️  Git operations skipped (no --with-git flag)"
  print_warning "    Version changes are in working tree"
  print_warning "    Run 'git reset --hard HEAD && pnpm install' to revert"
fi

print_success ""
print_success "🎉 All packages published with @$PRERELEASE_ID tag!"
print_success ""
print_success "To install in your app:"
for pkg_json in packages/*/package.json; do
  [ -f "$pkg_json" ] || continue
  pkg_name=$(node -p "require('./$pkg_json').name")
  pkg_version=$(node -p "require('./$pkg_json').version")
  echo "  npm install $pkg_name@$PRERELEASE_ID  # or $pkg_name@$pkg_version"
done
print_success ""

if [ "$NO_GIT" = true ]; then
  print_warning "⚠️  Remember to revert local changes or commit them:"
  echo "  git reset --hard HEAD && pnpm install  # Revert changes"
  echo "  git add . && git commit -m 'chore: beta release'  # Or commit them"
fi
