#!/bin/bash

# Q-Music GitHub Pages Deployment Script
# This script builds and deploys your app to GitHub Pages

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Q-Music GitHub Pages Deployment ===${NC}"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not in a git repository!${NC}"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    git status --short
    echo ""
    read -p "Continue with deployment? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Create backup before deployment
echo -e "${YELLOW}1. Creating backup before deployment...${NC}"
if [ -f "./backup.sh" ]; then
    ./backup.sh
    echo -e "${GREEN}✓ Backup created${NC}"
else
    echo -e "${YELLOW}⚠ No backup script found${NC}"
fi
echo ""

# Build the project
echo -e "${YELLOW}2. Building project...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed!${NC}"
    echo "Fix build errors before deployment"
    exit 1
fi
echo ""

# Check if gh-pages branch exists
if git show-ref --verify --quiet refs/heads/gh-pages; then
    echo -e "${YELLOW}3. Updating existing gh-pages branch...${NC}"
    git checkout gh-pages
    
    # Remove old files but keep .git
    find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} + 2>/dev/null || true
    
    # Copy dist files to root
    cp -r dist/* . 2>/dev/null || true
    
    # Add and commit
    git add .
    git commit -m "Deploy to GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
    
else
    echo -e "${YELLOW}3. Creating gh-pages branch...${NC}"
    
    # Create and switch to gh-pages branch
    git checkout --orphan gh-pages
    
    # Remove all files
    git rm -rf .
    
    # Copy dist files
    cp -r dist/* . 2>/dev/null || true
    
    # Add and commit
    git add .
    git commit -m "Initial GitHub Pages deployment"
fi

echo -e "${GREEN}✓ Files prepared for deployment${NC}"
echo ""

# Push to GitHub
echo -e "${YELLOW}4. Pushing to GitHub Pages...${NC}"
if git push origin gh-pages --force; then
    echo -e "${GREEN}✓ Deployed to GitHub Pages!${NC}"
else
    echo -e "${RED}✗ Failed to push to GitHub${NC}"
    exit 1
fi
echo ""

# Return to main branch
echo -e "${YELLOW}5. Returning to main branch...${NC}"
git checkout master 2>/dev/null || git checkout main 2>/dev/null
echo -e "${GREEN}✓ Back on main branch${NC}"
echo ""

# Get GitHub username and repo name from remote URL
GITHUB_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ $GITHUB_URL =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
    USERNAME="${BASH_REMATCH[1]}"
    REPO="${BASH_REMATCH[2]}"
    PAGES_URL="https://${USERNAME}.github.io/${REPO}"
    
    echo -e "${GREEN}=== Deployment Complete! ===${NC}"
    echo -e "${BLUE}Your app will be available at:${NC}"
    echo -e "${YELLOW}${PAGES_URL}${NC}"
    echo ""
    echo -e "${BLUE}Note:${NC} GitHub Pages may take a few minutes to update."
    echo "Check repository settings to ensure GitHub Pages is enabled."
else
    echo -e "${GREEN}=== Deployment Complete! ===${NC}"
    echo "Check your GitHub repository settings for the Pages URL."
fi

echo ""
echo -e "${BLUE}GitHub Pages Setup Instructions:${NC}"
echo "1. Go to your repository on GitHub"
echo "2. Go to Settings > Pages"
echo "3. Set Source to 'Deploy from a branch'"
echo "4. Set Branch to 'gh-pages' and folder to '/ (root)'"
echo "5. Click Save"
