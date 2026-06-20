const sharp = require('sharp');

async function run() {
  const input = '/Users/krishna/.gemini/antigravity-ide/brain/3e2bd0b0-5fba-4bcc-b52d-19199bcafe70/media__1781943521250.png';
  const meta = await sharp(input).metadata();
  
  // To avoid cutting the head frame, we'll increase the crop size to 750 (capturing more area)
  const size = 750;
  const left = Math.floor((meta.width - size) / 2);
  
  // We'll set the top offset to capture from the upper half of the image, 
  // ensuring the top of the head/crown is fully included, which naturally places the face lower.
  const top = 80; 
  
  await sharp(input)
    .extract({ left, top: Math.max(0, top), width: size, height: size })
    .resize(32, 32, { fit: 'cover' })
    .toFile('app/icon.png');
    
  console.log('Final adjusted face crop done: app/icon.png');
}

run().catch(console.error);
