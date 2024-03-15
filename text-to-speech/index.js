import { pipeline } from '@xenova/transformers';
// const express = require('express');
import express from 'express';
const app = express();

app.use(express.json());

// // Create a text-to-speech pipeline
// const synthesizer = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
//   quantized: false,
// });

// // Generate speech
// const speaker_embeddings =
//   'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin';
// const result = await synthesizer('Hello, my dog is cute', {
//   speaker_embeddings,
// });

import wavefile from 'wavefile';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 } from 'uuid';

app.post('/tts', async (req, res) => {
  // console.log(JSON.parse(req.body));
  console.log(req.body.message);
  const result = await synthesizer(req.body.message, {
    speaker_embeddings,
  });

  // console.log(Array.from(result.audio));
  // res.send(JSON.stringify(Array.from(result.audio)));

  // console.log(result);

  const wav = new wavefile.WaveFile();
  wav.fromScratch(1, result.sampling_rate, '32f', result.audio);
  let thisUUID = v4();
  console.log(
    path.dirname(fileURLToPath(import.meta.url)),
    '/tempAudio/' + String(thisUUID) + '.wav'
  );
  fs.writeFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '/tempAudio/' + String(thisUUID) + '.wav'
    ),
    wav.toBuffer()
  );
  res.sendFile(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '/tempAudio/' + String(thisUUID) + '.wav'
    )
  );
  // res.sendFile(
  //   fs.writeFileSync('tempAudio/' + String(thisUUID) + '.wav', wav.toBuffer())
  // );
  // res.send(JSON.stringify(speech.audio));
});

app.get('/audio-f32-array', (_, res) => {
  res.send(JSON.stringify(result.audio));
});

app.use('/models', express.static('models'));

// Serve static files from the public folder
app.use('/', express.static('public'));

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
