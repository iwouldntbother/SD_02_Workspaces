import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const vert = `
precision highp float;

// Attributes
attribute vec3 position;
attribute vec2 uv;

// Uniforms
uniform mat4 viewMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

// Varying
varying vec2 vUV;

void main(void) {

  vUV = uv;
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;
  //this line makes all the difference
  gl_Position /= gl_Position.w ;

  // Apply transform to UVs
  //vec4 modelViewUVs = modelViewMatrix * vec4(uv.x, uv.y, 1.0, 1.0);

  // Set UV varying to be sent to fShader
  //vUV = modelViewUVs.xy; 

  //vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  //gl_Position = projectionMatrix * modelViewPosition;
}
`;

const frag = `
precision highp float;

varying vec2 vUV;
uniform sampler2D textureSampler;

const float PALETTE_SIZE = 128.0; // Limited color depth

vec3 manualRound(vec3 number) {
    return vec3(floor(number.x + 0.5), floor(number.y + 0.5), floor(number.z + 0.5));
}

float dither2x2(vec2 position, float brightness) {
  int x = int(mod(position.x, 2.0));
  int y = int(mod(position.y, 2.0));
  int index = x + y * 2;
  float limit = 0.0;

  if (x < 8) {
    if (index == 0) limit = 0.25;
    if (index == 1) limit = 0.75;
    if (index == 2) limit = 1.00;
    if (index == 3) limit = 0.50;
  }

  return brightness < limit ? 0.0 : 1.0;
}

// out vec4 fragColor;

void main() {
    // Dithering effect
    vec4 color = texture2D(textureSampler, vUV);
    vec2 ditherPos = mod(gl_FragCoord.xy, 2.0);
    float ditherValue = dither2x2(ditherPos, 1.0);
    color.rgb = color.rgb + ditherValue / 255.0;

    // Quantize to a limited color palette for both animated and non-animated models
    color.rgb = manualRound(color.rgb * PALETTE_SIZE) / PALETTE_SIZE;

    gl_FragColor = color;
}
`;

let res = { width: 480, height: 360 };

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  res.width / res.height,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(res.width, res.height);
document.body.appendChild(renderer.domElement);

import { PsxShader } from './psx.post-process.glsl.js';
import { FilmShader } from './film.post-process.glsl.js';
import { CopyShader } from './post-process.glsl.js';

const composer = new EffectComposer(renderer);

// const copyPass = new ShaderPass(CopyShader);
// composer.addPass(copyPass);

const psxShader = new ShaderPass(PsxShader);
composer.addPass(psxShader);
// composer.addPass(psxShader);

camera.position.z = 30;

const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);

// White directional light at half intensity shining from the top.
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 1, 2);
scene.add(directionalLight);

// Load texture
const texture = new THREE.TextureLoader().load('/display/models/skin.jpg');

// Create shader material
const shaderMaterial = new THREE.RawShaderMaterial({
  uniforms: {
    textureSampler: { value: texture },
  },
  side: THREE.DoubleSide,
  vertexShader: vert,
  fragmentShader: frag,
});

const geometry = new THREE.BoxGeometry(8, 8, 8);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
// const cube = new THREE.Mesh(geometry, material);
const cube = new THREE.Mesh(geometry, shaderMaterial);
const cubeTextureMaterial = new THREE.MeshBasicMaterial({ map: texture });
// scene.add(cube);
// cube.material = cubeTextureMaterial;

const loader = new GLTFLoader();

let headMesh, headMeshAnimation, headMixer, action;
let morphActions = [];
let meshLoaded = false;

const loadModel = true;

if (loadModel) {
  loader.load(
    'models/head_baked.gltf',
    (gltf) => {
      scene.add(gltf.scene);

      console.log(gltf);

      headMesh = gltf.scene.children[0];
      // headMesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      headMesh.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      // headMesh.material = shaderMaterial;
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
}

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  if (meshLoaded) {
    headMixer.update(0.01);
    // headMesh.rotation.z += 0.01;
  }

  // renderer.render(scene, camera);

  composer.render();
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

// const worker = new Worker('./js/workers/text-to-speech.worker.js', {
//   type: 'module',
// });

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
  text2speech('hello there, I am here to help!');
});
