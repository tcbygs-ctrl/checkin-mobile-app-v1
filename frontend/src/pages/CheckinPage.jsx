import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Camera, CheckCircle, XCircle, Loader2, MapPin, Clock, Scan, AlertTriangle, RotateCcw } from 'lucide-react';
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
  const [step, setStep] = useState('idle');
  const [mode, setMode] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [capturedCanvas, setCapturedCanvas] = useState(null);

  useEffect(() => {
    api.get('/checkin/today').then((r) => setTodayRecord(r.data));
  }, []);

  const startCheckin = (m) => { setMode(m); setCapturedCanvas(null); setErrorMsg(''); setResult(null); setStep('camera'); };
  const handleCapture = ({ canvas }) => setCapturedCanvas(canvas);

  const handleSubmit = async () => {
    if (!capturedCanvas) return;
    setStep('processing');
    try {
      const descriptor = await extractDescriptor(capturedCanvas);
      if (!descriptor) { setErrorMsg('ไม่พบใบหน้าในภาพ กรุณาถ่ายใหม่'); setStep('error'); return; }
      const loc = await getLocation();
      const { data } = await api.post(`/checkin/${mode}`, { descriptor, lat: loc.lat, lng: loc.lng });
      setResult(data);
      setStep('done');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      setStep('error');
    }
  };

  const reset = () => { setStep('idle'); setCapturedCanvas(null); api.get('/checkin/today').then((r) => setTodayRecord(r.data)); };
  const canCheckin = !todayRecord?.checkin_at;
  const canCheckout = todayRecord?.checkin_at && !todayRecord?.checkout_at;

  return (
    <div className="page">
      <h1 className="page-title">เข้า-ออกงาน</h1>

      {!faceReady && !faceError && (
        <div className="alert" style={{ background: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 size={16} className="spin" /> กำลังโหลดระบบจดจำใบหน้า...
        </div>
      )}
      {faceError && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} /> {faceError}
        </div>
      )}

      {step === 'idle' && (
        <>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              ระบบจะตรวจสอบ <strong>ใบหน้า</strong> และ <strong>ตำแหน่ง GPS</strong> ของคุณ
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button className="btn btn-success" disabled={!canCheckin || !faceReady}
                onClick={() => startCheckin('in')}
                style={{ flexDirection: 'column', padding: '20px 12px', gap: 10 }}>
                <LogIn size={32} strokeWidth={1.5} />
                <span style={{ fontSize: 15, fontWeight: 600 }}>เข้างาน</span>
                {!canCheckin && <span style={{ fontSize: 11, opacity: .7 }}>เข้างานแล้ว</span>}
              </button>
              <button className="btn btn-danger" disabled={!canCheckout || !faceReady}
                onClick={() => startCheckin('out')}
                style={{ flexDirection: 'column', padding: '20px 12px', gap: 10 }}>
                <LogOut size={32} strokeWidth={1.5} />
                <span style={{ fontSize: 15, fontWeight: 600 }}>ออกงาน</span>
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
                  <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}><LogIn size={12} /> เข้างาน</div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 20 }}>
                    {todayRecord.checkin_at ? new Date(todayRecord.checkin_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}><LogOut size={12} /> ออกงาน</div>
                  <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 20 }}>
                    {todayRecord.checkout_at ? new Date(todayRecord.checkout_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {step === 'camera' && (
        <div className="card">
          <h3 style={{ marginBottom: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            {mode === 'in' ? <LogIn size={18} color="var(--success)" /> : <LogOut size={18} color="var(--danger)" />}
            {mode === 'in' ? 'เข้างาน' : 'ออกงาน'} — ถ่ายภาพใบหน้า
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>วางใบหน้าให้อยู่ในกรอบวงกลม แล้วกดถ่ายภาพ</p>
          <CameraCapture ref={cameraRef} onCapture={handleCapture}
            label={mode === 'in' ? 'ถ่ายเพื่อเข้างาน' : 'ถ่ายเพื่อออกงาน'} />
          {capturedCanvas && (
            <button className="btn btn-primary" style={{ marginTop: 12, gap: 8 }} onClick={handleSubmit} disabled={locLoading || !faceReady}>
              <CheckCircle size={18} />
              {locLoading ? 'กำลังตรวจสอบตำแหน่ง...' : 'ยืนยัน'}
            </button>
          )}
          <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={reset}>ยกเลิก</button>
        </div>
      )}

      {step === 'processing' && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Scan size={56} color="var(--primary)" style={{ margin: '0 auto 16px' }} strokeWidth={1.2} />
          <p style={{ fontWeight: 600, fontSize: 16 }}>กำลังตรวจสอบ...</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>วิเคราะห์ใบหน้าและตรวจสอบตำแหน่ง</p>
        </div>
      )}

      {step === 'done' && result && (
        <div className="card" style={{ textAlign: 'center' }}>
          <CheckCircle size={72} color={mode === 'in' ? 'var(--success)' : 'var(--danger)'}
            style={{ margin: '0 auto 16px' }} strokeWidth={1.2} />
          <h2 style={{ color: mode === 'in' ? 'var(--success)' : 'var(--danger)', marginBottom: 8 }}>{result.message}</h2>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, margin: '16px 0', textAlign: 'left' }}>
            <Row icon={<Clock size={13} />} label="เวลา"
              value={new Date(mode === 'in' ? result.checkin_at : result.checkout_at).toLocaleTimeString('th-TH')} />
            <Row icon={<MapPin size={13} />} label="สถานที่" value={result.location} />
            <Row icon={<Scan size={13} />} label="ความแม่นยำใบหน้า" value={`${(result.face_score * 100).toFixed(1)}%`} />
            {result.work_hours && <Row icon={<Clock size={13} />} label="รวมชั่วโมงทำงาน" value={`${result.work_hours} ชม.`} />}
          </div>
          <button className="btn btn-outline" onClick={reset}>กลับ</button>
        </div>
      )}

      {step === 'error' && (
        <div className="card" style={{ textAlign: 'center' }}>
          <XCircle size={72} color="var(--danger)" style={{ margin: '0 auto 16px' }} strokeWidth={1.2} />
          <h2 style={{ color: 'var(--danger)', marginBottom: 8 }}>ไม่สำเร็จ</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>{errorMsg}</p>
          <button className="btn btn-primary" style={{ gap: 8 }} onClick={() => startCheckin(mode)}>
            <RotateCcw size={16} /> ลองใหม่
          </button>
          <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={reset}>ยกเลิก</button>
        </div>
      )}

      <NavBar />
    </div>
  );
}

function Row({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
      <span style={{ color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{label}</span>
      <span style={{ fontWeight: 600, fontSize: 13 }}>{value}</span>
    </div>
  );
}
