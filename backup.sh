#!/bin/bash

# Q-Music App Backup Script
# This script creates backups of your project and manages git commits

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get current timestamp
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

echo -e "${BLUE}=== Q-Music Backup Script ===${NC}"
echo -e "${BLUE}Timestamp: $TIMESTAMP${NC}"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not in a git repository!${NC}"
    echo "Run this script from the qmusic-app directory"
    exit 1
fi

# Function to create file backups
create_file_backups() {
    echo -e "${YELLOW}Creating file backups...${NC}"
    
    # Create backups directory if it doesn't exist
    mkdir -p backups
    
    # Backup critical files
    cp src/App.jsx "backups/App_backup_$TIMESTAMP.jsx" 2>/dev/null || echo "App.jsx not found"
    cp src/styles.css "backups/styles_backup_$TIMESTAMP.css" 2>/dev/null || echo "styles.css not found"
    cp package.json "backups/package_backup_$TIMESTAMP.json" 2>/dev/null || echo "package.json not found"
    
    # Create a full project archive
    tar -czf "backups/qmusic_full_backup_$TIMESTAMP.tar.gz" \
        --exclude=node_modules \
        --exclude=dist \
        --exclude=.git \
        --exclude=backups \
        . 2>/dev/null
    
    echo -e "${GREEN}✓ File backups created in backups/ directory${NC}"
}

# Function to check git status and create git backup
create_git_backup() {
    echo -e "${YELLOW}Checking git status...${NC}"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}Found uncommitted changes:${NC}"
        git status --short
        echo ""
        
        # Ask user if they want to commit
        read -p "Do you want to commit these changes? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter commit message: " commit_message
            if [ -z "$commit_message" ]; then
                commit_message="Backup commit - $TIMESTAMP"
            fi
            
            git add .
            git commit -m "$commit_message"
            echo -e "${GREEN}✓ Changes committed${NC}"
        else
            echo -e "${YELLOW}Creating stash backup of uncommitted changes...${NC}"
            git stash push -m "Backup stash - $TIMESTAMP"
            echo -e "${GREEN}✓ Uncommitted changes stashed${NC}"
        fi
    else
        echo -e "${GREEN}✓ Working directory is clean${NC}"
    fi
    
    # Create a backup branch
    current_branch=$(git branch --show-current)
    backup_branch="backup-${current_branch}-$TIMESTAMP"
    
    git branch "$backup_branch"
    echo -e "${GREEN}✓ Created backup branch: $backup_branch${NC}"
}

# Function to test build
test_build() {
    echo -e "${YELLOW}Testing build...${NC}"
    
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Build successful${NC}"
    else
        echo -e "${RED}⚠ Build failed! Check your code.${NC}"
        echo "Run 'npm run build' to see detailed errors"
    fi
}

# Function to clean old backups (keep last 10)
clean_old_backups() {
    echo -e "${YELLOW}Cleaning old backups...${NC}"
    
    if [ -d "backups" ]; then
        # Keep only the 10 most recent backup files
        find backups -name "*_backup_*.jsx" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true
        find backups -name "*_backup_*.css" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true
        find backups -name "*_backup_*.json" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true
        find backups -name "*_full_backup_*.tar.gz" -type f | sort -r | tail -n +6 | xargs rm -f 2>/dev/null || true
        
        echo -e "${GREEN}✓ Old backups cleaned${NC}"
    fi
    
    # Clean old git backup branches (keep last 5)
    old_branches=$(git branch | grep "backup-.*-[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}" | sort -r | tail -n +6)
    if [ ! -z "$old_branches" ]; then
        echo "$old_branches" | xargs git branch -D 2>/dev/null || true
        echo -e "${GREEN}✓ Old git backup branches cleaned${NC}"
    fi
}

# Function to sync with GitHub
sync_with_github() {
    echo -e "${YELLOW}Syncing with GitHub...${NC}"
    
    # Check if we have a GitHub remote
    if git remote | grep -q origin; then
        # Push current branch
        current_branch=$(git branch --show-current)
        echo "Pushing $current_branch to GitHub..."
        
        if git push origin "$current_branch" 2>/dev/null; then
            echo -e "${GREEN}✓ Current branch pushed to GitHub${NC}"
        else
            echo -e "${YELLOW}⚠ Could not push to GitHub (check connection/credentials)${NC}"
        fi
        
        # Push backup branches (only new ones)
        backup_branch="backup-${current_branch}-$TIMESTAMP"
        if git push origin "$backup_branch" 2>/dev/null; then
            echo -e "${GREEN}✓ Backup branch pushed to GitHub${NC}"
        else
            echo -e "${YELLOW}⚠ Could not push backup branch to GitHub${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ No GitHub remote configured${NC}"
    fi
}

# Main execution
echo "1. Creating file backups..."
create_file_backups
echo ""

echo "2. Creating git backup..."
create_git_backup
echo ""

echo "3. Testing build..."
test_build
echo ""

echo "4. Cleaning old backups..."
clean_old_backups
echo ""

echo "5. Syncing with GitHub..."
sync_with_github
echo ""

echo -e "${GREEN}=== Backup Complete! ===${NC}"
echo -e "${BLUE}Summary:${NC}"
echo "- File backups stored in: backups/"
echo "- Git backup branch: backup-$(git branch --show-current)-$TIMESTAMP"
echo "- Build status: $(npm run build > /dev/null 2>&1 && echo "✓ Working" || echo "⚠ Failed")"
echo "- GitHub sync: $(git remote | grep -q origin && echo "✓ Connected" || echo "⚠ Not configured")"
echo ""
echo -e "${BLUE}To restore from backup:${NC}"
echo "- Files: cp backups/App_backup_TIMESTAMP.jsx src/App.jsx"
echo "- Git: git checkout backup-BRANCH-TIMESTAMP"
echo ""
