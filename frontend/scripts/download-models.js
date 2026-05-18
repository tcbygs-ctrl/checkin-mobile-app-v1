/**
 * Download face-api.js model weights into frontend/public/models/
 * Run once: node scripts/download-models.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, '../public/models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const FILES = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });

async function download(filename) {
  const url = `${BASE_URL}/${filename}`;
  const dest = path.join(MODELS_DIR, filename);
  if (fs.existsSync(dest)) { console.log(`  skip: ${filename}`); return; }
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${filename}`));
      res.pipe(file);
      file.on('finish', () => { file.close(); console.log(`  ✓ ${filename}`); resolve(); });
    }).on('error', (err) => { try { fs.unlinkSync(dest); } catch {} reject(err); });
  });
}

(async () => {
  console.log('Downloading face-api.js models → frontend/public/models/');
  for (const f of FILES) await download(f);
  console.log('\nDone!');
})().catch(console.error);
