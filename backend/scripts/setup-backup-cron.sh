#!/bin/bash
# Setup automated database backups using cron
# Usage: ./setup-backup-cron.sh [backup_directory] [backup_interval]

set -e

BACKUP_DIR="${1:-./backups}"
BACKUP_INTERVAL="${2:-daily}" # daily, weekly, or hourly

# Get absolute path to backup script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup-database.sh"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Determine cron schedule based on interval
case "${BACKUP_INTERVAL}" in
    hourly)
        CRON_SCHEDULE="0 * * * *"  # Every hour at minute 0
        ;;
    daily)
        CRON_SCHEDULE="0 2 * * *"  # Daily at 2 AM
        ;;
    weekly)
        CRON_SCHEDULE="0 2 * * 0"  # Weekly on Sunday at 2 AM
        ;;
    *)
        echo "Error: Invalid backup interval. Use: hourly, daily, or weekly"
        exit 1
        ;;
esac

# Create cron job
CRON_JOB="${CRON_SCHEDULE} ${BACKUP_SCRIPT} ${BACKUP_DIR} >> ${BACKUP_DIR}/backup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "${BACKUP_SCRIPT}"; then
    echo "Cron job already exists. Updating..."
    # Remove existing cron job
    crontab -l 2>/dev/null | grep -v "${BACKUP_SCRIPT}" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "${CRON_JOB}") | crontab -

echo "✅ Automated backup configured successfully!"
echo "Backup interval: ${BACKUP_INTERVAL}"
echo "Backup directory: ${BACKUP_DIR}"
echo "Cron schedule: ${CRON_SCHEDULE}"
echo ""
echo "To view cron jobs: crontab -l"
echo "To remove cron job: crontab -e"

