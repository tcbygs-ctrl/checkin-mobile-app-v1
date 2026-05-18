import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { LogIn, LogOut, MapPin, Clock, ClipboardList, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import NavBar from '../components/NavBar';

const STATUS_MAP = {
  present: { label: 'มาทำงาน', cls: 'badge-green' },
  late:    { label: 'มาสาย',   cls: 'badge-yellow' },
  absent:  { label: 'ขาดงาน',  cls: 'badge-red' },
};

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [tab, setTab] = useState('list');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    setLoading(true);
    api.get(`/attendance/history?days=60&page=${page}&limit=20`)
      .then((r) => { setRecords(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    if (tab === 'summary') api.get(`/attendance/summary?month=${month}`).then((r) => setSummary(r.data));
  }, [tab, month]);

  const fmt = (iso) => iso ? format(parseISO(iso), 'HH:mm') : '--:--';
  const fmtDate = (d) => format(parseISO(d), 'd MMM', { locale: th });

  return (
    <div className="page">
      <h1 className="page-title">ประวัติการทำงาน</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'list',    label: 'รายการ 60 วัน', icon: <ClipboardList size={15} /> },
          { key: 'summary', label: 'สรุปรายเดือน',  icon: <BarChart2 size={15} /> },
        ].map((t) => (
          <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, padding: '10px 0', gap: 6 }} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <div className="card">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>กำลังโหลด...</p>
          ) : records.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>ไม่มีข้อมูล</p>
          ) : records.map((r) => (
            <div key={r.id} className="history-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{fmtDate(r.work_date)}</div>
                {r.checkin_locations?.name && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={11} /> {r.checkin_locations.name}
                  </div>
                )}
                {r.work_hours && (
                  <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={11} /> {r.work_hours} ชม.
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${STATUS_MAP[r.status]?.cls || 'badge-gray'}`}>
                  {STATUS_MAP[r.status]?.label || r.status}
                </span>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 2 }}><LogIn size={10} /> เข้า</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>{fmt(r.checkin_at)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 2 }}><LogOut size={10} /> ออก</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>{fmt(r.checkout_at)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {pagination && pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button className="btn btn-outline" style={{ width: 'auto', padding: '8px 12px' }}
                disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--muted)' }}>
                {page} / {pagination.pages}
              </span>
              <button className="btn btn-outline" style={{ width: 'auto', padding: '8px 12px' }}
                disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'summary' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <input type="month" className="input" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          {summary && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'วันที่ทำงาน',      value: summary.summary.total_days,       color: 'var(--primary)' },
                  { label: 'มาทำงาน',          value: summary.summary.present,          color: 'var(--success)' },
                  { label: 'มาสาย',            value: summary.summary.late,             color: 'var(--warning)' },
                  { label: 'รวมชั่วโมง',        value: `${summary.summary.total_work_hours}`, color: 'var(--text)' },
                ].map((s) => (
                  <div key={s.label} className="card" style={{ textAlign: 'center', marginBottom: 0 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                {summary.records.map((r) => (
                  <div key={r.work_date} className="history-row">
                    <div style={{ fontWeight: 500 }}>{fmtDate(r.work_date)}</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 13 }}>{fmt(r.checkin_at)} → {fmt(r.checkout_at)}</span>
                      <span className={`badge ${STATUS_MAP[r.status]?.cls || 'badge-gray'}`} style={{ fontSize: 11 }}>
                        {STATUS_MAP[r.status]?.label || '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <NavBar />
    </div>
  );
}
