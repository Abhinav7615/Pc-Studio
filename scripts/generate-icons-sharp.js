// Generate PWA icons using sharp
/* eslint-disable @typescript-eslint/no-require-imports */
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

    // Create base SVG for the new app logo
    const baseSvg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f43f5e" />
            <stop offset="100%" stop-color="#ef4444" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="128" fill="url(#bg)" />
        <rect x="96" y="120" width="320" height="216" rx="32" fill="#0ea5e9" />
        <rect x="136" y="160" width="240" height="136" rx="24" fill="#ffffff" />
        <rect x="176" y="308" width="160" height="28" rx="14" fill="#fde68a" />
        <rect x="226" y="350" width="60" height="32" rx="12" fill="#fde68a" />
        <path d="M184 184h20l22 40 26-52 22 44h20" fill="none" stroke="#ef4444" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="196" cy="248" r="12" fill="#ef4444" />
        <circle cx="276" cy="248" r="12" fill="#ef4444" />
        <path d="M158 164h196" fill="none" stroke="#ef4444" stroke-width="16" stroke-linecap="round" />
      </svg>
    `;

    const maskableSvg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f43f5e" />
            <stop offset="100%" stop-color="#ef4444" />
          </linearGradient>
        </defs>
        <circle cx="256" cy="256" r="240" fill="url(#bg)" />
        <rect x="120" y="120" width="272" height="216" rx="32" fill="#0ea5e9" />
        <rect x="160" y="160" width="192" height="136" rx="24" fill="#ffffff" />
        <rect x="200" y="308" width="112" height="28" rx="14" fill="#fde68a" />
        <rect x="240" y="350" width="40" height="32" rx="12" fill="#fde68a" />
        <path d="M208 184h20l22 40 26-52 22 44h20" fill="none" stroke="#ef4444" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="220" cy="248" r="12" fill="#ef4444" />
        <circle cx="300" cy="248" r="12" fill="#ef4444" />
        <path d="M182 164h196" fill="none" stroke="#ef4444" stroke-width="16" stroke-linecap="round" />
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
