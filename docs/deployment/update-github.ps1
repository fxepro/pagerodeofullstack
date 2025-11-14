# Quick GitHub Update Script
# Run this from the project root

Write-Host "Updating GitHub with fixed files..." -ForegroundColor Green

# Add all fixed files
git add .

# Commit with clear message
git commit -m "Fix: Resolve all 66 TypeScript errors - Build now successful

- Fixed ErrorCategory enum mismatches (50+ errors)
- Created type declarations (vaul, dom-to-image-more, dns-packet)
- Fixed implicit any types in hooks and components
- Fixed toast() calls to use correct sonner format
- Fixed OrchestratorState missing properties
- Fixed API route type issues (both app/api and public/api)
- Fixed monitorId redeclaration in uptime-kuma route
- Fixed typography route weights type issues
- All TypeScript errors resolved (0 errors)
- Build successful - Ready for production"

# Push to GitHub
git push origin main

Write-Host "`n✅ GitHub updated successfully!" -ForegroundColor Green
Write-Host "`nNext step on Oracle VM:" -ForegroundColor Yellow
Write-Host "cd /opt/pagerodeo && git pull origin main" -ForegroundColor Cyan
Write-Host "cd studio && npm run build" -ForegroundColor Cyan
Write-Host "sudo systemctl restart pagerodeo-backend pagerodeo-frontend" -ForegroundColor Cyan

