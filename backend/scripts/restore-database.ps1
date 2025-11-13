# Database restore script for PostgreSQL (PowerShell)
# Usage: .\restore-database.ps1 <backup_file>

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "Error: Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

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

# Confirm restore
Write-Host "⚠️  WARNING: This will restore the database from backup!" -ForegroundColor Yellow
Write-Host "Database: $DBName"
Write-Host "Host: ${DBHost}:${DBPort}"
Write-Host "Backup file: $BackupFile"
Write-Host ""
$confirm = Read-Host "Are you sure you want to continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Restore cancelled." -ForegroundColor Yellow
    exit 0
}

try {
    # Drop existing database connections
    Write-Host "Dropping existing database connections..."
    $dropConnectionsQuery = "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$DBName' AND pid <> pg_backend_pid();"
    $dropConnectionsArgs = @(
        "-h", $DBHost
        "-p", $DBPort
        "-U", $DBUser
        "-d", "postgres"
        "-c", $dropConnectionsQuery
    )
    & psql $dropConnectionsArgs 2>&1 | Out-Null
    
    # Restore backup
    Write-Host "Restoring database from backup..."
    $pgRestorePath = "pg_restore"
    $pgRestoreArgs = @(
        "-h", $DBHost
        "-p", $DBPort
        "-U", $DBUser
        "-d", $DBName
        "--clean"
        "--if-exists"
        $BackupFile
    )
    
    & $pgRestorePath $pgRestoreArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database restored successfully from: $BackupFile" -ForegroundColor Green
    } else {
        Write-Host "❌ Restore failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error during restore: $_" -ForegroundColor Red
    exit 1
} finally {
    # Unset PGPASSWORD
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

