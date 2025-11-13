/**
 * Enhanced cleanup for remaining purple references
 * Catches all purple shades including light/dark variants
 */

const fs = require('fs');
const path = require('path');

const replacements = [
  // Light purples (backgrounds)
  { from: /\bpurple-50\b/g, to: 'palette-accent-3' },
  { from: /\bpurple-100\b/g, to: 'palette-accent-3' },
  { from: /\bpurple-200\b/g, to: 'palette-accent-2' },
  { from: /\bpurple-300\b/g, to: 'palette-accent-2' },
  { from: /\bpurple-400\b/g, to: 'palette-accent-1' },
  
  // Medium purples
  { from: /\bpurple-500\b/g, to: 'palette-accent-1' },
  { from: /\bpurple-600\b/g, to: 'palette-primary' },
  { from: /\bpurple-700\b/g, to: 'palette-primary-hover' },
  
  // Dark purples
  { from: /\bpurple-800\b/g, to: 'palette-secondary' },
  { from: /\bpurple-900\b/g, to: 'palette-secondary' },
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let changeCount = 0;
    
    replacements.forEach(({ from, to }) => {
      const matches = content.match(from);
      if (matches) {
        content = content.replace(from, to);
        modified = true;
        changeCount += matches.length;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated ${filePath} (${changeCount} changes)`);
      return changeCount;
    }
    return 0;
  } catch (error) {
    console.error(`✗ Error: ${filePath}`);
    return 0;
  }
}

function processDirectory(dir) {
  let totalChanges = 0;
  let filesUpdated = 0;
  
  function walk(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!file.startsWith('.') && file !== 'node_modules') {
          walk(fullPath);
        }
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const changes = updateFile(fullPath);
        if (changes > 0) {
          totalChanges += changes;
          filesUpdated++;
        }
      }
    });
  }
  
  walk(dir);
  return { totalChanges, filesUpdated };
}

console.log('🧹 Cleaning up remaining purple references...\n');

const componentsPath = path.join(__dirname, '..', 'components');
const appPath = path.join(__dirname, '..', 'app');

console.log('📁 Processing components/...');
const compResults = processDirectory(componentsPath);

console.log('\n📁 Processing app/...');
const appResults = processDirectory(appPath);

const total = compResults.totalChanges + appResults.totalChanges;
const files = compResults.filesUpdated + appResults.filesUpdated;

console.log(`\n✅ Complete! Made ${total} changes across ${files} files`);
console.log('\n🔄 Restart dev server: npm run dev');

