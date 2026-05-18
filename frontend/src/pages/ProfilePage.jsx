import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import NavBar from '../components/NavBar';

export default function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [emp, setEmp] = useState(null);
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    api.get('/employees/me').then((r) => setEmp(r.data));
  }, []);

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm)
      return setPwMsg({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' });
    try {
      await api.post('/auth/change-password', {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      });
      setPwMsg({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำเร็จ' });
      setPwForm({ old_password: '', new_password: '', confirm: '' });
      setShowPw(false);
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.error || 'เกิดข้อผิดพลาด' });
    }
  };

  if (!emp) return <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>กำลังโหลด...</div>;

  return (
    <div className="page">
      <h1 className="page-title">โปรไฟล์</h1>

      {/* Avatar & name */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 12 }}>
          👤
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{emp.full_name}</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>รหัสพนักงาน: {emp.employee_id}</p>
        {emp.departments && <p style={{ color: 'var(--muted)', fontSize: 13 }}>{emp.departments.name}</p>}

        <div style={{ marginTop: 12 }}>
          {emp.face_registered
            ? <span className="badge badge-green">✅ ลงทะเบียนใบหน้าแล้ว</span>
            : <span className="badge badge-red">❌ ยังไม่ลงทะเบียนใบหน้า</span>
          }
        </div>
      </div>

      {/* Info */}
      <div className="card">
        {[
          { label: 'อีเมล', value: emp.email || '-' },
          { label: 'เบอร์โทร', value: emp.phone || '-' },
          { label: 'ตำแหน่ง', value: emp.position || '-' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>{item.label}</span>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Register face */}
      <button className="btn btn-outline" onClick={() => navigate('/register-face')} style={{ marginBottom: 8 }}>
        {emp.face_registered ? '🔄 ลงทะเบียนใบหน้าใหม่' : '📸 ลงทะเบียนใบหน้า'}
      </button>

      {/* Change password */}
      <button className="btn btn-outline" onClick={() => setShowPw(!showPw)} style={{ marginBottom: 8 }}>
        🔑 เปลี่ยนรหัสผ่าน
      </button>

      {showPw && (
        <div className="card">
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>เปลี่ยนรหัสผ่าน</h3>
          {pwMsg.text && (
            <div className={`alert alert-${pwMsg.type === 'error' ? 'error' : 'success'}`}>{pwMsg.text}</div>
          )}
          <form onSubmit={handlePwChange}>
            {[
              { key: 'old_password', label: 'รหัสผ่านเดิม' },
              { key: 'new_password', label: 'รหัสผ่านใหม่' },
              { key: 'confirm', label: 'ยืนยันรหัสผ่านใหม่' },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{f.label}</label>
                <input
                  className="input"
                  type="password"
                  value={pwForm[f.key]}
                  onChange={(e) => setPwForm({ ...pwForm, [f.key]: e.target.value })}
                  required
                />
              </div>
            ))}
            <button className="btn btn-primary" type="submit">บันทึก</button>
          </form>
        </div>
      )}

      {/* Logout */}
      <button
        className="btn btn-danger"
        onClick={() => { logout(); navigate('/login'); }}
        style={{ marginTop: 8 }}
      >
        ออกจากระบบ
      </button>

      <NavBar />
    </div>
  );
}
