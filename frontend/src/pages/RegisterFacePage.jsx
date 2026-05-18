import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useFaceApi } from '../hooks/useFaceApi';
import CameraCapture from '../components/CameraCapture';
import NavBar from '../components/NavBar';

export default function RegisterFacePage() {
  const navigate = useNavigate();
  const { ready: faceReady, error: faceError, extractDescriptor } = useFaceApi();
  const cameraRef = useRef(null);
  const [capturedCanvas, setCapturedCanvas] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg] = useState('');

  const handleCapture = ({ canvas }) => setCapturedCanvas(canvas);

  const handleSubmit = async () => {
    if (!capturedCanvas) return;
    setStatus('loading');
    try {
      const descriptor = await extractDescriptor(capturedCanvas);
      if (!descriptor) {
        setMsg('ไม่พบใบหน้าในภาพ กรุณาถ่ายในที่มีแสงสว่างเพียงพอ');
        setStatus('error');
        return;
      }
      await api.post('/checkin/register-face', { descriptor });
      setStatus('success');
    } catch (err) {
      setMsg(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      setStatus('error');
    }
  };

  return (
    <div className="page">
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 15, marginBottom: 16 }}
      >
        ← กลับ
      </button>

      <h1 className="page-title">ลงทะเบียนใบหน้า</h1>

      {!faceReady && !faceError && (
        <div className="alert" style={{ background: '#eff6ff', color: 'var(--primary)' }}>
          ⏳ กำลังโหลดระบบจดจำใบหน้า...
        </div>
      )}
      {faceError && <div className="alert alert-error">⚠️ {faceError}</div>}

      {status !== 'success' ? (
        <div className="card">
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
            ถ่ายภาพใบหน้าในที่มีแสงสว่างเพียงพอ วางใบหน้าให้ตรงกลางกรอบ
          </p>

          {status === 'error' && <div className="alert alert-error">{msg}</div>}

          <CameraCapture ref={cameraRef} onCapture={handleCapture} label="ถ่ายภาพลงทะเบียน" />

          {capturedCanvas && status !== 'loading' && (
            <button
              className="btn btn-primary"
              style={{ marginTop: 12 }}
              onClick={handleSubmit}
              disabled={!faceReady}
            >
              💾 บันทึกใบหน้า
            </button>
          )}
          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>
              🔍 กำลังวิเคราะห์ใบหน้า...
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: 'var(--success)' }}>ลงทะเบียนสำเร็จ</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>ระบบบันทึกข้อมูลใบหน้าของคุณแล้ว</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>กลับหน้าหลัก</button>
        </div>
      )}

      <NavBar />
    </div>
  );
}
