const { TwaManifest, TwaGenerator } = require('@bubblewrap/core');
const path = require('path');
const fs = require('fs');

async function main() {
  const twaDir = path.join(__dirname, 'twa-project');

  if (fs.existsSync(twaDir)) {
    fs.rmSync(twaDir, { recursive: true, force: true });
  }
  fs.mkdirSync(twaDir, { recursive: true });

  const twaManifest = new TwaManifest({
    packageId: 'com.chewyenhan.snaptextocr',
    host: 'chewyenhan.github.io',
    name: 'Snaptext OCR',
    shortName: 'Snaptext OCR',
    themeColor: '#0f172a',
    backgroundColor: '#0f172a',
    startUrl: '/my-ocr-app/',
    display: 'standalone',
    orientation: 'portrait',
    iconUrl: 'https://chewyenhan.github.io/my-ocr-app/assets/icon-512.png',
    maskableIconUrl: 'https://chewyenhan.github.io/my-ocr-app/assets/icon-512.png',
    splashScreenFadeOutDuration: 300,
    enableNotifications: false,
    features: {},
    signingKey: {
      path: '../release.keystore',
      alias: 'snaptext'
    }
  });

  console.log('TWA Manifest created and validated');

  const generator = new TwaGenerator();
  await generator.createTwaProject(twaDir, twaManifest);

  console.log('TWA project generated at:', twaDir);

  function listFiles(dir, indent) {
    indent = indent || '';
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      console.log(indent + (entry.isDirectory() ? '📁 ' : '📄 ') + entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        listFiles(path.join(dir, entry.name), indent + '  ');
      }
    }
  }
  listFiles(twaDir);
}

main().catch(e => {
  console.error('Error:', e.message);
  console.error(e.stack);
});
