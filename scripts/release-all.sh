#!/usr/bin/env bash
set -euo pipefail

print_step() {
  printf '\n\033[1;34m==> %s\033[0m\n' "$1"
}

CHG_DIR=".changeset"
mkdir -p "$CHG_DIR"

print_step "Ensuring clean working tree"
if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is dirty. Commit or stash changes before running the release script." >&2
  exit 1
fi

print_step "Generating patch changeset for all packages"
changeset_file="$CHG_DIR/auto-release-$(date +%s).md"
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
  echo "Automated patch release for all packages."
} > "$changeset_file"

print_step "Installing dependencies"
pnpm install --frozen-lockfile

print_step "Running lint"
pnpm run lint

print_step "Running typecheck"
pnpm run typecheck

print_step "Building packages"
pnpm run build:packages

print_step "Running smoke tests"
pnpm run smoke

print_step "Applying version bumps"
initial_rev=$(git rev-parse HEAD)
pnpm changeset version

print_step "Reinstalling to update lockfiles"
pnpm install

post_version_status=$(git status --porcelain)
if [ -n "$post_version_status" ]; then
  print_step "Creating release commit"
  git add .
  git commit -m "chore: release all packages"
fi

post_rev=$(git rev-parse HEAD)

if [ "$initial_rev" = "$post_rev" ]; then
  echo "No version updates detected; skipping publish." >&2
  exit 0
fi

print_step "Publishing packages"
pnpm changeset publish "$@"

print_step "Pushing commit and tags"
git push

git push --follow-tags

print_step "All done"
