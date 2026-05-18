import { useEffect, useState } from 'react';
import { UserPlus, Edit2, UserX, UserCheck, X, Check, Loader2 } from 'lucide-react';
import api from '../../services/api';
import AdminLayout from './AdminLayout';

const EMPTY = { employee_id: '', full_name: '', email: '', phone: '', position: '', department_id: '', role: 'employee' };

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode:'add'|'edit', data }
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/admin/employees'), api.get('/admin/departments')])
      .then(([e, d]) => { setEmployees(e.data); setDepartments(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY); setError(''); setModal({ mode: 'add' }); };
  const openEdit = (emp) => { setForm({ ...emp, department_id: emp.departments?.id || '' }); setError(''); setModal({ mode: 'edit', id: emp.id }); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (modal.mode === 'add') {
        await api.post('/admin/employees', form);
      } else {
        const { employee_id, ...updates } = form;
        await api.patch(`/admin/employees/${modal.id}`, updates);
      }
      setModal(null); load();
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (emp) => {
    await api.patch(`/admin/employees/${emp.id}`, { is_active: !emp.is_active });
    load();
  };

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>จัดการพนักงาน</h2>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 14px', gap: 6, fontSize: 13 }} onClick={openAdd}>
          <UserPlus size={16} /> เพิ่มพนักงาน
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={28} className="spin" style={{ color: 'var(--muted)' }} /></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {employees.map(emp => (
            <div key={emp.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {emp.full_name}
                  {emp.role === 'admin' && <span className="badge badge-green" style={{ fontSize: 10 }}>Admin</span>}
                  {!emp.is_active && <span className="badge badge-red" style={{ fontSize: 10 }}>ปิดใช้งาน</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{emp.employee_id} · {emp.departments?.name || '-'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{emp.position || '-'}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(emp)}
                  style={{ background: '#eff6ff', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: 'var(--primary)' }}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => toggleActive(emp)}
                  style={{ background: emp.is_active ? '#fee2e2' : '#dcfce7', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: emp.is_active ? 'var(--danger)' : 'var(--success)' }}>
                  {emp.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{modal.mode === 'add' ? 'เพิ่มพนักงานใหม่' : 'แก้ไขข้อมูล'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div style={{ display: 'grid', gap: 12 }}>
              {modal.mode === 'add' && (
                <Field label="รหัสพนักงาน *" type="tel" inputMode="numeric" value={form.employee_id} onChange={v => f('employee_id', v.replace(/\D/g,''))} placeholder="เช่น 03570806" />
              )}
              <Field label="ชื่อ-นามสกุล *" value={form.full_name} onChange={v => f('full_name', v)} />
              <Field label="อีเมล" type="email" value={form.email || ''} onChange={v => f('email', v)} />
              <Field label="เบอร์โทร" type="tel" value={form.phone || ''} onChange={v => f('phone', v)} />
              <Field label="ตำแหน่ง" value={form.position || ''} onChange={v => f('position', v)} />

              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>แผนก</label>
                <select className="input" value={form.department_id || ''} onChange={e => f('department_id', e.target.value)}>
                  <option value="">-- เลือกแผนก --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Role</label>
                <select className="input" value={form.role || 'employee'} onChange={e => f('role', e.target.value)}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <button className="btn btn-primary" style={{ marginTop: 20, gap: 8 }} onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Field({ label, value, onChange, type = 'text', ...rest }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{label}</label>
      <input className="input" type={type} value={value} onChange={e => onChange(e.target.value)} {...rest} />
    </div>
  );
}
