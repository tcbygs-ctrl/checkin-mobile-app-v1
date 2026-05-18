import * as faceapi from 'face-api.js';
import { useState, useEffect } from 'react';

const MODELS_URL = '/models';
let loaded = false;

export function useFaceApi() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loaded) { setReady(true); return; }
    Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
    ])
      .then(() => { loaded = true; setReady(true); })
      .catch((e) => setError('โหลด face model ไม่สำเร็จ: ' + e.message));
  }, []);

  /**
   * Extract 128-dim descriptor from a canvas/video/img element or ImageData
   * @param {HTMLVideoElement|HTMLCanvasElement|HTMLImageElement} input
   * @returns {number[]|null}
   */
  const extractDescriptor = async (input) => {
    const detection = await faceapi
      .detectSingleFace(input)
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!detection) return null;
    return Array.from(detection.descriptor);
  };

  return { ready, error, extractDescriptor };
}
