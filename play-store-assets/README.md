# Play Store Graphics – Robot Talking

Use these folders for Google Play Console uploads. Generated images have **visible labels** (e.g. "Robot Talking", "Screenshot 1"); replace them with your final assets.

**Asli app screenshots yahin se lene ke liye (ADB):**
1. App chalao: `npm run android` (device/emulator connected)
2. Jis screen ka screenshot chahiye (Listening / Speaking / Robot) us pe aa jao
3. Run: `npm run capture-screenshot -- 1` (number 1–8)
4. Screen change karo, phir: `npm run capture-screenshot -- 2` … aise 4 baar for 4 screenshots

Script device ka screen capture karke Play Store sizes (1080×1920 ya 1920×1080) mein resize karke `phone-screenshots`, `tablet-7-screenshots`, `tablet-10-screenshots` mein save kar deta hai. **adb** PATH mein hona chahiye (Android SDK).

| Asset | Folder | Size | Format |
|-------|--------|------|--------|
| App icon | `app-icon/` | 512 × 512 px | PNG/JPEG, max 1 MB |
| Feature graphic | `feature-graphic/` | 1024 × 500 px | PNG/JPEG, max 15 MB |
| Phone screenshots | `phone-screenshots/` | 16:9 or 9:16, 320–3840 px | 2–8 images, max 8 MB each |
| 7" tablet screenshots | `tablet-7-screenshots/` | 16:9 or 9:16, 320–3840 px | Up to 8, max 8 MB each |
| 10" tablet screenshots | `tablet-10-screenshots/` | 16:9 or 9:16, 320–3840 px | Up to 8, max 8 MB each |

Run `node scripts/generate-play-store-assets.js` to create placeholder images.
