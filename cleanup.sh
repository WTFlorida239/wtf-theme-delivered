#!/bin/bash

# This script removes duplicate directories and old Git-related files.

# WARNING: This script will permanently delete files and directories. 
# Please review the script carefully and make sure you have a backup if needed.

# Find and remove directories ending with " 2"
find . -type d -name "* 2" -exec rm -rf {} + 

# Remove old .git and .github directories if they exist
if [ -d ".git" ]; then
  rm -rf .git
fi

if [ -d ".github" ]; then
  rm -rf .github
fi

if [ -d ".git 2" ]; then
  rm -rf ".git 2"
fi

if [ -d ".github 2" ]; then
  rm -rf ".github 2"
fi

echo "Cleanup complete."
