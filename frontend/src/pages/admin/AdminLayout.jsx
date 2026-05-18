import { useNavigate, useLocation } from 'react-router-dom';
import { Users, MapPin, ClipboardList, ArrowLeft, ShieldCheck } from 'lucide-react';

const tabs = [
  { path: '/admin',           label: 'ภาพรวม',    icon: ClipboardList },
  { path: '/admin/employees', label: 'พนักงาน',   icon: Users },
  { path: '/admin/locations', label: 'สถานที่',   icon: MapPin },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--primary)', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <ShieldCheck size={20} />
        <span style={{ fontWeight: 700, fontSize: 16 }}>Admin Dashboard</span>
      </div>

      {/* Tab nav */}
      <div style={{ background: '#fff', display: 'flex', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        {tabs.map(({ path, label, icon: Icon }) => (
          <button key={path} onClick={() => navigate(path)}
            style={{
              flex: 1, padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: pathname === path ? 'var(--primary)' : 'var(--muted)',
              borderBottom: pathname === path ? '2px solid var(--primary)' : '2px solid transparent',
              fontFamily: 'Sarabun, sans-serif',
            }}>
            <Icon size={18} strokeWidth={1.8} />
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 16px 32px', maxWidth: 600, margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
}
