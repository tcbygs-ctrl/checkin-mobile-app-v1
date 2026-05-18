import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { LogIn, LogOut, Users, Clock, Loader2, RefreshCw, MapPin } from 'lucide-react';
import api from '../../services/api';
import AdminLayout from './AdminLayout';

const STATUS_MAP = {
  present: { label: 'มาทำงาน', cls: 'badge-green' },
  late:    { label: 'มาสาย',   cls: 'badge-yellow' },
  absent:  { label: 'ขาดงาน',  cls: 'badge-red' },
};

export default function AdminOverviewPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = () => {
    setLoading(true);
    api.get('/admin/attendance/today')
      .then(r => { setRecords(r.data); setLastRefresh(new Date()); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const present  = records.filter(r => r.checkin_at).length;
  const checkedOut = records.filter(r => r.checkout_at).length;
  const late     = records.filter(r => r.status === 'late').length;

  const fmt = iso => iso ? format(new Date(iso), 'HH:mm') : '--:--';

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>
          {format(new Date(), 'd MMMM yyyy', { locale: th })}
        </h2>
        <button onClick={load} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
          <RefreshCw size={14} /> รีเฟรช
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { icon: <Users size={18} />,  label: 'เข้างาน',  value: present,    color: 'var(--success)' },
          { icon: <LogOut size={18} />, label: 'ออกงาน',  value: checkedOut, color: 'var(--danger)' },
          { icon: <Clock size={18} />,  label: 'มาสาย',   value: late,       color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: 12, marginBottom: 0 }}>
            <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Employee list */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>รายชื่อพนักงานวันนี้</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>รีเฟรช {format(lastRefresh, 'HH:mm:ss')}</span>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <Loader2 size={28} className="spin" style={{ color: 'var(--muted)' }} />
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>ยังไม่มีข้อมูลวันนี้</div>
        ) : records.map(r => (
          <div key={r.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.employees?.full_name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.employees?.employee_id} · {r.employees?.departments?.name}</div>
              {r.checkin_locations?.name && (
                <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <MapPin size={10} /> {r.checkin_locations.name}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${STATUS_MAP[r.status]?.cls || 'badge-gray'}`} style={{ fontSize: 11 }}>
                {STATUS_MAP[r.status]?.label || r.status}
              </span>
              <div style={{ display: 'flex', gap: 10, marginTop: 6, justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 2 }}><LogIn size={9} />เข้า</div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 13 }}>{fmt(r.checkin_at)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 2 }}><LogOut size={9} />ออก</div>
                  <div style={{ fontWeight: 700, color: r.checkout_at ? 'var(--danger)' : 'var(--muted)', fontSize: 13 }}>{fmt(r.checkout_at)}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
