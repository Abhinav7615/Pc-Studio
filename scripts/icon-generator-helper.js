#!/usr/bin/env node

/**
 * Icon Generation Helper
 * This script helps generate PWA icons from a source image
 * 
 * Usage:
 *   node scripts/generate-icons.js --source logo.png --output public/
 * 
 * Prerequisites:
 *   npm install sharp
 */

const fs = require('fs');
const path = require('path');

console.log(`
╔════════════════════════════════════════════╗
║   PC Studio PWA Icon Generator Helper       ║
║                                            ║
║   This script helps create PWA icons       ║
╚════════════════════════════════════════════╝
`);

console.log(`
📋 ICON REQUIREMENTS:

1. Icon Files Needed:
   ✅ /public/icon-192.png (192x192px)
   ✅ /public/icon-192-maskable.png (192x192px - maskable)
   ✅ /public/icon-512.png (512x512px)
   ✅ /public/icon-512-maskable.png (512x512px - maskable)

2. Background Color: #1e3a8a (Dark Blue)

3. Maskable Icon Requirements:
   - Safe content area (inner circle):
     • 108px radius for 192px icon
     • 294px radius for 512px icon
   - Must have full background fill

🎨 QUICK GENERATION METHODS:

Method 1: Online PWA Builder (RECOMMENDED)
   1. Go to https://www.pwabuilder.com/
   2. Upload your logo
   3. Select "PC Studio" or app name
   4. Download all generated icons
   5. Extract to /public/ folder

Method 2: Online Icon Editor
   1. Go to https://www.favicon-generator.org/
   2. Upload logo with background color #1e3a8a
   3. Generate 192x192 and 512x512 icons
   4. Save to /public/

Method 3: Maskable Icon Editor
   1. Go to https://maskable.app/editor
   2. Upload 512x512 base icon
   3. Check the preview
   4. Download maskable version
   5. Repeat for 192x192 version

Method 4: Command Line (requires 'sharp' npm package)
   npm install --save-dev sharp
   node scripts/generate-icons.js --source logo.png

📁 FILE LOCATIONS:
   Source: Your logo image (preferably 1024x1024 or larger)
   Output: All icons go to /public/ directory

⚠️  DESIGN TIPS:
   • Use solid background color #1e3a8a
   • Include your logo in center
   • Ensure good contrast
   • Test on multiple devices
   • Avoid transparent areas (use solid fill)
   • Keep logo centered and not touching edges

🔄 UPDATING ICONS LATER:

   1. Generate new icons following above methods
   2. Replace files in /public/
   3. Update manifest.json version:
      "version": "1.0.0" → "1.0.1"
   4. Commit and push to GitHub
   5. Vercel auto-deploys
   6. Users see update notification
   7. New icons visible after app refresh

📱 TESTING ICONS:

   After placing icons in /public/:
   
   1. Local testing:
      npm run dev
      Open http://localhost:3000
      Check DevTools > Application > Manifest
      
   2. Mobile testing:
      Deploy to Vercel
      Open on Android Chrome or iPhone Safari
      Try to install app
      Check icon appearance

🚀 DEPLOYMENT:
   1. git add public/icon-*.png
   2. git commit -m "Update PWA icons"
   3. git push origin main
   4. Vercel deploys automatically

✅ VERIFICATION CHECKLIST:
   ☐ icon-192.png exists (192x192)
   ☐ icon-192-maskable.png exists (192x192)
   ☐ icon-512.png exists (512x512)
   ☐ icon-512-maskable.png exists (512x512)
   ☐ All in /public/ folder
   ☐ Background color is #1e3a8a
   ☐ No transparent backgrounds
   ☐ Manifest.json in /public/
   ☐ sw.js in /public/
   ☐ offline.html in /public/

📚 RESOURCES:
   • PWA Builder: https://www.pwabuilder.com/
   • Maskable Icons: https://maskable.app/
   • Favicon Generator: https://www.favicon-generator.org/
   • Sharp NPM: https://sharp.pixelplumbing.com/

❓ NEED HELP?
   1. Check PWA_SETUP_GUIDE.md for detailed info
   2. Open DevTools and check console for errors
   3. Visit https://web.dev/pwa-checklist/

`);

// Simple template for icon generation with Sharp
const generateIconsTemplate = `
// File: scripts/generate-icons.js with Sharp
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourceImage = process.argv[2] || './logo.png';
const outputDir = './public';

async function generateIcons() {
  try {
    // Create 192x192 standard icon
    await sharp(sourceImage)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 30, g: 58, b: 138, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'icon-192.png'));
    console.log('✅ Created icon-192.png');

    // Create 512x512 standard icon
    await sharp(sourceImage)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 30, g: 58, b: 138, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'icon-512.png'));
    console.log('✅ Created icon-512.png');

    console.log('📱 Icon generation complete!');
    console.log('⚠️  Manually create maskable versions using https://maskable.app/');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

generateIcons();
`;

console.log(`
${generateIconsTemplate}
`);

console.log(`
📝 NEXT STEPS:

1. Choose a method from above to generate icons
2. Place all 4 icon files in /public/ folder
3. Test locally: npm run dev
4. Test on mobile (iPhone/Android)
5. Deploy: git push
6. Users can now install your app!

Happy PWA building! 🚀
`);
