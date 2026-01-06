/**
 * PWA Icon Generator
 *
 * Genereert alle benodigde PWA icons vanuit een SVG template.
 * Run: node scripts/generate-icons.js
 *
 * Vereist: sharp (npm install sharp --save-dev)
 */

const fs = require('fs');
const path = require('path');

// SVG template voor het icon - Brain icoon met gradient
const svgTemplate = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <g transform="translate(96, 96) scale(0.625)" fill="white">
    <path d="M256 48c-79.5 0-144 64.5-144 144 0 58.8 35.3 109.3 86 131.7V352c0 17.7 14.3 32 32 32h52c17.7 0 32-14.3 32-32v-28.3c50.7-22.4 86-72.9 86-131.7 0-79.5-64.5-144-144-144zm-16 304h-32v-24h32v24zm64 0h-32v-24h32v24zm30.6-102.8l-14.6 7.3V280c0 4.4-3.6 8-8 8h-16c-4.4 0-8-3.6-8-8v-32c0-2.9 1.6-5.5 4.1-6.9l26.5-13.3c7.3-3.6 12.4-10.4 14-18.3 1.6-7.9-.3-16.1-5.1-22.4-8.2-10.7-23.3-14.9-36.3-10-13 4.9-21.7 17.3-21.7 31.1 0 4.4-3.6 8-8 8h-16c-4.4 0-8-3.6-8-8 0-27.6 17.4-52.4 43.3-61.6 26-9.2 54.7 1.3 69.9 25.5 9.7 15.5 12.5 34.6 7.6 52.3-4.9 17.7-17.1 32.4-33.4 40.3l-.3.1zM240 124c0-8.8 7.2-16 16-16s16 7.2 16 16-7.2 16-16 16-16-7.2-16-16z"/>
  </g>
  <text x="256" y="440" text-anchor="middle" font-family="system-ui, sans-serif" font-size="48" font-weight="bold" fill="white">OS</text>
</svg>
`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Try to use sharp if available, otherwise create SVGs
async function generateIcons() {
  let sharp;
  try {
    sharp = require('sharp');
    console.log('Sharp gevonden - genereer PNG icons...');

    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      await sharp(Buffer.from(svgTemplate))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`  Created: icon-${size}x${size}.png`);
    }

    console.log('\nAlle icons gegenereerd!');
  } catch (e) {
    console.log('Sharp niet gevonden - genereer SVG icons als fallback...');
    console.log('Voor PNG icons: npm install sharp --save-dev && node scripts/generate-icons.js\n');

    // Create SVG versions as fallback
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
      const scaledSvg = svgTemplate.replace('viewBox="0 0 512 512"', `viewBox="0 0 512 512" width="${size}" height="${size}"`);
      fs.writeFileSync(outputPath, scaledSvg.trim());
      console.log(`  Created: icon-${size}x${size}.svg`);
    }

    // Also create main icon.svg
    fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgTemplate.trim());
    console.log('  Created: icon.svg');

    console.log('\nSVG icons gegenereerd als fallback.');
    console.log('Voor productie, run: npm install sharp --save-dev && node scripts/generate-icons.js');
  }
}

generateIcons();
