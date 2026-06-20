const sharp = require('sharp');

async function run() {
  const input = '/Users/krishna/.gemini/antigravity-ide/brain/3e2bd0b0-5fba-4bcc-b52d-19199bcafe70/media__1781943521250.png';
  const meta = await sharp(input).metadata();
  
  // Tighter crop right on the face. Face is typically in the center-bottom.
  // Original width is 838. We will take a 500x500 square from the middle horizontally, and slightly down vertically.
  const size = 500;
  const left = Math.floor((meta.width - size) / 2);
  const top = meta.height - size - 100; // 100px from the bottom to capture the center of the face
  
  await sharp(input)
    .extract({ left: Math.max(0, left), top: Math.max(0, top), width: size, height: size })
    .toFile('app/icon.png');
    
  console.log('Tighter crop done: app/icon.png');
}

run().catch(console.error);
