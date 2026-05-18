import { useEffect, useState, lazy, Suspense } from 'react';
import { MapPin, Plus, Edit2, ToggleLeft, ToggleRight, X, Check, Loader2 } from 'lucide-react';
import api from '../../services/api';
import AdminLayout from './AdminLayout';

const LocationMap = lazy(() => import('../../components/LocationMap'));

const EMPTY = { name: '', description: '', latitude: '', longitude: '', radius_meters: 100 };

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState([]);

  const load = () => {
    setLoading(true);
    api.get('/admin/locations')
      .then(r => { setLocations(r.data); setPreview(r.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY); setError(''); setModal({ mode: 'add' }); };
  const openEdit = (loc) => { setForm({ ...loc }); setError(''); setModal({ mode: 'edit', id: loc.id }); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (modal.mode === 'add') {
        await api.post('/admin/locations', { ...form, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude), radius_meters: parseInt(form.radius_meters) });
      } else {
        await api.patch(`/admin/locations/${modal.id}`, { ...form, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude), radius_meters: parseInt(form.radius_meters) });
      }
      setModal(null); load();
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  const toggleActive = async (loc) => {
    await api.patch(`/admin/locations/${loc.id}`, { is_active: !loc.is_active });
    load();
  };

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>สถานที่ Check-in</h2>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 14px', gap: 6, fontSize: 13 }} onClick={openAdd}>
          <Plus size={16} /> เพิ่มสถานที่
        </button>
      </div>

      {/* Map preview */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <Suspense fallback={<div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={24} className="spin" /></div>}>
          <LocationMap locations={preview.filter(l => l.is_active)} isInZone={false} />
        </Suspense>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={28} className="spin" style={{ color: 'var(--muted)' }} /></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {locations.map(loc => (
            <div key={loc.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} color={loc.is_active ? 'var(--primary)' : 'var(--muted)'} />
                  {loc.name}
                  {!loc.is_active && <span className="badge badge-red" style={{ fontSize: 10 }}>ปิด</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {loc.latitude}, {loc.longitude} · รัศมี {loc.radius_meters} ม.
                </div>
                {loc.description && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{loc.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(loc)}
                  style={{ background: '#eff6ff', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: 'var(--primary)' }}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => toggleActive(loc)}
                  style={{ background: loc.is_active ? '#fee2e2' : '#dcfce7', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: loc.is_active ? 'var(--danger)' : 'var(--success)' }}>
                  {loc.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{modal.mode === 'add' ? 'เพิ่มสถานที่ใหม่' : 'แก้ไขสถานที่'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div style={{ display: 'grid', gap: 12 }}>
              <Field label="ชื่อสถานที่ *" value={form.name} onChange={v => f('name', v)} />
              <Field label="คำอธิบาย" value={form.description || ''} onChange={v => f('description', v)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Latitude *" type="number" step="any" value={form.latitude} onChange={v => f('latitude', v)} placeholder="13.7563" />
                <Field label="Longitude *" type="number" step="any" value={form.longitude} onChange={v => f('longitude', v)} placeholder="100.5018" />
              </div>
              <Field label="รัศมี (เมตร)" type="number" value={form.radius_meters} onChange={v => f('radius_meters', v)} />
            </div>

            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
              💡 หา Lat/Long: เปิด Google Maps → แตะจุดที่ต้องการ → คัดลอกพิกัด
            </p>

            <button className="btn btn-primary" style={{ marginTop: 16, gap: 8 }} onClick={handleSave} disabled={saving}>
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
