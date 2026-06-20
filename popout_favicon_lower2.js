const sharp = require('sharp');

async function run() {
  const input = '/Users/krishna/.gemini/antigravity-ide/brain/3e2bd0b0-5fba-4bcc-b52d-19199bcafe70/media__1781943521250.png';
  const meta = await sharp(input).metadata();
  
  const size = 680;
  const left = Math.floor((meta.width - size) / 2);
  
  // To make the face appear even LOWER, we move the crop box further UP on the original image.
  // We increase the offset from the bottom from 80 to 120 pixels.
  const top = meta.height - size - 120; 
  
  await sharp(input)
    .extract({ left, top: Math.max(0, top), width: size, height: size })
    .resize(32, 32, { fit: 'cover' })
    .toFile('app/icon.png');
    
  console.log('Even lower face crop done: app/icon.png');
}

run().catch(console.error);
