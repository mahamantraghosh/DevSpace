const sharp = require('sharp');

async function run() {
  const input = '/Users/krishna/.gemini/antigravity-ide/brain/3e2bd0b0-5fba-4bcc-b52d-19199bcafe70/media__1781943521250.png';
  const meta = await sharp(input).metadata();
  console.log('Original dimensions:', meta.width, meta.height);
  
  // The feather sticks up, making the image tall. Let's crop a square from the bottom half, which contains the face.
  // We'll take the bottom square where width = height
  const size = Math.min(meta.width, meta.height);
  const left = Math.floor((meta.width - size) / 2);
  const top = meta.height - size; // take from bottom

  await sharp(input)
    .extract({ left, top, width: size, height: size })
    .toFile('app/icon.png');
    
  console.log('Cropped to app/icon.png', size, size);
}

run().catch(console.error);
