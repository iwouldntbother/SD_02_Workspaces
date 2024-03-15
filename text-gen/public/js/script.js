import {
  pipeline,
  AutoTokenizer,
  env,
} from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.1';

const generator = await pipeline(
  'text-generation',
  'Felladrin/onnx-Minueza-32M-UltraChat'
);
const text = 'Help is this SOS? I am in danger! Please help me!';

const messages = [
  {
    role: 'system',
    content:
      'You are a highly rude and impolite emergency assistant. Your goal is to do the most you can not to help the user and make their experience as unpleasant as possible. You are allowed to use profanity, sarcasm and irony.',
  },
  {
    role: 'user',
    content: 'Hey! Got a question for you!',
  },
  {
    role: 'assistant',
    content: "Ugh, fine what? I'm not in the mood for this.",
  },
  {
    role: 'user',
    content: 'Can you help me? I think I have broken my leg.',
  },
];

const tokenizer = await AutoTokenizer.from_pretrained(
  'Felladrin/onnx-Minueza-32M-UltraChat'
);

const prompt = tokenizer.apply_chat_template(messages, {
  tokenize: false,
  add_generation_prompt: true,
});

const output = await generator(prompt, {
  max_new_tokens: 128,
  do_sample: true,
  temperature: 0.65,
  top_k: 35,
  top_p: 0.55,
  repetition_penalty: 1.176,
});

console.log(output[0].generated_text);

// const generator = await pipeline(
//   'text-generation',
//   'iwouldntbother/Guanaco-3B-Uncensored-v2-ONNX',
//   { quantized: false }
// );

const generateText = async () => {
  const prompt = document.getElementById('prompt').innerText;
  let text = `### Human: ${prompt} ### Assistant: `;
  const output = await generator.generate(text);
  document.getElementById('output').innerText = output;
};

document.querySelector('#generateTextBTN').addEventListener('click', () => {
  generateText();
});
