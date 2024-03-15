const API_TOKEN = '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';
const model = 'TheBloke/Wizard-Vicuna-7B-Uncensored-GPTQ';

const query = async (data) => {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/' + model,
    {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
  const result = await response.json();
  return result;
};

query('Help is this SOS? I am in danger! Please help me!').then((result) => {
  console.log(result);
});
