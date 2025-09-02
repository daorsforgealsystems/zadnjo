#!/bin/bash

# Setup Automated Database Backup Cron Job
# This script sets up cron jobs for automated database backups

set -e

# Configuration
BACKUP_SCRIPT="/path/to/backup-database.sh"
LOG_FILE="/var/log/db-backup.log"
CRON_SCHEDULE="0 2 * * *"  # Daily at 2 AM

# Function to detect OS and package manager
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get >/dev/null 2>&1; then
            echo "ubuntu"
        elif command -v yum >/dev/null 2>&1; then
            echo "centos"
        elif command -v pacman >/dev/null 2>&1; then
            echo "arch"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

# Function to install cron if not present
install_cron() {
    OS=$(detect_os)
    case $OS in
        ubuntu)
            if ! command -v cron >/dev/null 2>&1; then
                echo "Installing cron..."
                sudo apt-get update
                sudo apt-get install -y cron
                sudo systemctl enable cron
                sudo systemctl start cron
            fi
            ;;
        centos)
            if ! command -v crond >/dev/null 2>&1; then
                echo "Installing cronie..."
                sudo yum install -y cronie
                sudo systemctl enable crond
                sudo systemctl start crond
            fi
            ;;
        arch)
            if ! command -v cronie >/dev/null 2>&1; then
                echo "Installing cronie..."
                sudo pacman -S cronie
                sudo systemctl enable cronie
                sudo systemctl start cronie
            fi
            ;;
        macos)
            # macOS has cron built-in
            ;;
        *)
            echo "Unsupported OS for automatic cron installation"
            exit 1
            ;;
    esac
}

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "ERROR: Backup script not found at $BACKUP_SCRIPT"
    echo "Please update the BACKUP_SCRIPT variable with the correct path"
    exit 1
fi

# Install cron if necessary
install_cron

# Create log file if it doesn't exist
sudo touch "$LOG_FILE"
sudo chmod 644 "$LOG_FILE"

# Create backup directory if it doesn't exist
sudo mkdir -p /backups
sudo chmod 755 /backups

# Add cron job
CRON_JOB="$CRON_SCHEDULE $BACKUP_SCRIPT >> $LOG_FILE 2>&1"

# Check if cron job already exists
if crontab -l | grep -q "$BACKUP_SCRIPT"; then
    echo "Cron job already exists. Updating..."
    # Remove existing cron job
    crontab -l | grep -v "$BACKUP_SCRIPT" | crontab -
fi

# Add new cron job
(crontab -l ; echo "$CRON_JOB") | crontab -

echo "Automated database backup cron job has been set up successfully!"
echo "Schedule: $CRON_SCHEDULE"
echo "Backup script: $BACKUP_SCRIPT"
echo "Log file: $LOG_FILE"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To edit cron jobs manually: crontab -e"
echo ""
echo "Available backup schedules:"
echo "  '0 2 * * *'     - Daily at 2 AM"
echo "  '0 */6 * * *'   - Every 6 hours"
echo "  '0 2 * * 0'     - Weekly on Sunday at 2 AM"
echo "  '0 2 1 * *'     - Monthly on 1st at 2 AM"