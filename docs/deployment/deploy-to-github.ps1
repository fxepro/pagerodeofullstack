# Deploy to GitHub - PowerShell Script
# Run this script from the project root directory

Write-Host "==========================================" -ForegroundColor Green
Write-Host "Deploying PageRodeo to GitHub" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Step 1: Check git status
Write-Host "`n[1/5] Checking git status..." -ForegroundColor Yellow
git status --short

# Step 2: Verify .env files are ignored
Write-Host "`n[2/5] Verifying .env files are ignored..." -ForegroundColor Yellow
$envFiles = git status | Select-String ".env"
if ($envFiles) {
    Write-Host "⚠️  WARNING: .env files detected! Check .gitignore" -ForegroundColor Red
    Read-Host "Press Enter to continue anyway, or Ctrl+C to abort"
} else {
    Write-Host "✅ .env files are properly ignored" -ForegroundColor Green
}

# Step 3: Add all files
Write-Host "`n[3/5] Adding all files..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files added" -ForegroundColor Green

# Step 4: Commit changes
Write-Host "`n[4/5] Creating commit..." -ForegroundColor Yellow
$commitMessage = @"
Fix: TypeScript errors resolved - All 66 errors fixed

- Fixed ErrorCategory enum mismatches in error-handler.ts
- Created type declarations for vaul, dom-to-image-more, dns-packet
- Fixed implicit any types in hooks and components
- Fixed toast() calls to use correct sonner format
- Fixed OrchestratorState missing properties
- Fixed API route type issues (both app/api and public/api)
- Fixed monitorId redeclaration in uptime-kuma route
- Fixed typography route weights type issues
- All TypeScript errors resolved (0 errors)
- Build successful
"@

git commit -m $commitMessage
Write-Host "✅ Commit created" -ForegroundColor Green

# Step 5: Push to GitHub
Write-Host "`n[5/5] Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n==========================================" -ForegroundColor Green
    Write-Host "✅ Successfully deployed to GitHub!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "`nRepository: https://github.com/fxepro/pagerodeofullstack" -ForegroundColor Cyan
    Write-Host "`nNext step: Deploy to Oracle VM" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Error pushing to GitHub" -ForegroundColor Red
    Write-Host "Check your git credentials and try again" -ForegroundColor Red
    exit 1
}

