const fs = require('fs');
const path = require('path');

const srcDir = 'F:\\数据\\IPTV-西班牙\\IPTV_Basemg_sp\\static\\smart';
const destDir = path.resolve(__dirname, '..', 'public', 'static', 'smart');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const filesToCopy = [
  'IPTV-Smarters-CI.webp',
  'Click-the-Downloader-option.jpg',
  'Enable-Downloader.jpg',
  'Open-the-Downloader-app-1.jpg',
  'IPTV-Smarter-is-downloaded.jpg',
  'click-install-3.jpg',
  'Wait-for-the-installation-to-finish.jpg',
  'choosing-DONE.jpg',
  'Click-Delete-1.jpg',
  'Again-click-Delete.jpg',
  'click-Accept.jpg'
];

for (const file of filesToCopy) {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${file}`);
  } else {
    console.warn(`File not found: ${file}`);
  }
}

console.log('Asset copy completed.');
