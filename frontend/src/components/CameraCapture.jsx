import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

/**
 * CameraCapture
 * ref.captureFrame() → returns { dataUrl, canvas } for face-api processing
 */
const CameraCapture = forwardRef(function CameraCapture({ onCapture, label = 'ถ่ายภาพยืนยันตัวตน' }, ref) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [captured, setCaptured] = useState(null); // dataUrl

  useImperativeHandle(ref, () => ({
    getVideo: () => videoRef.current,
    captureFrame,
  }));

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch {
      alert('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง');
    }
  };

  const stopCamera = () => streamRef.current?.getTracks().forEach((t) => t.stop());

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    return { dataUrl, canvas };
  }, []);

  const capture = useCallback(() => {
    const result = captureFrame();
    if (!result) return;
    setCaptured(result.dataUrl);
    stopCamera();
    onCapture?.(result);
  }, [captureFrame, onCapture]);

  const retake = () => {
    setCaptured(null);
    startCamera();
  };

  return (
    <div>
      <div className="camera-wrap">
        {!captured ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="camera-overlay">
              <div className="face-frame" />
            </div>
          </>
        ) : (
          <img src={captured} alt="captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        {!captured ? (
          <button className="btn btn-primary" onClick={capture} disabled={!ready}>
            📸 {label}
          </button>
        ) : (
          <button className="btn btn-outline" onClick={retake}>🔄 ถ่ายใหม่</button>
        )}
      </div>
    </div>
  );
});

export default CameraCapture;
