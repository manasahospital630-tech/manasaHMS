const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) {
    console.warn(`Source folder does not exist: ${from}`);
    return;
  }
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    const stat = fs.lstatSync(fromPath);
    if (stat.isFile()) {
      fs.copyFileSync(fromPath, toPath);
    } else if (stat.isDirectory()) {
      copyFolderSync(fromPath, toPath);
    }
  });
}

try {
  console.log('Copying backend/dist to root dist...');
  copyFolderSync(path.join(__dirname, 'backend', 'dist'), path.join(__dirname, 'dist'));
  console.log('Successfully copied backend build outputs to root dist/ directory.');
} catch (err) {
  console.error('Failed to copy backend build outputs:', err.message);
  process.exit(1);
}
