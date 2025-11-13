#!/bin/bash
# Database restore script for PostgreSQL
# Usage: ./restore-database.sh <backup_file>

set -e

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Error: Backup file is required"
    echo "Usage: ./restore-database.sh <backup_file>"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

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

# Confirm restore
echo "⚠️  WARNING: This will restore the database from backup!"
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "Backup file: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Drop existing database connections
echo "Dropping existing database connections..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${DB_NAME}' AND pid <> pg_backend_pid();" || true

# Restore backup
echo "Restoring database from backup..."
pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully from: ${BACKUP_FILE}"
else
    echo "❌ Restore failed!"
    exit 1
fi

# Unset PGPASSWORD
unset PGPASSWORD

