# Git Deployment Commands

## Pre-Deployment Checklist

Before deploying, ensure:
- ✅ Build completed successfully (`npm run build` in `studio/`)
- ✅ No sensitive files in `.env` or `.env.local` are committed
- ✅ Database migrations are up to date
- ✅ All tests pass (if applicable)

---

## Step-by-Step Git Deployment

### 1. Check Current Status
```bash
git status
```

### 2. Review Changes (Optional)
```bash
# See what files changed
git diff

# See summary of changes
git status --short
```

### 3. Add All Changes
```bash
# Add all modified and new files
git add .

# Or add specific files/directories
git add backend/
git add studio/
git add docs/
```

### 4. Commit Changes
```bash
# Commit with descriptive message
git commit -m "Add Stripe/Coinbase support to PromotionalDeal, fix build errors, and complete PayPal integration

- Added Stripe and Coinbase plan ID fields to PromotionalDeal model
- Fixed TypeScript null checks in checkout page
- Fixed Suspense boundary in checkout success page
- Fixed i18n config type errors
- Updated sidebar permissions matrix type handling
- Completed PayPal subscription integration
- Added demo account system
- Added promotional deals system
- Updated workspace navigation and RBAC
- Build verified and passing"
```

### 5. Push to GitHub
```bash
# Push to main branch
git push origin main

# Or if you need to force push (use with caution)
# git push origin main --force
```

### 6. Verify Deployment
```bash
# Check remote status
git remote -v

# Verify last commit
git log -1
```

---

## Quick One-Liner (If you're confident)
```bash
git add . && git commit -m "Add Stripe/Coinbase support, fix build errors, complete PayPal integration" && git push origin main
```

---

## If You Need to Undo

### Undo Last Commit (Keep Changes)
```bash
git reset --soft HEAD~1
```

### Undo Last Commit (Discard Changes)
```bash
git reset --hard HEAD~1
```

### Undo Last Push (Dangerous - Use Carefully)
```bash
git revert HEAD
git push origin main
```

---

## Branch Strategy (Optional)

If you want to use a feature branch:

```bash
# Create and switch to new branch
git checkout -b feature/stripe-coinbase-support

# Make changes, then:
git add .
git commit -m "Your commit message"
git push origin feature/stripe-coinbase-support

# Then create PR on GitHub and merge to main
```

---

## Important Notes

1. **Never commit sensitive files:**
   - `.env` files
   - `.env.local` files
   - API keys
   - Database credentials
   - Private keys

2. **Check `.gitignore`** before committing to ensure sensitive files are excluded

3. **Test locally** before pushing to production

4. **Use meaningful commit messages** for better project history

