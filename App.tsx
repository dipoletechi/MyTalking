/**
 * My Talking App - With Splash Screen Video
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Text,
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Video from 'react-native-video';
import Tts from 'react-native-tts';

const { SpeechModule } = NativeModules;

const robotHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        * { margin: 0; padding: 0; }
        body { 
            overflow: hidden; 
            touch-action: none;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        }
        canvas { display: block; }
    </style>
</head>
<body>
    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
    }
    </script>
    
    <script type="module">
        import * as THREE from 'three';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        let camera, scene, renderer, model, mixer, clock;
        let actions = {};
        let activeAction;
        let face;
        let mouthInterval = null;

        window.addEventListener('message', function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'startTalk') playTalkAnimation();
                else if (data.type === 'stopTalk') playIdleAnimation();
                else if (data.type === 'listen') playListenAnimation();
            } catch (e) {}
        });

        function playTalkAnimation() {
            if (actions['Wave']) fadeToAction('Wave', 0.3);
            animateMouth(true);
        }

        function playIdleAnimation() {
            fadeToAction('Idle', 0.5);
            animateMouth(false);
        }

        function playListenAnimation() {
            if (actions['ThumbsUp']) fadeToAction('ThumbsUp', 0.3);
        }

        function animateMouth(start) {
            if (mouthInterval) clearInterval(mouthInterval);
            mouthInterval = null;
            
            if (start && face && face.morphTargetInfluences) {
                mouthInterval = setInterval(() => {
                    if (face && face.morphTargetInfluences) {
                        const mouthOpen = Math.random() * 0.6;
                        for (let i = 0; i < face.morphTargetInfluences.length; i++) {
                            face.morphTargetInfluences[i] = mouthOpen;
                        }
                    }
                }, 100);
            } else if (face && face.morphTargetInfluences) {
                for (let i = 0; i < face.morphTargetInfluences.length; i++) {
                    face.morphTargetInfluences[i] = 0;
                }
            }
        }

        function init() {
            scene = new THREE.Scene();
            const canvas = document.createElement('canvas');
            canvas.width = 2; canvas.height = 512;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 512);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(0.5, '#16213e');
            gradient.addColorStop(1, '#0f3460');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 2, 512);
            scene.background = new THREE.CanvasTexture(canvas);
            scene.fog = new THREE.Fog(0x16213e, 10, 50);

            clock = new THREE.Clock();
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 100);
            camera.position.set(0, 2, 6);
            camera.lookAt(0, 1, 0);

            scene.add(new THREE.HemisphereLight(0x00d9ff, 0x444444, 2));
            const dirLight = new THREE.DirectionalLight(0xffffff, 3);
            dirLight.position.set(5, 10, 7.5);
            scene.add(dirLight);

            const ground = new THREE.Mesh(
                new THREE.CircleGeometry(15, 64),
                new THREE.MeshStandardMaterial({ color: 0x111122, metalness: 0.8, roughness: 0.4 })
            );
            ground.rotation.x = -Math.PI / 2;
            scene.add(ground);

            const grid = new THREE.GridHelper(30, 30, 0x00d9ff, 0x00d9ff);
            grid.material.opacity = 0.15;
            grid.material.transparent = true;
            scene.add(grid);

            new GLTFLoader().load(
                'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
                function (gltf) {
                    model = gltf.scene;
                    model.traverse((child) => {
                        if (child.isMesh) child.castShadow = true;
                        if (child.name === 'Head_4') face = child;
                    });
                    scene.add(model);

                    mixer = new THREE.AnimationMixer(model);
                    gltf.animations.forEach(clip => {
                        const action = mixer.clipAction(clip);
                        actions[clip.name] = action;
                        if (['Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp', 'Death'].includes(clip.name)) {
                            action.clampWhenFinished = true;
                            action.loop = THREE.LoopOnce;
                        }
                    });

                    activeAction = actions['Idle'];
                    if (activeAction) activeAction.play();
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
                }
            );

            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setAnimationLoop(() => {
                if (mixer) mixer.update(clock.getDelta());
                renderer.render(scene, camera);
            });
            document.body.appendChild(renderer.domElement);

            const controls = new OrbitControls(camera, renderer.domElement);
            controls.target.set(0, 1, 0);
            controls.enableDamping = true;
            controls.minDistance = 3;
            controls.maxDistance = 15;
            controls.maxPolarAngle = Math.PI / 2;

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
        }

        function fadeToAction(name, duration) {
            const prev = activeAction;
            activeAction = actions[name];
            if (!activeAction) return;
            if (prev && prev !== activeAction) prev.fadeOut(duration);
            activeAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();
        }

        init();
    </script>
</body>
</html>
`;

let globalLoopTimer: any = null;

function App(): React.JSX.Element {
  const [showSplash, setShowSplash] = useState(true);
  const [status, setStatus] = useState('Loading');
  const webViewRef = useRef<WebView>(null);
  const robotReadyRef = useRef(false);

  const sendToWebView = (msg: object) => {
    webViewRef.current?.postMessage(JSON.stringify(msg));
  };

  const requestMicPermission = async (): Promise<boolean> => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        { title: 'Mic Permission', message: 'Robot ko sunne ke liye', buttonPositive: 'OK' }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      return false;
    }
  };

  const doListen = async () => {
    if (!SpeechModule || !robotReadyRef.current) {
      scheduleNext(2000);
      return;
    }

    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      scheduleNext(3000);
      return;
    }

    setStatus('Listening');
    sendToWebView({ type: 'listen' });

    try {
      const result = await SpeechModule.startSpeechToText('hi-IN');
      sendToWebView({ type: 'stopTalk' });

      if (result && result.trim()) {
        doSpeak(result);
      } else {
        doListen();
      }
    } catch (error: any) {
      sendToWebView({ type: 'stopTalk' });
      doListen();
    }
  };

  const doSpeak = (text: string) => {
    setStatus('Speaking');
    sendToWebView({ type: 'startTalk' });
    Tts.stop();
    const isHindi = /[\u0900-\u097F]/.test(text);
    Tts.setDefaultLanguage(isHindi ? 'hi-IN' : 'en-US').catch(() => {});
    Tts.speak(text);
  };

  const scheduleNext = (delay: number) => {
    if (globalLoopTimer) clearTimeout(globalLoopTimer);
    globalLoopTimer = setTimeout(() => {
      if (robotReadyRef.current) {
        doListen();
      }
    }, delay);
  };

  useEffect(() => {
    Tts.getInitStatus().then(() => {
      Tts.setDefaultRate(0.5);
      Tts.setDefaultPitch(1.0);
    }).catch(() => {});

    const onFinish = () => {
      sendToWebView({ type: 'stopTalk' });
      setStatus('Rest');
      scheduleNext(2000);
    };

    Tts.addEventListener('tts-finish', onFinish);
    Tts.addEventListener('tts-cancel', onFinish);

    return () => {
      robotReadyRef.current = false;
      if (globalLoopTimer) clearTimeout(globalLoopTimer);
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
      SpeechModule?.destroy();
    };
  }, []);

  const onRobotReady = () => {
    robotReadyRef.current = true;
    setStatus('Rest');
    globalLoopTimer = setTimeout(() => {
      doListen();
    }, 2000);
  };

  const onSplashEnd = () => {
    setShowSplash(false);
  };

  // Splash Screen
  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar hidden={true} />
        <Video
          source={require('./android/app/src/main/res/raw/splash.mp4')}
          style={styles.splashVideo}
          resizeMode="cover"
          onEnd={onSplashEnd}
          repeat={false}
          muted={false}
        />
      </View>
    );
  }

  // Main App
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      <WebView
        ref={webViewRef}
        source={{ html: robotHTML }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        originWhitelist={['*']}
        scrollEnabled={false}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data.type === 'ready') {
              onRobotReady();
            }
          } catch {}
        }}
      />

      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  splashVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#1a1a2e' 
  },
  webview: { 
    flex: 1 
  },
  statusBadge: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#00d9ff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default App;
