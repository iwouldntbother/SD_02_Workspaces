let lookupTable;
let imageLookup;

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

fetch('./cmudict/cmudict_image.json')
  .then((res) => {
    if (!res.ok) {
      throw new Error('HTTP error ' + res.status);
    }
    return res.json();
  })
  .then((json) => {
    imageLookup = json;
  });

const createIMG = (imagePath) => {
  image = document.createElement('img');
  image.setAttribute('src', imagePath);
  return image;
};

document.querySelector('#inputButton').addEventListener('click', () => {
  let inputText = document.querySelector('#inputText').value;

  let inputTextArray = inputText.replace(/[^\w\s]*/g, '').split(' ');
  console.log('Input:', inputTextArray);
  let outputTextArray = [];
  for (let i = 0; i < inputTextArray.length; i++) {
    if (!lookupTable[inputTextArray[i].toLowerCase()]) {
      outputTextArray.push('*ERROR*');
      continue;
    }
    outputTextArray.push(
      lookupTable[inputTextArray[i].toLowerCase()].replace(/[0-9]/g, '')
    );
  }
  console.log('Output:', outputTextArray);
  // loadImages(outputTextArray);
  document.querySelector('#outputText').value = outputTextArray.join(' | ');
});

const loadImages = (array) => {
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[i].split(' ').length; j++) {
      document
        .querySelector('#imageGrid')
        .appendChild(createIMG(imageLookup[array[i].split(' ')[j]]));
    }
    let spacer = document.createElement('div');
    spacer.className = 'imageSpacer';
    document.querySelector('#imageGrid').appendChild(spacer);
  }
};

// document
//   .querySelector('#imageGrid')
//   .appendChild(
//     createIMG(
//       imageLookup[
//         lookupTable[inputTextArray[i].toLowerCase()].replace(/[0-9]/g, '')
//       ]
//     )
//   );
