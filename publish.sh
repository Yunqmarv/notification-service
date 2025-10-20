#!/bin/bash

# Git publish script for slingfrontend
# This script will add, commit, and push changes to the main branch

set -e  # Exit on any error

echo "🚀 Publishing changes to git..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if there are any changes to commit
if git diff --quiet && git diff --cached --quiet; then
    echo "ℹ️  No changes to commit"
    exit 0
fi

# Show current status
echo "📋 Current git status:"
git status --short

# Add all changes
echo "➕ Adding all changes..."
git add .

# Check if a commit message was provided as an argument
if [ $# -eq 0 ]; then
    # No commit message provided, use a default one with timestamp
    COMMIT_MSG="Fix time clock difference calculation - $(date '+%Y-%m-%d %H:%M:%S')"
else
    # Use the provided commit message
    COMMIT_MSG="$*"
fi

# Commit changes
echo "💾 Committing changes with message: '$COMMIT_MSG'"
git commit -m "$COMMIT_MSG"

# Get current branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🌿 Current branch: $BRANCH"

# Push to remote
echo "📤 Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

echo "✅ Successfully published changes to git!"
echo "🔗 Changes are now available on the remote repository"
