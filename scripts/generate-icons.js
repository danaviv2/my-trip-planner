const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');

// SVG icon — airplane on purple-blue gradient, rounded square, maskable safe zone
function buildSVG(size) {
  const pad = Math.round(size * 0.12); // 12% safe zone for maskable
  const inner = size - pad * 2;
  const cx = size / 2;
  const cy = size / 2;

  // Scale airplane to ~55% of inner area
  const planeScale = (inner * 0.55) / 100;
  const tx = cx - 50 * planeScale;
  const ty = cy - 50 * planeScale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="100%" stop-color="#764ba2"/>
    </linearGradient>
    <clipPath id="round">
      <rect width="${size}" height="${size}" rx="${size * 0.22}" ry="${size * 0.22}"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" ry="${size * 0.22}" fill="url(#bg)"/>

  <!-- Subtle inner glow -->
  <circle cx="${cx}" cy="${cy}" r="${size * 0.42}" fill="white" fill-opacity="0.06"/>

  <!-- Airplane (Material Design flight icon path, centered) -->
  <g transform="translate(${tx}, ${ty}) scale(${planeScale})" fill="white" opacity="0.97">
    <!-- Main body -->
    <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>
  </g>
</svg>`;
}

async function generateIcon(size, filename) {
  const svgBuffer = Buffer.from(buildSVG(size));
  const outPath = path.join(publicDir, filename);
  await sharp(svgBuffer).png().toFile(outPath);
  console.log(`✓ ${filename} (${size}x${size})`);
}

(async () => {
  fs.mkdirSync(publicDir, { recursive: true });
  await generateIcon(192, 'logo192.png');
  await generateIcon(512, 'logo512.png');
  // favicon — small, no padding needed
  await sharp(Buffer.from(buildSVG(64))).png().toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ favicon.png (64x64)');
  console.log('\nDone! Icons saved to public/');
})();
