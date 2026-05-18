import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { LogIn, LogOut, MapPin, Clock, AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import NavBar from '../components/NavBar';

const LocationMap = lazy(() => import('../components/LocationMap'));

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000, r = x => x * Math.PI / 180;
  const dLat = r(lat2 - lat1), dLon = r(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function HomePage() {
  const navigate = useNavigate();
  const { getLocation } = useGeolocation();
  const [employee, setEmployee] = useState(null);
  const [today, setToday] = useState(null);
  const [locations, setLocations] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [isInZone, setIsInZone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/employees/me'),
      api.get('/checkin/today'),
      api.get('/locations'),
    ]).then(([empRes, todayRes, locRes]) => {
      setEmployee(empRes.data);
      setToday(todayRes.data);
      setLocations(locRes.data || []);
    }).finally(() => setLoading(false));

    // Get GPS position
    getLocation().then(pos => {
      setUserPos(pos);
    }).catch(() => {});
  }, []);

  // Recheck zone when position or locations change
  useEffect(() => {
    if (!userPos || !locations.length) return;
    const inZone = locations.some(loc =>
      haversine(userPos.lat, userPos.lng, parseFloat(loc.latitude), parseFloat(loc.longitude)) <= loc.radius_meters
    );
    setIsInZone(inZone);
  }, [userPos, locations]);

  const statusMap = {
    present: { label: 'มาทำงาน', cls: 'badge-green' },
    late:    { label: 'มาสาย',   cls: 'badge-yellow' },
    absent:  { label: 'ขาดงาน',  cls: 'badge-red' },
  };

  const workHours = () => {
    if (!today?.checkin_at) return null;
    const end = today.checkout_at ? new Date(today.checkout_at) : new Date();
    return ((end - new Date(today.checkin_at)) / 3600000).toFixed(2);
  };

  if (loading) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 100, color: 'var(--muted)' }}>
      <Loader2 size={32} className="spin" style={{ margin: '0 auto' }} />
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          {format(clock, 'EEEE d MMMM yyyy', { locale: th })}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>สวัสดี, {employee?.full_name?.split(' ')[0]}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>รหัส: {employee?.employee_id} · {employee?.departments?.name}</p>
          </div>
          {employee?.role === 'admin' && (
            <button onClick={() => navigate('/admin')}
              style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={14} /> Admin
            </button>
          )}
        </div>
      </div>

      {/* Clock */}
      <div className="card" style={{ textAlign: 'center', background: 'var(--primary)', color: '#fff' }}>
        <div style={{ fontSize: 48, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: 2 }}>
          {format(clock, 'HH:mm:ss')}
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>เวลาปัจจุบัน</div>
      </div>

      {/* Map */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={15} color="var(--primary)" /> ตำแหน่งปัจจุบัน
          </span>
          {!userPos && (
            <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Loader2 size={12} className="spin" /> กำลังรับตำแหน่ง...
            </span>
          )}
        </div>
        <Suspense fallback={
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            <Loader2 size={24} className="spin" />
          </div>
        }>
          <LocationMap
            userLat={userPos?.lat}
            userLng={userPos?.lng}
            locations={locations}
            isInZone={isInZone}
          />
        </Suspense>
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
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <LogIn size={12} /> เวลาเข้างาน
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: today?.checkin_at ? 'var(--success)' : 'var(--muted)' }}>
              {today?.checkin_at ? format(new Date(today.checkin_at), 'HH:mm') : '--:--'}
            </div>
          </div>
          <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <LogOut size={12} /> เวลาออกงาน
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: today?.checkout_at ? 'var(--danger)' : 'var(--muted)' }}>
              {today?.checkout_at ? format(new Date(today.checkout_at), 'HH:mm') : '--:--'}
            </div>
          </div>
        </div>
        {workHours() && (
          <div style={{ marginTop: 12, padding: 10, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Clock size={14} color="var(--primary)" />
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{workHours()} ชั่วโมง</span>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>ที่ทำงานวันนี้</span>
          </div>
        )}
        {today?.checkin_locations?.name && (
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={13} /> {today.checkin_locations.name}
          </div>
        )}
      </div>

      {employee && !employee.face_registered && (
        <div className="alert alert-error" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigate('/register-face')}>
          <AlertTriangle size={16} /> ยังไม่ได้ลงทะเบียนใบหน้า — แตะที่นี่เพื่อลงทะเบียน
        </div>
      )}

      <button className="btn btn-primary" style={{ fontSize: 16, gap: 10 }} onClick={() => navigate('/checkin')}>
        {!today?.checkin_at ? <><LogIn size={20} /> เข้างาน</> : !today?.checkout_at ? <><LogOut size={20} /> ออกงาน</> : <><CheckCircle2 size={20} /> ดูประวัติวันนี้</>}
      </button>

      <NavBar />
    </div>
  );
}
