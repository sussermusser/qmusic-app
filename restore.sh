#!/bin/bash

# Q-Music App Restore Script
# This script helps you restore from backups

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Q-Music Restore Script ===${NC}"
echo ""

# Function to list available file backups
list_file_backups() {
    echo -e "${YELLOW}Available file backups:${NC}"
    
    if [ -d "backups" ]; then
        echo -e "${BLUE}App.jsx backups:${NC}"
        ls -la backups/App_backup_*.jsx 2>/dev/null | tail -10 || echo "No App.jsx backups found"
        echo ""
        
        echo -e "${BLUE}Full project backups:${NC}"
        ls -la backups/qmusic_full_backup_*.tar.gz 2>/dev/null | tail -5 || echo "No full backups found"
        echo ""
    else
        echo "No backups directory found"
    fi
}

# Function to list git backup branches
list_git_backups() {
    echo -e "${YELLOW}Available git backup branches:${NC}"
    git branch | grep "backup-" | tail -10 || echo "No git backup branches found"
    echo ""
}

# Function to restore file backup
restore_file_backup() {
    echo -e "${YELLOW}File restore options:${NC}"
    echo "1. Restore App.jsx from backup"
    echo "2. Restore full project from backup"
    echo "3. Cancel"
    read -p "Choose option (1-3): " choice
    
    case $choice in
        1)
            if [ -d "backups" ]; then
                echo "Available App.jsx backups:"
                ls backups/App_backup_*.jsx 2>/dev/null | nl
                read -p "Enter backup number to restore: " backup_num
                
                backup_file=$(ls backups/App_backup_*.jsx 2>/dev/null | sed -n "${backup_num}p")
                if [ ! -z "$backup_file" ]; then
                    cp "$backup_file" src/App.jsx
                    echo -e "${GREEN}✓ App.jsx restored from $backup_file${NC}"
                else
                    echo -e "${RED}Invalid backup number${NC}"
                fi
            else
                echo -e "${RED}No backups directory found${NC}"
            fi
            ;;
        2)
            if [ -d "backups" ]; then
                echo "Available full backups:"
                ls backups/qmusic_full_backup_*.tar.gz 2>/dev/null | nl
                read -p "Enter backup number to restore: " backup_num
                
                backup_file=$(ls backups/qmusic_full_backup_*.tar.gz 2>/dev/null | sed -n "${backup_num}p")
                if [ ! -z "$backup_file" ]; then
                    echo -e "${RED}WARNING: This will overwrite current files!${NC}"
                    read -p "Are you sure? (y/n): " -n 1 -r
                    echo ""
                    
                    if [[ $REPLY =~ ^[Yy]$ ]]; then
                        tar -xzf "$backup_file"
                        echo -e "${GREEN}✓ Full project restored from $backup_file${NC}"
                    fi
                else
                    echo -e "${RED}Invalid backup number${NC}"
                fi
            else
                echo -e "${RED}No backups directory found${NC}"
            fi
            ;;
        3)
            echo "Cancelled"
            return
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
}

# Function to restore git backup
restore_git_backup() {
    echo -e "${YELLOW}Available git backup branches:${NC}"
    git branch | grep "backup-" | nl
    read -p "Enter branch number to restore: " branch_num
    
    branch_name=$(git branch | grep "backup-" | sed -n "${branch_num}p" | sed 's/^[* ]*//')
    
    if [ ! -z "$branch_name" ]; then
        current_branch=$(git branch --show-current)
        echo -e "${YELLOW}Current branch: $current_branch${NC}"
        echo -e "${YELLOW}Restoring to: $branch_name${NC}"
        
        # Check for uncommitted changes
        if [ -n "$(git status --porcelain)" ]; then
            echo -e "${RED}You have uncommitted changes!${NC}"
            read -p "Stash them before switching? (y/n): " -n 1 -r
            echo ""
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git stash push -m "Pre-restore stash $(date)"
            else
                echo "Please commit or stash your changes first"
                return
            fi
        fi
        
        git checkout "$branch_name"
        echo -e "${GREEN}✓ Restored to git backup branch: $branch_name${NC}"
        
        read -p "Test build after restore? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm run build
        fi
    else
        echo -e "${RED}Invalid branch number${NC}"
    fi
}

# Main menu
echo "What would you like to restore?"
echo "1. List available backups"
echo "2. Restore from file backup"
echo "3. Restore from git backup"
echo "4. Emergency restore (to last working commit)"
echo "5. Exit"
read -p "Choose option (1-5): " main_choice

case $main_choice in
    1)
        list_file_backups
        list_git_backups
        ;;
    2)
        restore_file_backup
        ;;
    3)
        restore_git_backup
        ;;
    4)
        echo -e "${YELLOW}Emergency restore to backup-working-version branch...${NC}"
        if git show-ref --verify --quiet refs/heads/backup-working-version; then
            git checkout backup-working-version
            echo -e "${GREEN}✓ Emergency restore complete${NC}"
            npm run build
        else
            echo -e "${RED}Emergency backup branch not found!${NC}"
        fi
        ;;
    5)
        echo "Exiting..."
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        ;;
esac

echo ""
echo -e "${BLUE}Restore script complete${NC}"
