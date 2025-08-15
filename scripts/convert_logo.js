import sharp from 'sharp';
import fs from 'fs';

const sourcePath = 'public/daorsforge-logo.jpg';
const outputPath = 'public/favicon.ico';

// Check if the source file exists
if (!fs.existsSync(sourcePath)) {
  console.error(`Source file not found: ${sourcePath}`);
  process.exit(1);
}

sharp(sourcePath)
  .resize(32, 32)
  .toFile(outputPath, (err, info) => {
    if (err) {
      console.error('Error converting image to favicon:', err);
    } else {
      console.log('Favicon created successfully!', info);
    }
  });
