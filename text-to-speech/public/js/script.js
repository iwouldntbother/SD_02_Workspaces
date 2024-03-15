let f32Buffer;
let sampling_rate = 16000;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();

const playAudio = () => {
  let buffer = audioContext.createBuffer(1, f32Buffer.length, sampling_rate);
  console.log(Number(f32Buffer.length / sampling_rate).toFixed(2));
  buffer.copyToChannel(f32Buffer, 0);
  let source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  // document.getElementById('audioEl').appendChild(source);
  source.start();
};

document.getElementById('playAudioBTN').addEventListener('click', playAudio);

import {
  pipeline,
  env,
} from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.1';

// const model = 'Xenova/speecht5_tts';
const model = 'NeuML/ljspeech-jets-onnx';

const synthesizer = await pipeline('text-to-speech', model, {
  quantized: false,
});

const speaker_embeddings =
  'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin';

// createAudio();

const tts = async (message) => {
  const result = await synthesizer(message, {
    speaker_embeddings,
  });

  f32Buffer = new Float32Array(result.audio);
  sampling_rate = result.sampling_rate;

  document.getElementById('playAudioBTN').disabled = false;
};

document.getElementById('createAudioBTN').addEventListener('click', () => {
  tts(document.getElementById('message-input').value);
});
