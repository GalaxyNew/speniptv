const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve(__dirname, '..', 'scripts', 'smarters-post.json');
const raw = fs.readFileSync(jsonPath, 'utf8');
const post = JSON.parse(raw);

console.log('--- EXCERPT ---');
console.log(post.excerpt);

console.log('--- IPTV ESPAÑA SEGMENT ---');
// Find where IPTV is and show context
const index = post.content.indexOf('IPTV');
if (index !== -1) {
  console.log(post.content.substring(index - 100, index + 200));
} else {
  console.log('Keyword "IPTV" not found in content!');
}

console.log('--- ALL LINKS ---');
const links = [];
const regex = /<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
let match;
while ((match = regex.exec(post.content)) !== null) {
  links.push({ href: match[1], text: match[2].trim().replace(/\s+/g, ' ') });
}
console.log(links);
