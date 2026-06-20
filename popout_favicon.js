const sharp = require('sharp');

async function run() {
  const input = '/Users/krishna/.gemini/antigravity-ide/brain/3e2bd0b0-5fba-4bcc-b52d-19199bcafe70/media__1781943521250.png';
  const meta = await sharp(input).metadata();
  
  // A perfect "Goldilocks" crop: Not the whole 838 width, and not the extreme 500 width.
  // We use 700x700 to zoom in on the face about 15% more, cutting off just the very edges of the side hair,
  // making the central face "pop out" much more significantly in the tiny 32x32 frame.
  const size = 680;
  const left = Math.floor((meta.width - size) / 2);
  const top = meta.height - size - 20; // Just slightly off the absolute bottom
  
  await sharp(input)
    .extract({ left, top, width: size, height: size })
    .resize(32, 32, { fit: 'cover' })
    .toFile('app/icon.png');
    
  console.log('Popout crop done: app/icon.png');
}

run().catch(console.error);
