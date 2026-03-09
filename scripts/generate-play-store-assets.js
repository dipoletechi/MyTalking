/**
 * Generates placeholder images for Play Store (Robot Talking).
 * Each image has visible text so you can see something; replace with real app screenshots later.
 * Requires: npm install sharp
 * Run: node scripts/generate-play-store-assets.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'play-store-assets');
const BG = '#1a2142';
const ACCENT = '#00d9ff';
const TEXT = '#ffffff';

const dirs = {
  'app-icon': path.join(ROOT, 'app-icon'),
  'feature-graphic': path.join(ROOT, 'feature-graphic'),
  'phone-screenshots': path.join(ROOT, 'phone-screenshots'),
  'tablet-7-screenshots': path.join(ROOT, 'tablet-7-screenshots'),
  'tablet-10-screenshots': path.join(ROOT, 'tablet-10-screenshots'),
};

Object.values(dirs).forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

function svgWithText(w, h, bgColor, lines) {
  const yStart = h / 2 - (lines.length - 1) * 28;
  const textEls = lines
    .map((line, i) => {
      const size = i === 0 ? Math.min(48, w / 12) : Math.min(22, w / 30);
      return `<text x="${w / 2}" y="${yStart + i * 56}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${i === 0 ? 'bold' : 'normal'}" fill="${TEXT}" text-anchor="middle" dominant-baseline="middle">${escapeXml(line)}</text>`;
    })
    .join('\n');
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${bgColor}"/>
  <g fill-opacity="0.9">${textEls}</g>
</svg>`;
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function generateWithSharp() {
  const sharp = require('sharp');
  const write = (filePath, buffer) => fs.promises.writeFile(filePath, buffer);

  const svgToPng = (svg, w, h) =>
    sharp(Buffer.from(svg))
      .resize(w, h)
      .png()
      .toBuffer();

  // 1. App icon: 512 x 512
  const iconSvg = svgWithText(512, 512, ACCENT, [
    'Robot Talking',
    'App icon 512×512',
    'Replace with your icon',
  ]);
  const iconBuf = await svgToPng(iconSvg, 512, 512);
  await write(path.join(dirs['app-icon'], 'app-icon-512x512.png'), iconBuf);
  console.log('Created app-icon-512x512.png (512×512)');

  // 2. Feature graphic: 1024 x 500
  const fgSvg = svgWithText(1024, 500, BG, [
    'Robot Talking',
    'Feature graphic 1024×500 • Replace with your banner',
  ]);
  const fgBuf = await svgToPng(fgSvg, 1024, 500);
  await write(path.join(dirs['feature-graphic'], 'feature-graphic-1024x500.png'), fgBuf);
  console.log('Created feature-graphic-1024x500.png (1024×500)');

  // 3. Phone screenshots – with visible labels
  const phoneSizes = [
    [1080, 1920],
    [1080, 1920],
    [1920, 1080],
    [1920, 1080],
  ];
  const phoneLabels = [
    'Robot Talking – Screenshot 1',
    'Robot Talking – Screenshot 2',
    'Robot Talking – Screenshot 3 (16:9)',
    'Robot Talking – Screenshot 4 (16:9)',
  ];
  for (let i = 0; i < phoneSizes.length; i++) {
    const [w, h] = phoneSizes[i];
    const svg = svgWithText(w, h, BG, [
      phoneLabels[i],
      `${w}×${h} • Replace with real app screenshot`,
      'Run app → take screenshot → put here',
    ]);
    const buf = await svgToPng(svg, w, h);
    await write(
      path.join(dirs['phone-screenshots'], `phone-screenshot-${i + 1}-${w}x${h}.png`),
      buf
    );
    console.log(`Created phone-screenshot-${i + 1}-${w}x${h}.png`);
  }

  // 4. 7-inch tablet
  const tabSizes = [[1920, 1080], [1080, 1920], [1920, 1080], [1080, 1920]];
  for (let i = 0; i < tabSizes.length; i++) {
    const [w, h] = tabSizes[i];
    const svg = svgWithText(w, h, BG, [
      `Robot Talking – 7" tablet ${i + 1}`,
      `${w}×${h} • Replace with real screenshot`,
    ]);
    const buf = await svgToPng(svg, w, h);
    await write(
      path.join(dirs['tablet-7-screenshots'], `tablet-7-screenshot-${i + 1}-${w}x${h}.png`),
      buf
    );
    console.log(`Created tablet-7-screenshot-${i + 1}-${w}x${h}.png`);
  }

  // 5. 10-inch tablet
  for (let i = 0; i < tabSizes.length; i++) {
    const [w, h] = tabSizes[i];
    const svg = svgWithText(w, h, BG, [
      `Robot Talking – 10" tablet ${i + 1}`,
      `${w}×${h} • Replace with real screenshot`,
    ]);
    const buf = await svgToPng(svg, w, h);
    await write(
      path.join(dirs['tablet-10-screenshots'], `tablet-10-screenshot-${i + 1}-${w}x${h}.png`),
      buf
    );
    console.log(`Created tablet-10-screenshot-${i + 1}-${w}x${h}.png`);
  }

  console.log('\nDone. Ab har image pe text dikhega. Asli screenshots ke liye: app chalao, phone/emulator se screenshot lo, in files ko replace karo.');
}

(async () => {
  try {
    await generateWithSharp();
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.error('Run first: npm install --save-dev sharp');
      process.exit(1);
    }
    throw e;
  }
})();
