#!/bin/bash

# Prometheus Launch Discipline - Gate Check Script
# This script performs a basic safety audit before implementation or commit.

echo "🔍 Running Prometheus Launch Discipline Audit..."

# 1. Secret Audit
echo "--- 1. Checking for .env leaks in Git status ---"
git_status=$(git status --short -uall)
if echo "$git_status" | grep -q ".env"; then
  echo "❌ ERROR: .env file detected in Git status. Remove it before proceeding."
  exit 1
fi
echo "✅ No .env files detected."

# 2. Branch Check
echo "--- 2. Checking current branch ---"
current_branch=$(git branch --show-current)
if [ "$current_branch" == "main" ]; then
  echo "❌ ERROR: You are on 'main'. Create a feat/fix/chore branch first."
  exit 1
fi
echo "✅ Branch: $current_branch"

# 3. Validation (Optional flags)
if [ "$1" == "--full" ]; then
  echo "--- 3. Running full validation (typecheck, lint) ---"
  npm run typecheck && npm run lint
  if [ $? -ne 0 ]; then
    echo "❌ ERROR: Validation failed."
    exit 1
  fi
  echo "✅ Validation passed."
fi

echo "🚀 Audit complete. Prometheus Launch Discipline is satisfied."
exit 0
