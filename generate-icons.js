/**
 * Script to generate favicon and PWA icons from fcb-logo.png
 * 
 * Requirements:
 * - Install sharp: npm install sharp
 * - Run: node generate-icons.js
 * 
 * This will create:
 * - favicon.ico (16x16, 32x32)
 * - icon-192.png (192x192 for PWA)
 * - icon-512.png (512x512 for PWA)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = 'fcb-logo.png';
const sizes = [
  { size: 16, output: 'favicon-16x16.png' },
  { size: 32, output: 'favicon-32x32.png' },
  { size: 192, output: 'icon-192.png' },
  { size: 512, output: 'icon-512.png' }
];

async function generateIcons() {
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: ${inputFile} not found!`);
    process.exit(1);
  }

  console.log('Generating icons from', inputFile);
  
  for (const { size, output } of sizes) {
    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(output);
      
      console.log(`✓ Created ${output} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Error creating ${output}:`, error.message);
    }
  }
  
  console.log('\nDone! Icons generated successfully.');
  console.log('\nNext steps:');
  console.log('1. Update manifest.json with the new icon paths');
  console.log('2. Update index.html favicon links if needed');
}

generateIcons().catch(console.error);

