const sharp = require('sharp');

async function run() {
  const input = '/Users/krishna/.gemini/antigravity-ide/brain/3e2bd0b0-5fba-4bcc-b52d-19199bcafe70/media__1781943521250.png';
  const meta = await sharp(input).metadata();
  
  const size = Math.min(meta.width, meta.height);
  const left = Math.floor((meta.width - size) / 2);
  const top = meta.height - size; // take from bottom

  await sharp(input)
    .extract({ left, top, width: size, height: size })
    .resize(32, 32)
    .toFile('app/icon.png');
    
  console.log('Resized to exactly 32x32: app/icon.png');
}

run().catch(console.error);
