
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const publicDir = path.resolve(process.cwd(), 'public');
const imagesToFix = [
  'pwa-192x192.png',
  'pwa-512x512.png',
  'pwa-maskable-512x512.png',
];

async function fixImages() {
  for (const imageName of imagesToFix) {
    const imagePath = path.join(publicDir, imageName);
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const newImageBuffer = await sharp(imageBuffer).png().toBuffer();
      await fs.writeFile(imagePath, newImageBuffer);
      console.log(`Fixed ${imageName}`);
    } catch (error) {
      console.error(`Error fixing ${imageName}:`, error);
    }
  }
}

fixImages();
