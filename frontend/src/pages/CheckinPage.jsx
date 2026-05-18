import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import { useFaceApi } from '../hooks/useFaceApi';
import CameraCapture from '../components/CameraCapture';
import NavBar from '../components/NavBar';

export default function CheckinPage() {
  const navigate = useNavigate();
  const { getLocation, loading: locLoading } = useGeolocation();
  const { ready: faceReady, error: faceError, extractDescriptor } = useFaceApi();
  const cameraRef = useRef(null);

  const [todayRecord, setTodayRecord] = useState(null);
  const [step, setStep] = useState('idle'); // idle | camera | processing | done | error
  const [mode, setMode] = useState(null);   // 'in' | 'out'
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [capturedCanvas, setCapturedCanvas] = useState(null);

  useEffect(() => {
    api.get('/checkin/today').then((r) => setTodayRecord(r.data));
  }, []);

  const startCheckin = (m) => {
    setMode(m);
    setCapturedCanvas(null);
    setErrorMsg('');
    setResult(null);
    setStep('camera');
  };

  const handleCapture = ({ canvas }) => setCapturedCanvas(canvas);

  const handleSubmit = async () => {
    if (!capturedCanvas) return;
    setStep('processing');
    try {
      // Extract face descriptor in browser
      const descriptor = await extractDescriptor(capturedCanvas);
      if (!descriptor) {
        setErrorMsg('ไม่พบใบหน้าในภาพ กรุณาถ่ายใหม่');
        setStep('error');
        return;
      }

      const loc = await getLocation();
      const { data } = await api.post(`/checkin/${mode}`, {
        descriptor,
        lat: loc.lat,
        lng: loc.lng,
      });
      setResult(data);
      setStep('done');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      setStep('error');
    }
  };

  const reset = () => {
    setStep('idle');
    setCapturedCanvas(null);
    api.get('/checkin/today').then((r) => setTodayRecord(r.data));
  };

  const canCheckin = !todayRecord?.checkin_at;
  const canCheckout = todayRecord?.checkin_at && !todayRecord?.checkout_at;

  return (
    <div className="page">
      <h1 className="page-title">เข้า-ออกงาน</h1>

      {/* Face model loading status */}
      {!faceReady && !faceError && (
        <div className="alert" style={{ background: '#eff6ff', color: 'var(--primary)' }}>
          ⏳ กำลังโหลดระบบจดจำใบหน้า...
        </div>
      )}
      {faceError && <div className="alert alert-error">⚠️ {faceError}</div>}

      {step === 'idle' && (
        <>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              ระบบจะตรวจสอบ <strong>ใบหน้า</strong> และ <strong>ตำแหน่ง GPS</strong> ของคุณ
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                className="btn btn-success"
                disabled={!canCheckin || !faceReady}
                onClick={() => startCheckin('in')}
                style={{ flexDirection: 'column', padding: '20px 12px', gap: 8 }}
              >
                <span style={{ fontSize: 32 }}>🟢</span>
                <span>เข้างาน</span>
                {!canCheckin && <span style={{ fontSize: 11, opacity: .7 }}>เข้างานแล้ว</span>}
              </button>
              <button
                className="btn btn-danger"
                disabled={!canCheckout || !faceReady}
                onClick={() => startCheckin('out')}
                style={{ flexDirection: 'column', padding: '20px 12px', gap: 8 }}
              >
                <span style={{ fontSize: 32 }}>🔴</span>
                <span>ออกงาน</span>
                {!canCheckout && !canCheckin && <span style={{ fontSize: 11, opacity: .7 }}>ออกงานแล้ว</span>}
                {canCheckin && <span style={{ fontSize: 11, opacity: .7 }}>ยังไม่เข้างาน</span>}
              </button>
            </div>
          </div>

          {todayRecord && (
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--muted)' }}>สถานะวันนี้</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>เข้างาน</div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 18 }}>
                    {todayRecord.checkin_at
                      ? new Date(todayRecord.checkin_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>ออกงาน</div>
                  <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 18 }}>
                    {todayRecord.checkout_at
                      ? new Date(todayRecord.checkout_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {step === 'camera' && (
        <div className="card">
          <h3 style={{ marginBottom: 12, fontWeight: 600 }}>
            {mode === 'in' ? '🟢 เข้างาน' : '🔴 ออกงาน'} — ถ่ายภาพใบหน้า
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            วางใบหน้าให้อยู่ในกรอบวงกลม แล้วกดถ่ายภาพ
          </p>
          <CameraCapture
            ref={cameraRef}
            onCapture={handleCapture}
            label={mode === 'in' ? 'ถ่ายเพื่อเข้างาน' : 'ถ่ายเพื่อออกงาน'}
          />
          {capturedCanvas && (
            <button
              className="btn btn-primary"
              style={{ marginTop: 12 }}
              onClick={handleSubmit}
              disabled={locLoading || !faceReady}
            >
              {locLoading ? 'กำลังตรวจสอบตำแหน่ง...' : '✅ ยืนยัน'}
            </button>
          )}
          <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={reset}>ยกเลิก</button>
        </div>
      )}

      {step === 'processing' && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <p style={{ fontWeight: 600 }}>กำลังตรวจสอบ...</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>กำลังวิเคราะห์ใบหน้าและตรวจสอบตำแหน่ง</p>
        </div>
      )}

      {step === 'done' && result && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{mode === 'in' ? '✅' : '👋'}</div>
          <h2 style={{ color: mode === 'in' ? 'var(--success)' : 'var(--danger)', marginBottom: 8 }}>
            {result.message}
          </h2>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, margin: '16px 0', textAlign: 'left' }}>
            <Row label="เวลา" value={new Date(mode === 'in' ? result.checkin_at : result.checkout_at).toLocaleTimeString('th-TH')} />
            <Row label="สถานที่" value={result.location} />
            <Row label="ความแม่นยำใบหน้า" value={`${(result.face_score * 100).toFixed(1)}%`} />
            {result.work_hours && <Row label="รวมชั่วโมงทำงาน" value={`${result.work_hours} ชม.`} />}
          </div>
          <button className="btn btn-outline" onClick={reset}>กลับ</button>
        </div>
      )}

      {step === 'error' && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h2 style={{ color: 'var(--danger)', marginBottom: 8 }}>ไม่สำเร็จ</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>{errorMsg}</p>
          <button className="btn btn-primary" onClick={() => startCheckin(mode)}>ลองใหม่</button>
          <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={reset}>ยกเลิก</button>
        </div>
      )}

      <NavBar />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: 13 }}>{value}</span>
    </div>
  );
}
