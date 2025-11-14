#!/bin/bash
# Auto-fix build errors script
# Runs linting with auto-fix, type checking, and builds continuously

set -e

echo "🔍 Starting auto-fix build process..."
echo ""

# Run linting with auto-fix
echo "📝 Running ESLint with auto-fix..."
npm run lint:fix || true

# Run type checking (will show errors but not fix them)
echo ""
echo "🔍 Running TypeScript type check..."
npm run type-check || {
  echo ""
  echo "⚠️  TypeScript errors found. Fix these manually:"
  echo "   - Run 'npm run type-check' to see details"
  echo ""
}

# Run build
echo ""
echo "🏗️  Building Next.js app..."
npm run build

echo ""
echo "✅ Build complete!"

