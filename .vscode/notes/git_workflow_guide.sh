# //.vscode/notes/git_workflow_guide.sh
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

git switch developing        # Switch to developing branch
git pull                    # Pull latest updates from origin
git add .                   # Stage your changes
git commit -m "Describe what was added or fixed"  # Commit work

# ---------------------------------------------
# STEP 2: MERGE STABLE CHANGES TO MAIN BRANCH
# ---------------------------------------------

git switch main             # Switch to main (stable) branch
git pull                    # Pull latest from origin
git merge developing        # Merge latest work from developing

# ─── Merge Message Behavior ─────────────────────────────────────
# Git will prompt for a merge message IF:
# - The merge is not a fast-forward (both branches have new commits)
#
# ▶ To continue:
#   - In VS Code: Save and close the merge tab
#   - In Vim: Press Esc, type :wq, then Enter
#
# ▶ To skip the editor and use default message automatically:
#   git merge developing --no-edit
#
# ▶ To use a custom message directly:
#   git merge developing -m "Merge: include staff sync and log cleanup"

# ---------------------------------------------
# MERGE CONFLICT: FILE MODIFIED IN DEVELOPING BUT DELETED IN MAIN
# ---------------------------------------------
# Problem:
#   CONFLICT (modify/delete): file deleted in 'main' but modified in 'developing'
#   => Git does not know whether to keep or delete it
#
# Solution: Keep the version from developing

# Restore the file as it existed in developing
git restore --source=developing --staged .vscode/notes/git_workflow_guide.sh
git restore --source=developing .vscode/notes/git_workflow_guide.sh

# Stage and commit the resolution
git add .vscode/notes/git_workflow_guide.sh
git commit -m "Resolve merge conflict: keep git_workflow_guide.sh from developing"

# ---------------------------------------------
# STEP 3: TAG THE STABLE VERSION
# ---------------------------------------------

git tag -a v0.4.0 -m "Stable: Describe what this version includes"
git push origin main
git push origin v0.4.0

# ---------------------------------------------
# STEP 4: SWITCH BACK TO DEVELOPING
# ---------------------------------------------

git switch developing       # Return to developing branch
# Continue next tasks here
