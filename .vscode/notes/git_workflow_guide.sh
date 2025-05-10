#!/bin/bash
# ---------------------------------------------
# Git Workflow Guide – For In-Development Projects
# Author: Hussain Shareef (@kudadonbe)
# Use Case: Internal project in use, not yet fully released
# Last Updated: 2025-05-10
# ---------------------------------------------
# This is not meant to be run as a script.
# Use it as a reference to manually run commands in terminal.
# ---------------------------------------------

# ---------------------------------------------
# STEP 1: SWITCH TO DEVELOPING BRANCH AND START WORK
# ---------------------------------------------

# Switch to developing branch
git switch developing

# Pull latest updates to ensure you're up to date
git pull

# Make your changes (code, fix, or feature)
# Then stage and commit your changes:
git add .
git commit -m "Describe what was added or fixed"

# ---------------------------------------------
# STEP 2: MERGE STABLE CHANGES TO MAIN BRANCH
# ---------------------------------------------

# Switch to main branch (your stable code base)
git switch main

# Pull latest stable updates
git pull

# Merge the completed and tested work from developing
git merge developing

# If Git opens an editor asking for a commit message:
# - Leave the default message like: Merge branch 'developing'
# - In VS Code: Save and close the tab
# - In terminal (vim): press Esc, type :wq and press Enter
# OR use --no-edit to skip the editor:
#   git merge developing --no-edit

# ---------------------------------------------
# STEP 3: TAG THE STABLE VERSION
# ---------------------------------------------

# Create an annotated tag with version and message
# Format: v<MAJOR>.<MINOR>.<PATCH>
git tag -a v0.4.0 -m "Stable: Describe what this version includes"

# Push the main branch and the new tag to origin
git push origin main
git push origin v0.4.0

# ---------------------------------------------
# STEP 4: SWITCH BACK TO DEVELOPING
# ---------------------------------------------

# Return to developing branch to continue next task/module
git switch developing

# Now continue working on the next feature or fix
