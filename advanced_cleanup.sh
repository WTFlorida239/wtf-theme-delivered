#!/bin/bash

# Advanced WTF Theme Repository Cleanup Script
# This script safely removes duplicate directories and files with logging and backup options

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="cleanup_log_$(date +%Y%m%d_%H%M%S).txt"

# Function to log messages
log_message() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to create backup
create_backup() {
    local backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
    log_message "${BLUE}Creating backup in $backup_dir...${NC}"
    mkdir -p "$backup_dir"
    
    # Copy duplicate directories to backup before deletion
    find . -maxdepth 1 -type d -name "* 2" -exec cp -r {} "$backup_dir/" \; 2>/dev/null
    
    if [ -d ".git" ]; then
        cp -r .git "$backup_dir/" 2>/dev/null
    fi
    
    if [ -d ".github" ]; then
        cp -r .github "$backup_dir/" 2>/dev/null
    fi
    
    log_message "${GREEN}Backup created successfully in $backup_dir${NC}"
}

# Function to show what will be deleted
show_preview() {
    log_message "${YELLOW}=== PREVIEW: Files and directories that will be removed ===${NC}"
    
    # Find duplicate directories
    find . -maxdepth 1 -type d -name "* 2" | while read dir; do
        log_message "Directory: $dir"
    done
    
    # Check for old git directories
    [ -d ".git" ] && log_message "Directory: .git"
    [ -d ".github" ] && log_message "Directory: .github"
    [ -d ".git 2" ] && log_message "Directory: .git 2"
    [ -d ".github 2" ] && log_message "Directory: .github 2"
    
    # Find duplicate files
    find . -maxdepth 2 -type f -name "* 2.*" | while read file; do
        log_message "File: $file"
    done
    
    log_message "${YELLOW}=== End of preview ===${NC}"
}

# Function to perform cleanup
perform_cleanup() {
    log_message "${BLUE}Starting cleanup process...${NC}"
    
    local deleted_count=0
    
    # Remove duplicate directories
    log_message "${YELLOW}Removing duplicate directories...${NC}"
    find . -maxdepth 1 -type d -name "* 2" | while read dir; do
        if [ -d "$dir" ]; then
            log_message "Removing directory: $dir"
            rm -rf "$dir"
            ((deleted_count++))
        fi
    done
    
    # Remove old git directories
    if [ -d ".git" ]; then
        log_message "${YELLOW}Removing old .git directory...${NC}"
        rm -rf .git
        ((deleted_count++))
    fi
    
    if [ -d ".github" ]; then
        log_message "${YELLOW}Removing old .github directory...${NC}"
        rm -rf .github
        ((deleted_count++))
    fi
    
    if [ -d ".git 2" ]; then
        log_message "${YELLOW}Removing .git 2 directory...${NC}"
        rm -rf ".git 2"
        ((deleted_count++))
    fi
    
    if [ -d ".github 2" ]; then
        log_message "${YELLOW}Removing .github 2 directory...${NC}"
        rm -rf ".github 2"
        ((deleted_count++))
    fi
    
    # Remove duplicate files
    log_message "${YELLOW}Removing duplicate files...${NC}"
    find . -maxdepth 2 -type f -name "* 2.*" -delete
    
    # Remove common temporary and cache files
    log_message "${YELLOW}Removing temporary and cache files...${NC}"
    find . -name ".DS_Store" -delete 2>/dev/null
    find . -name "Thumbs.db" -delete 2>/dev/null
    find . -name "*.tmp" -delete 2>/dev/null
    find . -name "*.temp" -delete 2>/dev/null
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null
    
    log_message "${GREEN}Cleanup completed successfully!${NC}"
}

# Function to show final directory structure
show_final_structure() {
    log_message "${BLUE}=== Final directory structure ===${NC}"
    ls -la | tee -a "$LOG_FILE"
    log_message "${BLUE}=== End of directory structure ===${NC}"
}

# Main script execution
main() {
    log_message "${GREEN}WTF Theme Advanced Cleanup Script${NC}"
    log_message "${GREEN}Started at: $(date)${NC}"
    log_message "${GREEN}Working directory: $(pwd)${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "config.yml" ] && [ ! -d "templates" ] && [ ! -d "assets" ]; then
        log_message "${RED}Warning: This doesn't appear to be a Shopify theme directory.${NC}"
        log_message "${RED}Expected to find config.yml, templates/, or assets/ directory.${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_message "${YELLOW}Cleanup cancelled by user.${NC}"
            exit 1
        fi
    fi
    
    # Show preview
    show_preview
    
    # Ask for confirmation
    echo
    read -p "Do you want to create a backup before cleanup? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        create_backup
    fi
    
    echo
    read -p "Proceed with cleanup? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        perform_cleanup
        show_final_structure
        log_message "${GREEN}Cleanup completed! Log saved to: $LOG_FILE${NC}"
    else
        log_message "${YELLOW}Cleanup cancelled by user.${NC}"
    fi
}

# Run main function
main "$@"
