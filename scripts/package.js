const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const archiver = require('archiver');

const ROOT = path.resolve(__dirname, '..');

// Read version from manifest
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const version = manifest.version;
const zipName = `flipchecker-v${version}.zip`;
const zipPath = path.join(ROOT, zipName);

// Files to include in the package
const FILES = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'styles.css',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'dist/background.js',
  'dist/content.js',
  'dist/popup.js',
  'dist/ebay-reader.js',
  'dist/network-interceptor-page.js',
];

async function main() {
  // 1. Run production build
  console.log('Running production build...');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });

  // 2. Verify all files exist
  console.log('\nVerifying files...');
  const missing = FILES.filter(f => !fs.existsSync(path.join(ROOT, f)));
  if (missing.length > 0) {
    console.error('Missing files:', missing.join(', '));
    process.exit(1);
  }
  console.log(`All ${FILES.length} files present.`);

  // 3. Remove old zip if it exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // 4. Create ZIP
  console.log(`\nCreating ${zipName}...`);
  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);

    for (const file of FILES) {
      archive.file(path.join(ROOT, file), { name: file });
    }

    archive.finalize();
  });

  const stats = fs.statSync(zipPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`\nPackaged ${zipName} (${sizeKB} KB) with ${FILES.length} files.`);
  console.log('Ready for Chrome Web Store upload.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
