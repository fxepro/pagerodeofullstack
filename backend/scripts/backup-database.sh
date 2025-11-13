#!/bin/bash
# Database backup script for PostgreSQL
# Usage: ./backup-database.sh [backup_directory]

set -e

# Get backup directory from argument or use default
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Database connection parameters
DB_NAME="${DB_NAME:-pagerodeo}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Check if DB_PASSWORD is set
if [ -z "$DB_PASSWORD" ]; then
    echo "Error: DB_PASSWORD is not set in .env file"
    exit 1
fi

# Set PGPASSWORD environment variable
export PGPASSWORD="${DB_PASSWORD}"

# Perform backup
echo "Starting database backup..."
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "Backup file: ${BACKUP_FILE}"

pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -F c -f "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully: ${BACKUP_FILE}"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "Backup size: ${BACKUP_SIZE}"
    
    # Compress backup (optional)
    # gzip "${BACKUP_FILE}"
    # echo "✅ Backup compressed: ${BACKUP_FILE}.gz"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Clean up old backups (keep last 30 days)
echo "Cleaning up old backups (keeping last 30 days)..."
find "${BACKUP_DIR}" -name "backup_*.sql" -type f -mtime +30 -delete
find "${BACKUP_DIR}" -name "backup_*.sql.gz" -type f -mtime +30 -delete
echo "✅ Cleanup completed"

# Unset PGPASSWORD
unset PGPASSWORD

