/**
 * Capture real app screenshots from connected Android device/emulator via ADB.
 * Resizes to Play Store sizes and saves to play-store-assets.
 *
 * Usage:
 *   1. Run your app on device/emulator: npm run android
 *   2. Put the screen you want (e.g. robot + Listening)
 *   3. Run: node scripts/capture-screenshots.js 1
 *   4. Change app screen (e.g. Speaking), run: node scripts/capture-screenshots.js 2
 *   5. Repeat for 3, 4 to get 4 phone screenshots.
 *
 * Requires: adb in PATH, npm install sharp (dev)
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'play-store-assets');
const PHONE_DIR = path.join(ROOT, 'phone-screenshots');
const TAB7_DIR = path.join(ROOT, 'tablet-7-screenshots');
const TAB10_DIR = path.join(ROOT, 'tablet-10-screenshots');

const screenshotNumber = parseInt(process.argv[2], 10) || 1;
if (screenshotNumber < 1 || screenshotNumber > 8) {
  console.log('Usage: node scripts/capture-screenshots.js <1-8>');
  console.log('Example: node scripts/capture-screenshots.js 1');
  process.exit(1);
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'buffer', ...opts });
  } catch (e) {
    return null;
  }
}

function adbScreencap() {
  const assetsDir = path.join(__dirname, '..', 'play-store-assets');
  const tmp = path.join(assetsDir, '_tmp_screen.png');
  const devicePath = '/sdcard/playstore_capture.png';
  try {
    const cap = spawnSync('adb', ['shell', 'screencap', '-p', devicePath], {
      encoding: 'utf8',
      timeout: 10000,
    });
    if (cap.status !== 0) {
      console.error('ADB screencap failed. Is device/emulator connected? Run: adb devices');
      process.exit(1);
    }
    const pull = spawnSync('adb', ['pull', devicePath, tmp], {
      encoding: 'utf8',
      cwd: assetsDir,
      timeout: 10000,
    });
    if (pull.status !== 0 || !fs.existsSync(tmp)) {
      console.error('ADB pull failed. Could not save screenshot.');
      process.exit(1);
    }
    spawnSync('adb', ['shell', 'rm', devicePath], { encoding: 'utf8' });
    return tmp;
  } catch (e) {
    console.error('Error: adb not found or screencap failed. Install Android SDK and add adb to PATH.');
    process.exit(1);
  }
}

async function resizeAndSave(tmpPath) {
  const sharp = require('sharp');
  const img = sharp(tmpPath);
  const meta = await img.metadata();
  const w = meta.width || 1080;
  const h = meta.height || 1920;
  const isPortrait = h >= w;

  const phoneW = isPortrait ? 1080 : 1920;
  const phoneH = isPortrait ? 1920 : 1080;

  const resizeOpt = { width: phoneW, height: phoneH, fit: 'cover' };
  const buf = await sharp(tmpPath).resize(resizeOpt).png().toBuffer();

  if (!fs.existsSync(PHONE_DIR)) fs.mkdirSync(PHONE_DIR, { recursive: true });
  if (!fs.existsSync(TAB7_DIR)) fs.mkdirSync(TAB7_DIR, { recursive: true });
  if (!fs.existsSync(TAB10_DIR)) fs.mkdirSync(TAB10_DIR, { recursive: true });

  const phoneName = `phone-screenshot-${screenshotNumber}-${phoneW}x${phoneH}.png`;
  const tab7Name = `tablet-7-screenshot-${screenshotNumber}-${phoneW}x${phoneH}.png`;
  const tab10Name = `tablet-10-screenshot-${screenshotNumber}-${phoneW}x${phoneH}.png`;

  fs.writeFileSync(path.join(PHONE_DIR, phoneName), buf);
  fs.writeFileSync(path.join(TAB7_DIR, tab7Name), buf);
  fs.writeFileSync(path.join(TAB10_DIR, tab10Name), buf);

  try { fs.unlinkSync(tmpPath); } catch (_) {}

  console.log('Saved:', phoneName);
  console.log('Also copied to 7" and 10" tablet folders.');
  console.log(`Next: change app screen and run: node scripts/capture-screenshots.js ${screenshotNumber + 1}`);
}

(async () => {
  const devices = run('adb devices');
  if (!devices || !devices.toString().includes('device')) {
    console.error('No Android device/emulator found. Run "adb devices" and start your app with npm run android.');
    process.exit(1);
  }

  console.log('Capturing current screen from device...');
  const tmpPath = adbScreencap();
  await resizeAndSave(tmpPath);
})();
