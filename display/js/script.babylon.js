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

// ---------- //
// BABYLON.js //
// ---------- //

let morphInfluences = [];
let morphAnimations = [];

// Create the engine
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);

// Create a function to initialize the Babylon.js scene
function createScene() {
  // Create the scene
  const scene = new BABYLON.Scene(engine);

  // Create a camera
  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    0,
    0,
    10,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.position = new BABYLON.Vector3(0, 3, 72);

  // Create a light
  const light = new BABYLON.HemisphericLight(
    'light',
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  // Create a box
  // const box = BABYLON.MeshBuilder.CreateBox('box', { size: 2 }, scene);

  const baseKeys = [
    { frame: 0, value: 0.0 },
    { frame: 30, value: 1.0 },
    { frame: 60, value: 0.0 },
  ];

  // Import Head model
  BABYLON.SceneLoader.ImportMeshAsync(
    '0dcf062f88e741beac28166787231306',
    'models/',
    'head.glb'
  ).then((result) => {
    result.animationGroups[0].stop();
    // console.log(result.meshes[1].morphTargetManager);
    for (let i = 0; i < result.meshes[1].morphTargetManager.numTargets; i++) {
      morphInfluences.push(result.meshes[1].morphTargetManager.getTarget(i));
      const anim = new BABYLON.Animation(
        result.meshes[1].morphTargetManager.getTarget(i).name,
        'influence',
        60,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );
      anim.enableBlending = true;
      anim.setKeys(baseKeys);
      result.meshes[1].animations.push(anim);
      // morphAnimations.push(anim);
    }
    // console.log(morphInfluences.map((x) => x.name));
  });

  return scene;
}

const animateFace = async (phrase) => {
  let phonemes = phrase.phonemes.output.flat();
  let count = phrase.phonemes.count;
  let time = phrase.time;

  console.log('phonemes:', phonemes, 'count:', count, 'time:', time);

  for (let i = 0; i < count; i++) {
    // console.log(
    //   'name:',
    //   morphInfluences.indexOf(
    //     morphInfluences.find((x) => x.name === morphLookup[phonemes[i]])
    //   ),
    //   'fromFrame:',
    //   i * ((time * 60) / count).toFixed(2),
    //   'toFrame:',
    //   (i + 1) * ((time * 60) / count).toFixed(2)
    // );
    if (morphLookup[phonemes[i]]) {
      setTimeout(() => {
        console.log(
          'morph target:',
          morphLookup[phonemes[i]],
          'speed:',
          (time / count).toFixed(2)
        );
        scene.beginAnimation(
          morphInfluences.find((x) =>
            x.name.includes(morphLookup[phonemes[i]])
          ),
          0,
          60,
          false,
          (time / count).toFixed(2)
        );
      }, (i + 1) * ((time / count) * 1000));
    }
    // await anim.waitAsync();
  }
  // for (let i = 0; i < phrase.phonemes.count; i++) {
  //   setTimeout(() => {
  //     console.log(
  //       'name:',
  //       morphInfluences.find((x) => x.name === morphLookup[phonemes[i]]),
  //       'toFrame:',
  //       i * ((time * 30) / count).toFixed(2),
  //       'delay:',
  //       i * ((time * 1000) / count).toFixed(2)
  //     );
  //     scene.beginDirectAnimation(
  //       scene.meshes[1],
  //       morphInfluences.find((x) => x.name === morphLookup[phonemes[i]]),
  //       0,
  //       i * ((phrase.time * 30) / phrase.phonemes.count),
  //       false
  //     );
  //   }, i * ((time * 1000) / count).toFixed(2));
  //   // }, i * ((phrase.time * 1000) / phrase.phonemes.count));
  // }
};

const demo = async (text) => {
  let result = await text2speech(text);
  // let phrase = phraseQueue.shift();
  animateFace(result);
};

// Create the scene
const scene = createScene();

// Run the render loop
engine.runRenderLoop(() => {
  scene.render();
});

// Handle window resize
window.addEventListener('resize', () => {
  engine.resize();
});
