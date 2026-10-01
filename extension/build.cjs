const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'dist');

// Ensure outDir and dist/icons exist
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outIconsDir = path.join(outDir, 'icons');
if (!fs.existsSync(outIconsDir)) {
  fs.mkdirSync(outIconsDir, { recursive: true });
}

async function build() {
  console.log('[Build] Starting TryOn Live extension build...');

  const isWatch = process.argv.includes('--watch');

  // 1. Bundle Background Service Worker (ESM format)
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'src', 'background', 'index.ts')],
    outfile: path.join(outDir, 'background.js'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['chrome110'],
    sourcemap: !isWatch ? false : 'inline',
    minify: !isWatch,
    logLevel: 'info',
  });

  // 2. Bundle Content Script (IIFE format with inlined @decartai/sdk)
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'src', 'content', 'index.ts')],
    outfile: path.join(outDir, 'content.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome110'],
    sourcemap: !isWatch ? false : 'inline',
    minify: !isWatch,
    logLevel: 'info',
  });

  // 3. Bundle Popup Script (IIFE format)
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'src', 'popup', 'popup.ts')],
    outfile: path.join(outDir, 'popup.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome110'],
    sourcemap: !isWatch ? false : 'inline',
    minify: !isWatch,
    logLevel: 'info',
  });

  // 4. Copy static assets
  fs.copyFileSync(
    path.join(__dirname, 'manifest.json'),
    path.join(outDir, 'manifest.json')
  );
  fs.copyFileSync(
    path.join(__dirname, 'src', 'popup', 'popup.html'),
    path.join(outDir, 'popup.html')
  );
  fs.copyFileSync(
    path.join(__dirname, 'src', 'popup', 'popup.css'),
    path.join(outDir, 'popup.css')
  );

  // Copy icons
  const icons = ['icon16.png', 'icon48.png', 'icon128.png'];
  for (const icon of icons) {
    const src = path.join(__dirname, 'icons', icon);
    const dst = path.join(outIconsDir, icon);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
    }
  }

  console.log('[Build] Successfully built TryOn Live into extension/dist!');
  console.log('[Build] Ready to load in chrome://extensions -> Load unpacked');
}

build().catch((err) => {
  console.error('[Build Error]', err);
  process.exit(1);
});
