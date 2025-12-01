import React from 'react';
import {StyleSheet, View, StatusBar} from 'react-native';
import {WebView} from 'react-native-webview';

const App = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />
      <WebView
        source={{html: robotHTML}}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
        mixedContentMode="always"
      />
    </View>
  );
};

const robotHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=800&q=80') center/cover fixed;min-height:100vh;overflow:hidden;color:#fff}
#robot-canvas{width:100%;height:100vh;background:transparent}
.status{position:absolute;top:15px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);padding:12px 30px;border-radius:25px;color:#00ffff;font-size:18px;z-index:10;border:2px solid #00ffff;text-align:center;box-shadow:0 4px 20px rgba(0,255,255,0.4);backdrop-filter:blur(10px)}
.status.listening{background:rgba(255,0,100,0.6);border-color:#ff0066;color:#fff;animation:pulse 1s infinite;box-shadow:0 4px 25px rgba(255,0,102,0.6);backdrop-filter:blur(10px)}
.status.speaking{background:rgba(0,255,136,0.5);border-color:#00ff88;color:#fff;box-shadow:0 4px 25px rgba(0,255,136,0.6);backdrop-filter:blur(10px)}
.status.waiting{background:rgba(138,43,226,0.5);border-color:#9932cc;color:#fff;box-shadow:0 4px 20px rgba(138,43,226,0.5);backdrop-filter:blur(10px)}
@keyframes pulse{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.05)}}
.speech-bubble{position:absolute;bottom:100px;left:20px;right:20px;background:rgba(0,0,0,0.8);border:2px solid #00ffff;border-radius:20px;padding:15px 20px;text-align:center;z-index:10;box-shadow:0 5px 30px rgba(0,255,255,0.4);backdrop-filter:blur(15px)}
.speech-label{color:#00ffff;font-size:12px;margin-bottom:5px}
.speech-text{color:#fff;font-size:18px;font-weight:500}
#loading{position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#00ffff;z-index:100;background:rgba(0,0,0,0.6);padding:30px 50px;border-radius:20px;backdrop-filter:blur(10px)}
.loader{width:60px;height:60px;border:5px solid rgba(0,255,255,0.2);border-top:5px solid #00ffff;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px}
@keyframes spin{to{transform:rotate(360deg)}}
.hidden{display:none!important}
</style>
</head>
<body>
<div id="loading"><div class="loader"></div><div>Loading Robot...</div></div>
<div class="status" id="status">Loading...</div>
<canvas id="robot-canvas"></canvas>
<div class="speech-bubble" id="speechBubble" style="display:none"><div class="speech-label" id="speechLabel">You said:</div><div class="speech-text" id="speechText"></div></div>

<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

<script>
var scene,camera,renderer,controls;
var model,mixer,clock=new THREE.Clock();
var actions={},activeAction,face;
var isListening=false,isSpeaking=false;
var recognition=null;
var robotLoaded=false;
var lastResultIndex=-1;
var canProcess=true;

// Setup Speech Recognition - Continuous mode (no beep!)
var SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SpeechRecognition){
  recognition=new SpeechRecognition();
  recognition.continuous=true;
  recognition.interimResults=false;
  recognition.lang='en-US';
  
  recognition.onresult=function(e){
    var last=e.results.length-1;
    // Only process NEW results
    if(e.results[last].isFinal && last>lastResultIndex && canProcess){
      lastResultIndex=last;
      var text=e.results[last][0].transcript;
      if(text.trim()&&!isSpeaking){
        canProcess=false;  // Block processing until ready
        pauseListening();
        showBubble('You said:',text);
        setTimeout(function(){robotSpeak(text);},300);
      }
    }
  };
  
  recognition.onerror=function(e){
    console.log('Error:',e.error);
    if(e.error!=='no-speech'&&e.error!=='aborted'){
      restartRecognition();
    }
  };
  
  recognition.onend=function(){
    // Reset index when recognition ends
    lastResultIndex=-1;
    // Restart if we should be listening
    if(!isSpeaking&&canProcess){
      setTimeout(function(){
        if(!isSpeaking){
          isListening=true;
          try{recognition.start();}catch(e){}
        }
      },200);
    }
  };
}

function startCountdown(){
  var count=3;
  document.getElementById('status').textContent='Starting in '+count+'...';
  document.getElementById('status').className='status waiting';
  
  var timer=setInterval(function(){
    count--;
    if(count>0){
      document.getElementById('status').textContent='Starting in '+count+'...';
    }else{
      clearInterval(timer);
      startListening();
    }
  },1000);
}

function startListening(){
  if(isSpeaking||!robotLoaded)return;
  if(!recognition){
    document.getElementById('status').textContent='Speech not supported';
    return;
  }
  
  isListening=true;
  document.getElementById('status').textContent='LISTENING...';
  document.getElementById('status').className='status listening';
  document.getElementById('speechBubble').style.display='none';
  
  fadeToAction('Idle',0.3);
  
  try{
    recognition.start();
  }catch(e){
    // Already running, ignore
  }
}

function pauseListening(){
  // Don't stop recognition, just pause processing
  isListening=false;
}

function restartRecognition(){
  try{recognition.stop();}catch(e){}
  setTimeout(function(){
    try{recognition.start();}catch(e){}
  },100);
}

function stopListening(){
  isListening=false;
  fadeToAction('Idle',0.3);
}

function showBubble(label,text){
  document.getElementById('speechLabel').textContent=label;
  document.getElementById('speechText').textContent=text;
  document.getElementById('speechBubble').style.display='block';
}

function robotSpeak(text){
  isSpeaking=true;
  document.getElementById('status').textContent='SPEAKING...';
  document.getElementById('status').className='status speaking';
  showBubble('Robot says:',text);
  
  fadeToAction('Walking',0.3);
  
  // Google Translate TTS
  var audio=new Audio('https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q='+encodeURIComponent(text.substring(0,200)));
  
  audio.onended=finishSpeaking;
  audio.onerror=finishSpeaking;
  audio.play().catch(finishSpeaking);
  
  setTimeout(function(){if(isSpeaking)finishSpeaking();},15000);
}

function finishSpeaking(){
  isSpeaking=false;
  if(face&&face.morphTargetInfluences)face.morphTargetInfluences[1]=0;
  fadeToAction('Idle',0.3);
  
  document.getElementById('status').textContent='Resting 2 sec...';
  document.getElementById('status').className='status waiting';
  
  setTimeout(function(){playEmote('ThumbsUp');},200);
  setTimeout(function(){document.getElementById('speechBubble').style.display='none';},1000);
  
  // Restart listening after 2 seconds
  setTimeout(function(){
    // Reset for fresh listening
    lastResultIndex=-1;
    canProcess=true;
    isListening=true;
    
    document.getElementById('status').textContent='LISTENING...';
    document.getElementById('status').className='status listening';
    
    // Stop and restart recognition fresh
    try{recognition.stop();}catch(e){}
    setTimeout(function(){
      try{recognition.start();}catch(e){}
    },150);
  },2000);
}

function fadeToAction(name,dur){
  dur=dur||0.3;
  var prev=activeAction;
  activeAction=actions[name];
  if(prev!==activeAction&&prev)prev.fadeOut(dur);
  if(activeAction)activeAction.reset().setEffectiveWeight(1).fadeIn(dur).play();
}

function playEmote(name){
  if(!actions[name])return;
  fadeToAction(name,0.2);
  mixer.addEventListener('finished',function restore(){
    mixer.removeEventListener('finished',restore);
    fadeToAction('Idle',0.2);
  });
}

// Three.js Setup
function init(){
  var canvas=document.getElementById('robot-canvas');
  
  scene=new THREE.Scene();
  scene.background=null;  // Transparent to show image
  
  camera=new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,100);
  camera.position.set(0,1.2,5);
  
  renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
  renderer.setClearColor(0x000000,0);  // Transparent renderer
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.shadowMap.enabled=true;
  
  scene.add(new THREE.HemisphereLight(0xffffff,0x8d8d8d,3));
  var dirLight=new THREE.DirectionalLight(0xffffff,3);
  dirLight.position.set(-3,10,-10);
  dirLight.castShadow=true;
  scene.add(dirLight);
  
  var ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x111111,transparent:true,opacity:0.3}));
  ground.rotation.x=-Math.PI/2;
  ground.receiveShadow=true;
  scene.add(ground);
  scene.add(new THREE.GridHelper(20,20,0x00ffff,0x333333));
  
  controls=new THREE.OrbitControls(camera,renderer.domElement);
  controls.target.set(0,0.8,0);
  controls.minDistance=3;
  controls.maxDistance=8;
  controls.maxPolarAngle=Math.PI/2;
  controls.update();
  
  // Load Robot
  new THREE.GLTFLoader().load(
    'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    function(gltf){
      model=gltf.scene;
      scene.add(model);
      model.traverse(function(obj){
        if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;}
      });
      
      mixer=new THREE.AnimationMixer(model);
      gltf.animations.forEach(function(clip){
        var action=mixer.clipAction(clip);
        actions[clip.name]=action;
        if(['Jump','Yes','No','Wave','Punch','ThumbsUp'].indexOf(clip.name)>=0){
          action.clampWhenFinished=true;
          action.loop=THREE.LoopOnce;
        }
      });
      
      face=model.getObjectByName('Head_4');
      activeAction=actions['Idle'];
      activeAction.play();
      
      document.getElementById('loading').classList.add('hidden');
      robotLoaded=true;
      
      // Start countdown after robot loads
      startCountdown();
      
      animate();
    },
    function(xhr){
      if(xhr.total>0){
        var p=Math.round((xhr.loaded/xhr.total)*100);
        document.querySelector('#loading div:last-child').textContent='Loading '+p+'%';
      }
    },
    function(error){
      document.querySelector('#loading div:last-child').textContent='Error! Check Internet';
      document.querySelector('#loading div:last-child').style.color='#ff6b6b';
    }
  );
  
  window.addEventListener('resize',function(){
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
  });
}

function animate(){
  requestAnimationFrame(animate);
  if(mixer)mixer.update(clock.getDelta());
  
  if(isSpeaking&&face&&face.morphTargetInfluences){
    face.morphTargetInfluences[1]=0.5+Math.sin(clock.getElapsedTime()*12)*0.4;
  }
  
  controls.update();
  renderer.render(scene,camera);
}

init();
</script>
</body>
</html>`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default App;
