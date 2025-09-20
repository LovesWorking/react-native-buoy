#!/usr/bin/env bash
set -euo pipefail

print_step() {
  printf '\n\033[1;34m==> %s\033[0m\n' "$1"
}

print_step "Ensuring clean working tree"
if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is dirty. Commit or stash changes before running the release script." >&2
  exit 1
fi

print_step "Installing dependencies"
pnpm install --frozen-lockfile

print_step "Running lint"
pnpm run lint

print_step "Running typecheck"
pnpm run typecheck

print_step "Building packages"
pnpm run build:packages

print_step "Applying pending changesets"
pnpm changeset version

print_step "Reinstalling to update lockfiles"
pnpm install

print_step "Creating release commit"
git add .
if git diff --cached --quiet; then
  echo "No version updates detected; skipping release." >&2
  exit 0
fi

git commit -m "chore: release"

print_step "Publishing packages"
pnpm changeset publish "$@"

print_step "All done"
