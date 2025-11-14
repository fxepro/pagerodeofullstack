# Auto-fix build errors script for Windows PowerShell
# Runs linting with auto-fix, type checking, and builds continuously

Write-Host "🔍 Starting auto-fix build process..." -ForegroundColor Cyan
Write-Host ""

# Run linting with auto-fix
Write-Host "📝 Running ESLint with auto-fix..." -ForegroundColor Yellow
npm run lint:fix

# Run type checking
Write-Host ""
Write-Host "🔍 Running TypeScript type check..." -ForegroundColor Yellow
try {
    npm run type-check
} catch {
    Write-Host ""
    Write-Host "⚠️  TypeScript errors found. Fix these manually:" -ForegroundColor Red
    Write-Host "   - Run 'npm run type-check' to see details" -ForegroundColor Red
    Write-Host ""
}

# Run build
Write-Host ""
Write-Host "🏗️  Building Next.js app..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "✅ Build complete!" -ForegroundColor Green

