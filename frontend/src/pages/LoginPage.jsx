import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('token_expiry');
    if (token && expiry && Date.now() < parseInt(expiry)) navigate('/');
  }, []);

  const handleInput = (e) => {
    setEmployeeId(e.target.value.replace(/\D/g, ''));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId) return;
    setError('');
    setLoading(true);
    try {
      await login(employeeId);
      localStorage.setItem('token_expiry', (Date.now() + 7 * 24 * 60 * 60 * 1000).toString());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'รหัสพนักงานไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24, background: 'var(--bg)'
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'var(--primary)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            boxShadow: '0 4px 24px rgba(37,99,235,0.25)'
          }}>
            <Fingerprint size={44} color="#fff" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>ระบบลงเวลาทำงาน</h1>
          <p style={{ color: 'var(--muted)', marginTop: 4, fontSize: 14 }}>Check-in / Check-out System</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, textAlign: 'center', color: 'var(--muted)' }}>
            กรอกรหัสพนักงานเพื่อเข้าสู่ระบบ
          </h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--muted)' }}>
                รหัสพนักงาน
              </label>
              <input
                className="input"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="เช่น 03570806"
                value={employeeId}
                onChange={handleInput}
                maxLength={20}
                required
                autoFocus
                style={{ fontSize: 26, textAlign: 'center', letterSpacing: 6, fontWeight: 700 }}
              />
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>
                กรอกตัวเลขเท่านั้น
              </p>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || employeeId.length === 0}
              style={{ fontSize: 16, padding: '14px', gap: 10 }}
            >
              <LogIn size={18} />
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 16 }}>
            ระบบจะจดจำการเข้าสู่ระบบ 7 วัน
          </p>
        </div>
      </div>
    </div>
  );
}
