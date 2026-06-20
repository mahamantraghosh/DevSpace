const sharp = require('sharp');

async function run() {
  const input = '/Users/krishna/.gemini/antigravity-ide/brain/3e2bd0b0-5fba-4bcc-b52d-19199bcafe70/media__1781943521250.png';
  const meta = await sharp(input).metadata();
  
  const size = 680;
  const left = Math.floor((meta.width - size) / 2);
  
  // To make the face appear LOWER in the final square, we move the crop box UP on the original image.
  // We increase the offset from the bottom from 20 to 80 pixels.
  const top = meta.height - size - 80; 
  
  await sharp(input)
    .extract({ left, top: Math.max(0, top), width: size, height: size })
    .resize(32, 32, { fit: 'cover' })
    .toFile('app/icon.png');
    
  console.log('Lowered face crop done: app/icon.png');
}

run().catch(console.error);
