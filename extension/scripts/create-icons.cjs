const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\Ayushi\\.gemini\\antigravity-ide\\brain\\797c22b5-28af-4dcd-bc7b-09b84a808bc6\\tryon_icon_1790854884885.jpg';
const iconsDir = path.join(__dirname, '..', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function makeIcons() {
  const sizes = [16, 48, 128];
  for (const size of sizes) {
    const dest = path.join(iconsDir, `icon${size}.png`);
    await sharp(srcPath)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(dest);
    console.log(`Generated ${dest}`);
  }
}

makeIcons().catch(console.error);
