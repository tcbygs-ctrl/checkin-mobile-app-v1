import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import api from '../services/api';
import NavBar from '../components/NavBar';

export default function HomePage() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([api.get('/employees/me'), api.get('/checkin/today')])
      .then(([empRes, todayRes]) => {
        setEmployee(empRes.data);
        setToday(todayRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const statusMap = {
    present: { label: 'มาทำงาน', cls: 'badge-green' },
    late: { label: 'มาสาย', cls: 'badge-yellow' },
    absent: { label: 'ขาดงาน', cls: 'badge-red' },
  };

  const workHours = () => {
    if (!today?.checkin_at) return null;
    const end = today.checkout_at ? new Date(today.checkout_at) : new Date();
    const h = (end - new Date(today.checkin_at)) / 3600000;
    return h.toFixed(2);
  };

  if (loading) return <div className="page" style={{ textAlign: 'center', paddingTop: 100 }}>กำลังโหลด...</div>;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          {format(clock, 'EEEE d MMMM yyyy', { locale: th })}
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>สวัสดี, {employee?.full_name?.split(' ')[0]}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>รหัส: {employee?.employee_id} · {employee?.departments?.name}</p>
      </div>

      {/* Clock */}
      <div className="card" style={{ textAlign: 'center', background: 'var(--primary)', color: '#fff' }}>
        <div style={{ fontSize: 48, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: 2 }}>
          {format(clock, 'HH:mm:ss')}
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>เวลาปัจจุบัน</div>
      </div>

      {/* Today status */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>สถานะวันนี้</h2>
          {today?.status && (
            <span className={`badge ${statusMap[today.status]?.cls || 'badge-gray'}`}>
              {statusMap[today.status]?.label || today.status}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>เวลาเข้างาน</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: today?.checkin_at ? 'var(--success)' : 'var(--muted)' }}>
              {today?.checkin_at ? format(new Date(today.checkin_at), 'HH:mm') : '-- : --'}
            </div>
          </div>
          <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>เวลาออกงาน</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: today?.checkout_at ? 'var(--danger)' : 'var(--muted)' }}>
              {today?.checkout_at ? format(new Date(today.checkout_at), 'HH:mm') : '-- : --'}
            </div>
          </div>
        </div>

        {workHours() && (
          <div style={{ marginTop: 12, padding: 10, background: '#eff6ff', borderRadius: 8, textAlign: 'center' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>⏱ {workHours()} ชั่วโมง</span>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}> ที่ทำงานวันนี้</span>
          </div>
        )}

        {today?.checkin_locations?.name && (
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>
            📍 {today.checkin_locations.name}
          </div>
        )}
      </div>

      {/* Face registration warning */}
      {employee && !employee.face_registered && (
        <div className="alert alert-error" style={{ cursor: 'pointer' }} onClick={() => navigate('/register-face')}>
          ⚠️ ยังไม่ได้ลงทะเบียนใบหน้า — แตะที่นี่เพื่อลงทะเบียน
        </div>
      )}

      {/* Quick action */}
      <button className="btn btn-primary" style={{ fontSize: 16 }} onClick={() => navigate('/checkin')}>
        {!today?.checkin_at ? '🟢 เข้างาน' : !today?.checkout_at ? '🔴 ออกงาน' : '✅ ดูประวัติวันนี้'}
      </button>

      <NavBar />
    </div>
  );
}
