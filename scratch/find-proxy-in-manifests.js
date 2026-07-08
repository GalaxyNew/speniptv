const fs = require('fs');
const path = require('path');

function searchManifests(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchManifests(fullPath);
    } else if (file.endsWith('.json')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('proxy') || content.includes('middleware')) {
        console.log(`Found match in manifest: ${fullPath}`);
      }
    }
  }
}

searchManifests('.next');
