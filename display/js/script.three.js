import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 30;

const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);

// White directional light at half intensity shining from the top.
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 1, 2);
scene.add(directionalLight);

const loader = new GLTFLoader();

let headMesh, headMeshAnimation, headMixer, action;
let morphActions = [];
let meshLoaded = false;

loader.load(
  'models/head.glb',
  (gltf) => {
    scene.add(gltf.scene);

    console.log(gltf);

    headMesh = gltf.scene.children[0];
    // headMesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    headMesh.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    console.log(headMesh);

    headMeshAnimation = gltf.animations;
    console.log(headMeshAnimation);

    headMixer = new THREE.AnimationMixer(headMesh);

    // let morphKeyFrameTrack = new THREE.NumberKeyframeTrack(
    //   '.morphTargetInfluences[4]',
    //   [0, 0.5, 1],
    //   [0, 1, 0],
    //   THREE.InterpolateSmooth
    // );

    // let morphAnimationClip = new THREE.AnimationClip('morphs', 2, [
    //   morphKeyFrameTrack,
    // ]);

    // action = headMixer.clipAction(morphAnimationClip);
    // action.setLoop(THREE.LoopOnce);
    // action.setDuration(0.5);
    // action.play();

    console.log(Object.keys(headMesh.morphTargetDictionary));

    let animationNames = Object.keys(headMesh.morphTargetDictionary);

    for (let i = 0; i < animationNames.length; i++) {
      // console.log(animationNames[i]);
      let morphKeyFrameTrack = new THREE.NumberKeyframeTrack(
        `.morphTargetInfluences[${i}]`,
        [0, 0.5, 1],
        [0, 1, 0],
        THREE.InterpolateSmooth
      );

      let morphAnimationClip = new THREE.AnimationClip(animationNames[i], 1, [
        morphKeyFrameTrack,
      ]);

      let morphAction = headMixer.clipAction(morphAnimationClip);
      morphAction.setLoop(THREE.LoopOnce);
      morphActions.push({
        name: animationNames[i],
        action: morphAction,
      });
    }

    console.log(morphActions);

    meshLoaded = true;
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  (err) => {
    console.error('An error happened', err);
  }
);

function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  if (meshLoaded) {
    headMixer.update(0.01);
  }

  renderer.render(scene, camera);
}

animate();

const playTheseActions = (morphArray, totalDuration) => {
  playAction(
    morphArray,
    morphArray.length - 1,
    totalDuration / morphArray.length
  );
};

const playAction = (morphArray, orderIndex, duration) => {
  console.log('Playing:', morphArray[orderIndex].name, duration);
  morphArray[orderIndex].action.setDuration(duration * 1.5);
  morphArray[orderIndex].action.play();
  morphArray[orderIndex].action.reset();
  if (orderIndex > 0) {
    setTimeout(() => {
      playAction(morphArray, orderIndex - 1, duration);
    }, duration * 1000);
  }
};

// Loop through the phonemes
// find the correct morph target
// add that morph target to an array
// play the morph targets in order with total duration
// and play source audio at the same time

//
// text-to-face //
//

let lookupTable;
let morphLookup;

fetch('./cmudict/cmudict_lookup.json')
  .then((res) => {
    if (!res.ok) {
      throw new Error('HTTP error ' + res.status);
    }
    return res.json();
  })
  .then((json) => {
    lookupTable = json;
  });

fetch('./cmudict/cmudict_morphs.json')
  .then((res) => {
    if (!res.ok) {
      throw new Error('HTTP error ' + res.status);
    }
    return res.json();
  })
  .then((json) => {
    morphLookup = json;
  });

const getPhoneme = (text) => {
  let inputArray = text.replace(/[^\w\s]*/g, '').split(' ');
  let outputArray = [];

  for (let i = 0; i < inputArray.length; i++) {
    if (!lookupTable[inputArray[i].toLowerCase()]) {
      outputArray.push('*ERROR*');
      continue;
    }
    outputArray.push(
      lookupTable[inputArray[i].toLowerCase()].replace(/[0-9]/g, '').split(' ')
    );
  }
  let count = outputArray.map((x) => x.length).reduce((a, b) => a + b, 0);
  return { output: outputArray, count: count };
};

const worker = new Worker('./js/workers/text-to-speech.worker.js', {
  type: 'module',
});

let phraseQueue = [];

const text2speech = async (text) => {
  worker.postMessage({ message: text });
  worker.onmessage = (e) => {
    console.log('Data received from worker:', e.data);
    const { f32Buffer, sampling_rate } = e.data;
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let buffer = audioContext.createBuffer(1, f32Buffer.length, sampling_rate);
    buffer.copyToChannel(f32Buffer, 0);
    let source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    console.log(
      'Audio length:',
      Number(f32Buffer.length / sampling_rate).toFixed(2)
    );
    // source.start();
    let phrase = {
      source: source,
      text: text,
      phonemes: getPhoneme(text),
      time: Number(f32Buffer.length / sampling_rate),
    };
    phraseQueue.push(phrase);
    console.log(phraseQueue);
    phrase.source.start();
    animateFace(phrase);
  };
};

const animateFace = (phrase) => {
  let morphTargets = [];

  let phonemeArray = phrase.phonemes.output.flat();

  for (let i = 0; i < phonemeArray.length; i++) {
    let phoneme = phonemeArray[i];
    console.log('animateFace():', phoneme);
    let morphName = morphLookup[phoneme];
    console.log('animateFace():', morphName);
    let morph = morphActions.find((x) => x.name.includes(morphName));
    if (morph) {
      morphTargets.push(morph);
    }
  }
  console.log(morphTargets);
  playTheseActions(morphTargets, phrase.time);
};

const demo = async (text) => {
  let result = await text2speech(text);
  // let phrase = phraseQueue.shift();
  animateFace(result);
};

window.addEventListener('click', () => {
  // playTheseActions(morphActions, 10);
  // demo('hello world');
  text2speech(
    'hello Aerin, I know where you live. I am coming for you. Today is the day. I will find you. I will kiss you!'
  );
});
