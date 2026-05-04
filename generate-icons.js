// Simple icon generator for PC Studio
// Run: node generate-icons.js

const fs = require('fs');
const path = require('path');
const canvas = require('canvas');

const publicDir = path.join(__dirname, 'public');

// Create canvas and generate icons
const sizes = [192, 512];
const maskable = true;

async function generateIcon(size, isMaskable = false) {
  const canvasObj = canvas.createCanvas(size, size);
  const ctx = canvasObj.getContext('2d');
  
  // Background
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, size, size);
  
  // Add border for maskable icons
  if (isMaskable) {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(1, size / 64);
    ctx.strokeRect(0, 0, size, size);
  }
  
  // Draw "PC" text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.floor(size * 0.4)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PC', size / 2, size / 2);
  
  // Save file
  const suffix = isMaskable ? '-maskable' : '';
  const filename = `icon-${size}${suffix}.png`;
  const filepath = path.join(publicDir, filename);
  
  const buffer = canvasObj.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);
  console.log(`✓ Generated: ${filename}`);
}

async function main() {
  try {
    console.log('Generating PWA icons...');
    for (const size of sizes) {
      await generateIcon(size, false);
      await generateIcon(size, true);
    }
    
    // Generate screenshot
    const screenshotCanvas = canvas.createCanvas(540, 720);
    const ctx = screenshotCanvas.getContext('2d');
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, 540, 720);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PC Studio', 270, 360);
    
    const screenshotBuffer = screenshotCanvas.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'screenshot-540x720.png'), screenshotBuffer);
    console.log('✓ Generated: screenshot-540x720.png');
    
    console.log('\n✓ All icons generated successfully!');
  } catch (err) {
    console.error('Error generating icons:', err);
    process.exit(1);
  }
}

main();
