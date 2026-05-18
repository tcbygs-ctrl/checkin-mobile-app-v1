const router = require('express').Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');

// GET /api/attendance/history?days=60&page=1&limit=20
router.get('/history', auth, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 60, 60);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 60);
    const offset = (page - 1) * limit;

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceDate = since.toISOString().slice(0, 10);

    const { data, error, count } = await supabase
      .from('attendance')
      .select(
        `id, work_date, checkin_at, checkout_at,
         checkin_lat, checkin_long, checkout_lat, checkout_long,
         checkin_face_score, checkout_face_score,
         status, note,
         checkin_locations(name)`,
        { count: 'exact' }
      )
      .eq('employee_id', req.user.id)
      .gte('work_date', sinceDate)
      .order('work_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const records = (data || []).map((r) => {
      let work_hours = null;
      if (r.checkin_at && r.checkout_at) {
        const ms = new Date(r.checkout_at) - new Date(r.checkin_at);
        work_hours = parseFloat((ms / 3600000).toFixed(2));
      }
      return { ...r, work_hours };
    });

    res.json({
      data: records,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/summary?month=2024-05
router.get('/summary', auth, async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const start = `${month}-01`;
    const end = `${month}-31`;

    const { data, error } = await supabase
      .from('attendance')
      .select('work_date, checkin_at, checkout_at, status')
      .eq('employee_id', req.user.id)
      .gte('work_date', start)
      .lte('work_date', end)
      .order('work_date');

    if (error) throw error;

    const summary = {
      total_days: data.length,
      present: data.filter((r) => r.status === 'present').length,
      late: data.filter((r) => r.status === 'late').length,
      absent: data.filter((r) => r.status === 'absent').length,
      total_work_hours: 0,
    };

    data.forEach((r) => {
      if (r.checkin_at && r.checkout_at) {
        summary.total_work_hours += (new Date(r.checkout_at) - new Date(r.checkin_at)) / 3600000;
      }
    });
    summary.total_work_hours = parseFloat(summary.total_work_hours.toFixed(2));

    res.json({ month, summary, records: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
