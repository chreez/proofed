#!/bin/bash
# Reminder hook - runs when Claude stops responding
# Non-blocking (exit 0), just outputs a reminder

# Check if any recipe or component files were modified in this session
# This is a simple reminder - actual validation runs via /validate skill

echo "Reminder: If you modified recipe JSON or components, run /validate to verify spec compliance."
exit 0
