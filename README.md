# 🤖 Talking Robot - React Native App

A beautiful React Native app featuring a 3D animated robot that repeats whatever you say! Built with Three.js for stunning 3D graphics.

![Robot Animation](https://threejs.org/examples/#webgl_animation_skinning_morph)

## ✨ Features

- **Voice Recognition**: Speak and the robot listens
- **Text-to-Speech**: Robot repeats your words in a robotic voice
- **3D Animated Robot**: Beautiful Three.js powered 3D robot with animations
- **Talking Animation**: Robot animates when speaking
- **Cyberpunk UI**: Stunning neon-themed user interface

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/

2. **Java Development Kit (JDK 17)**
   - Download from: https://www.oracle.com/java/technologies/downloads/

3. **Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK (API 34)
   - Install Android SDK Build-Tools
   - Install Android Emulator
   - Install NDK (25.1.8937393)

4. **Environment Variables** (Windows):
   ```
   ANDROID_HOME = C:\Users\<YourUsername>\AppData\Local\Android\Sdk
   JAVA_HOME = C:\Program Files\Java\jdk-17
   ```
   Add to PATH:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\emulator
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   ```

## 🚀 Installation

### Step 1: Install Dependencies

```bash
cd TalkingRobot
npm install
```

### Step 2: Create Android Emulator

1. Open Android Studio
2. Go to **Tools** → **Device Manager**
3. Click **Create Device**
4. Select a phone (e.g., Pixel 6)
5. Select system image (API 34 recommended)
6. Finish and start the emulator

### Step 3: Run the App

**Terminal 1 - Start Metro Bundler:**
```bash
npm start
```

**Terminal 2 - Run on Android:**
```bash
npm run android
```

Or run directly:
```bash
npx react-native run-android
```

## 📱 How to Use

1. **Launch the app** - You'll see a 3D animated robot
2. **Tap the microphone button** - Start speaking
3. **Say something** - The app will recognize your speech
4. **Listen** - The robot will repeat what you said in a robotic voice
5. **Watch** - The robot animates while speaking!

## 🎨 Features Breakdown

### 3D Robot (Three.js)
- Custom-built 3D robot model
- Idle bobbing animation
- Eye glow pulsing effects
- Talking animation with mouth movement
- Arm gestures during speech
- Smooth camera controls (drag to rotate)

### Voice Recognition
- Uses `react-native-voice`
- Supports English language
- Real-time speech-to-text

### Text-to-Speech
- Uses `react-native-tts`
- Robotic voice pitch
- Synchronized with robot animation

## 🛠️ Troubleshooting

### Common Issues

**1. Build fails with SDK not found:**
```bash
# Create local.properties in android folder
echo "sdk.dir=C:\\Users\\dticp\\AppData\\Local\\Android\\Sdk" > android/local.properties
```

**2. Metro bundler not starting:**
```bash
npm start -- --reset-cache
```

**3. App crashes on startup:**
- Make sure emulator has Google Play Services
- Grant microphone permission when prompted

**4. Voice recognition not working:**
- Check microphone permissions in Android settings
- Ensure device has internet connection (required for speech recognition)

**5. Gradle build errors:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

## 📦 Project Structure

```
TalkingRobot/
├── App.js                 # Main application component
├── index.js              # Entry point
├── package.json          # Dependencies
├── android/              # Android native code
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/
│   │       └── main/
│   │           ├── AndroidManifest.xml
│   │           ├── java/com/talkingrobot/
│   │           │   ├── MainActivity.kt
│   │           │   └── MainApplication.kt
│   │           └── res/
│   ├── build.gradle
│   └── settings.gradle
└── README.md
```

## 🎯 Dependencies

| Package | Purpose |
|---------|---------|
| react-native | Core framework |
| react-native-webview | Three.js rendering |
| react-native-voice | Speech recognition |
| react-native-tts | Text-to-speech |

## 🔧 Customization

### Change Robot Voice
In `App.js`, modify TTS settings:
```javascript
Tts.setDefaultRate(0.45);     // Speed (0.0 - 1.0)
Tts.setDefaultPitch(0.8);     // Pitch (0.5 = robotic, 1.0 = normal)
Tts.setDefaultLanguage('en-US'); // Language
```

### Modify Robot Appearance
Edit the `createRobot()` function in the embedded HTML within `App.js` to customize:
- Colors (bodyMaterial, accentMaterial)
- Size and proportions
- Animation speeds

## 📄 License

MIT License - feel free to use and modify!

---

Made with ❤️ using React Native + Three.js

