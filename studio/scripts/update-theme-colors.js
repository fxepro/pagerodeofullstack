/**
 * Bulk Theme Color Replacement Script
 * Replaces hardcoded purple colors with dynamic palette classes
 */

const fs = require('fs');
const path = require('path');

// Replacement mappings
const replacements = [
  // Backgrounds
  { from: /bg-purple-600/g, to: 'bg-palette-primary' },
  { from: /bg-purple-700/g, to: 'bg-palette-primary-hover' },
  { from: /bg-purple-500/g, to: 'bg-palette-accent-1' },
  { from: /bg-purple-400/g, to: 'bg-palette-accent-2' },
  { from: /bg-purple-300/g, to: 'bg-palette-accent-3' },
  { from: /bg-purple-200/g, to: 'bg-palette-accent-2' },
  { from: /bg-purple-100/g, to: 'bg-palette-accent-3' },
  { from: /bg-purple-50/g, to: 'bg-palette-accent-3' },
  
  // Text colors
  { from: /text-purple-600/g, to: 'text-palette-primary' },
  { from: /text-purple-700/g, to: 'text-palette-primary' },
  { from: /text-purple-500/g, to: 'text-palette-accent-1' },
  { from: /text-purple-400/g, to: 'text-palette-accent-2' },
  
  // Borders
  { from: /border-purple-600/g, to: 'border-palette-primary' },
  { from: /border-purple-500/g, to: 'border-palette-accent-1' },
  { from: /border-purple-400/g, to: 'border-palette-accent-2' },
  { from: /border-purple-300/g, to: 'border-palette-accent-2' },
  { from: /border-purple-200/g, to: 'border-palette-accent-2' },
  
  // Gradients
  { from: /from-purple-600/g, to: 'from-palette-primary' },
  { from: /from-purple-500/g, to: 'from-palette-accent-1' },
  { from: /from-purple-400/g, to: 'from-palette-accent-2' },
  { from: /from-purple-50/g, to: 'from-palette-accent-3' },
  { from: /to-purple-600/g, to: 'to-palette-primary' },
  { from: /to-purple-700/g, to: 'to-palette-primary-hover' },
  { from: /to-purple-800/g, to: 'to-palette-secondary' },
  { from: /to-purple-500/g, to: 'to-palette-accent-1' },
  { from: /to-purple-400/g, to: 'to-palette-accent-2' },
  { from: /to-purple-50/g, to: 'to-palette-accent-3' },
  { from: /to-purple-100/g, to: 'to-palette-accent-3' },
  
  // Via (for gradients)
  { from: /via-purple-600/g, to: 'via-palette-primary' },
  { from: /via-purple-500/g, to: 'via-palette-accent-1' },
  
  // Hover states
  { from: /hover:bg-purple-700/g, to: 'hover:bg-palette-primary-hover' },
  { from: /hover:bg-purple-600/g, to: 'hover:bg-palette-primary' },
  { from: /hover:bg-purple-50/g, to: 'hover:bg-palette-accent-3' },
  { from: /hover:text-purple-700/g, to: 'hover:text-palette-primary' },
  { from: /hover:text-purple-600/g, to: 'hover:text-palette-primary' },
  { from: /hover:from-purple-900/g, to: 'hover:from-palette-secondary' },
  { from: /hover:to-purple-900/g, to: 'hover:to-palette-secondary' },
  
  // Ring/Focus states
  { from: /ring-purple-600/g, to: 'ring-palette-primary' },
  { from: /focus:ring-purple-600/g, to: 'focus:ring-palette-primary' },
  { from: /focus:ring-purple-400/g, to: 'focus:ring-palette-accent-1' },
  { from: /focus:border-purple-400/g, to: 'focus:border-palette-accent-1' },
];

// Directories to process
const directories = [
  'app',
  'components',
];

// File extensions to process
const extensions = ['.tsx', '.ts', '.jsx', '.js'];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply all replacements
    replacements.forEach(({ from, to }) => {
      const newContent = content.replace(from, to);
      if (newContent !== content) {
        modified = true;
        content = newContent;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  let updated = 0;
  let total = 0;
  
  function walk(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!file.startsWith('.') && file !== 'node_modules') {
          walk(fullPath);
        }
      } else if (extensions.includes(path.extname(file))) {
        total++;
        if (updateFile(fullPath)) {
          updated++;
        }
      }
    });
  }
  
  walk(dir);
  return { updated, total };
}

// Main execution
console.log('🎨 Starting theme color replacement...\n');

let totalUpdated = 0;
let totalFiles = 0;

directories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    console.log(`\n📁 Processing ${dir}/...`);
    const { updated, total } = processDirectory(dirPath);
    totalUpdated += updated;
    totalFiles += total;
    console.log(`   ${updated}/${total} files updated`);
  }
});

console.log(`\n✅ Complete! Updated ${totalUpdated}/${totalFiles} files`);
console.log('\n🔄 Next steps:');
console.log('   1. Restart the Next.js dev server');
console.log('   2. Hard refresh your browser (Ctrl+Shift+R)');
console.log('   3. Test palette switching in /admin/themes\n');

