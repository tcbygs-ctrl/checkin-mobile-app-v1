/**
 * Pure JS face descriptor comparison.
 * Descriptor extraction runs in the browser (face-api.js).
 * Backend only stores & compares 128-dim Float32 arrays.
 */

/**
 * Euclidean distance between two descriptor arrays
 */
function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

/**
 * Compare stored descriptor (from DB) with incoming descriptor (from browser)
 * @param {number[]} stored  - descriptor array from DB
 * @param {number[]} incoming - descriptor array sent by client
 * @returns {{ match: boolean, distance: number, score: number }}
 */
function compareDescriptors(stored, incoming) {
  const threshold = parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.5');
  const distance = euclideanDistance(stored, incoming);
  const score = Math.max(0, Math.min(1, 1 - distance));
  return { match: distance <= threshold, distance, score };
}

module.exports = { compareDescriptors };
