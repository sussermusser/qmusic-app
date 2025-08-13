#!/bin/bash
# Q-Music Quick Commands

# Add these to your ~/.bashrc or ~/.profile for permanent aliases
# Or just run this script: source quick-commands.sh

# Quick backup command
alias qbackup='cd /home/iffiolen/REACT-PROJECTS/qmusic-app/qmusic-app && ./backup.sh'

# Quick restore command  
alias qrestore='cd /home/iffiolen/REACT-PROJECTS/qmusic-app/qmusic-app && ./restore.sh'

# Quick build test
alias qbuild='cd /home/iffiolen/REACT-PROJECTS/qmusic-app/qmusic-app && npm run build'

# Quick dev start
alias qdev='cd /home/iffiolen/REACT-PROJECTS/qmusic-app/qmusic-app && npm run dev'

# Quick git status
alias qstatus='cd /home/iffiolen/REACT-PROJECTS/qmusic-app/qmusic-app && git status'

# Quick commit
alias qcommit='cd /home/iffiolen/REACT-PROJECTS/qmusic-app/qmusic-app && git add . && git commit -m'

# Emergency restore
alias qemergency='cd /home/iffiolen/REACT-PROJECTS/qmusic-app/qmusic-app && git checkout backup-working-version && echo "Emergency restore complete - testing build..." && npm run build'

echo "Q-Music aliases loaded!"
echo "Available commands:"
echo "  qbackup     - Create full backup"
echo "  qrestore    - Restore from backup"  
echo "  qbuild      - Test build"
echo "  qdev        - Start development server"
echo "  qstatus     - Check git status"
echo "  qcommit     - Quick commit (usage: qcommit 'message')"
echo "  qemergency  - Emergency restore to working version"
