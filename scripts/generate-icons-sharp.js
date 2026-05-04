// Generate PWA icons using sharp
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');

// Ensure directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generateIcons() {
  try {
    console.log('🎨 Generating PWA icons...\n');

    // Create base SVG
    const baseSvg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" fill="url(#grad1)"/>
        <text x="256" y="256" font-size="200" font-weight="bold" font-family="Arial" text-anchor="middle" dominant-baseline="middle" fill="white">PC</text>
      </svg>
    `;

    const maskableSvg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="256" cy="256" r="220" fill="url(#grad1)"/>
        <text x="256" y="256" font-size="200" font-weight="bold" font-family="Arial" text-anchor="middle" dominant-baseline="middle" fill="white">PC</text>
      </svg>
    `;

    // Generate icon-192.png
    await sharp(Buffer.from(baseSvg))
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✓ Generated: icon-192.png');

    // Generate icon-192-maskable.png
    await sharp(Buffer.from(maskableSvg))
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192-maskable.png'));
    console.log('✓ Generated: icon-192-maskable.png');

    // Generate icon-512.png
    await sharp(Buffer.from(baseSvg))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✓ Generated: icon-512.png');

    // Generate icon-512-maskable.png
    await sharp(Buffer.from(maskableSvg))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512-maskable.png'));
    console.log('✓ Generated: icon-512-maskable.png');

    // Generate screenshot-540x720.png
    const screenshotSvg = `
      <svg width="540" height="720" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="540" height="720" fill="url(#grad1)"/>
        <text x="270" y="250" font-size="72" font-weight="bold" font-family="Arial" text-anchor="middle" dominant-baseline="middle" fill="white">PC Studio</text>
        <text x="270" y="350" font-size="48" font-family="Arial" text-anchor="middle" dominant-baseline="middle" fill="#e0e7ff">Refurbished Computers</text>
        <text x="270" y="450" font-size="32" font-family="Arial" text-anchor="middle" dominant-baseline="middle" fill="#c7d2fe">Quality • Warranty • Reliable</text>
      </svg>
    `;

    await sharp(Buffer.from(screenshotSvg))
      .resize(540, 720)
      .png()
      .toFile(path.join(publicDir, 'screenshot-540x720.png'));
    console.log('✓ Generated: screenshot-540x720.png');

    // Generate screenshot-1280x720.png
    const wideSvg = `
      <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#grad1)"/>
        <text x="640" y="250" font-size="96" font-weight="bold" font-family="Arial" text-anchor="middle" dominant-baseline="middle" fill="white">PC Studio</text>
        <text x="640" y="380" font-size="64" font-family="Arial" text-anchor="middle" dominant-baseline="middle" fill="#e0e7ff">Shop Refurbished Computers</text>
        <text x="640" y="500" font-size="48" font-family="Arial" text-anchor="middle" dominant-baseline="middle" fill="#c7d2fe">Quality • Warranty • Affordable</text>
      </svg>
    `;

    await sharp(Buffer.from(wideSvg))
      .resize(1280, 720)
      .png()
      .toFile(path.join(publicDir, 'screenshot-1280x720.png'));
    console.log('✓ Generated: screenshot-1280x720.png');

    console.log('\n✅ All PWA icons generated successfully!\n');
  } catch (err) {
    console.error('❌ Error generating icons:', err.message);
    process.exit(1);
  }
}

generateIcons();
