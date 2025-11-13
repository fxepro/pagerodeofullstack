# Database backup script for PostgreSQL (PowerShell)
# Usage: .\backup-database.ps1 [backup_directory]

param(
    [string]$BackupDir = ".\backups"
)

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Get timestamp
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "backup_$Timestamp.sql"

# Load environment variables from .env file
$EnvFile = ".\.env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Database connection parameters
$DBName = if ($env:DB_NAME) { $env:DB_NAME } else { "pagerodeo" }
$DBUser = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DBHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DBPort = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DBPassword = $env:DB_PASSWORD

# Check if DB_PASSWORD is set
if (-not $DBPassword) {
    Write-Host "Error: DB_PASSWORD is not set in .env file" -ForegroundColor Red
    exit 1
}

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $DBPassword

# Perform backup
Write-Host "Starting database backup..."
Write-Host "Database: $DBName"
Write-Host "Host: ${DBHost}:${DBPort}"
Write-Host "Backup file: $BackupFile"

try {
    # Use pg_dump to create backup
    $pgDumpPath = "pg_dump"
    $pgDumpArgs = @(
        "-h", $DBHost
        "-p", $DBPort
        "-U", $DBUser
        "-d", $DBName
        "-F", "c"
        "-f", $BackupFile
    )
    
    & $pgDumpPath $pgDumpArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup completed successfully: $BackupFile" -ForegroundColor Green
        
        # Get backup file size
        $BackupSize = (Get-Item $BackupFile).Length / 1MB
        Write-Host "Backup size: $([math]::Round($BackupSize, 2)) MB"
        
        # Compress backup (optional)
        # Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.zip" -Force
        # Write-Host "✅ Backup compressed: $BackupFile.zip" -ForegroundColor Green
    } else {
        Write-Host "❌ Backup failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error during backup: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up old backups (keep last 30 days)
    Write-Host "Cleaning up old backups (keeping last 30 days)..."
    $CutoffDate = (Get-Date).AddDays(-30)
    Get-ChildItem -Path $BackupDir -Filter "backup_*.sql" | Where-Object { $_.LastWriteTime -lt $CutoffDate } | Remove-Item -Force
    Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.gz" | Where-Object { $_.LastWriteTime -lt $CutoffDate } | Remove-Item -Force
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
    
    # Unset PGPASSWORD
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

