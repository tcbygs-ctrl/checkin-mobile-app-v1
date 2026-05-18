const router = require('express').Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');
const { compareDescriptors } = require('../services/faceService');
const { findMatchingLocation } = require('../services/locationService');

// POST /api/checkin/in
// Body: { descriptor: number[128], lat, lng }
router.post('/in', auth, async (req, res) => {
  try {
    const { descriptor, lat, lng } = req.body;
    if (!descriptor || !Array.isArray(descriptor) || lat == null || lng == null)
      return res.status(400).json({ error: 'descriptor (array), lat, lng required' });

    const today = new Date().toISOString().slice(0, 10);

    const { data: existing } = await supabase
      .from('attendance')
      .select('id, checkin_at, checkout_at')
      .eq('employee_id', req.user.id)
      .eq('work_date', today)
      .single();

    if (existing?.checkin_at && !existing?.checkout_at)
      return res.status(409).json({ error: 'Already checked in. Please check out first.' });

    // Verify location
    const locResult = await findMatchingLocation(parseFloat(lat), parseFloat(lng));
    if (!locResult)
      return res.status(400).json({ error: 'You are not at an authorized check-in location' });

    // Verify face
    const { data: faceData } = await supabase
      .from('face_descriptors')
      .select('descriptor')
      .eq('employee_id', req.user.id)
      .single();

    if (!faceData)
      return res.status(400).json({ error: 'Face not registered. Please contact HR.' });

    const { match, score } = compareDescriptors(faceData.descriptor, descriptor);
    if (!match)
      return res.status(401).json({ error: 'Face does not match. Please try again.', score });

    // Determine late status
    const { data: schedule } = await supabase
      .from('work_schedule')
      .select('*')
      .eq('is_default', true)
      .single();

    const now = new Date();
    let status = 'present';
    if (schedule) {
      const [sh, sm] = schedule.start_time.split(':').map(Number);
      const scheduleStart = new Date(now);
      scheduleStart.setHours(sh, sm + (schedule.late_threshold_minutes || 0), 0, 0);
      if (now > scheduleStart) status = 'late';
    }

    const { data: record, error: upsertErr } = await supabase
      .from('attendance')
      .upsert(
        {
          employee_id: req.user.id,
          location_id: locResult.location.id,
          checkin_at: now.toISOString(),
          checkin_lat: parseFloat(lat),
          checkin_long: parseFloat(lng),
          checkin_face_score: parseFloat(score.toFixed(4)),
          checkin_device: req.headers['user-agent'],
          work_date: today,
          status,
        },
        { onConflict: 'employee_id,work_date' }
      )
      .select()
      .single();

    if (upsertErr) throw upsertErr;

    res.json({
      message: 'Check-in successful',
      checkin_at: record.checkin_at,
      location: locResult.location.name,
      distance_m: locResult.distance,
      face_score: score.toFixed(4),
      status,
    });
  } catch (err) {
    console.error('checkin/in error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkin/out
// Body: { descriptor: number[128], lat, lng }
router.post('/out', auth, async (req, res) => {
  try {
    const { descriptor, lat, lng } = req.body;
    if (!descriptor || !Array.isArray(descriptor) || lat == null || lng == null)
      return res.status(400).json({ error: 'descriptor (array), lat, lng required' });

    const today = new Date().toISOString().slice(0, 10);

    const { data: record } = await supabase
      .from('attendance')
      .select('id, checkin_at, checkout_at')
      .eq('employee_id', req.user.id)
      .eq('work_date', today)
      .single();

    if (!record?.checkin_at)
      return res.status(409).json({ error: 'You have not checked in today' });
    if (record?.checkout_at)
      return res.status(409).json({ error: 'Already checked out today' });

    const locResult = await findMatchingLocation(parseFloat(lat), parseFloat(lng));
    if (!locResult)
      return res.status(400).json({ error: 'You are not at an authorized check-in location' });

    const { data: faceData } = await supabase
      .from('face_descriptors')
      .select('descriptor')
      .eq('employee_id', req.user.id)
      .single();

    if (!faceData)
      return res.status(400).json({ error: 'Face not registered.' });

    const { match, score } = compareDescriptors(faceData.descriptor, descriptor);
    if (!match)
      return res.status(401).json({ error: 'Face does not match. Please try again.', score });

    const now = new Date();
    const { data: updated, error } = await supabase
      .from('attendance')
      .update({
        checkout_at: now.toISOString(),
        checkout_lat: parseFloat(lat),
        checkout_long: parseFloat(lng),
        checkout_face_score: parseFloat(score.toFixed(4)),
      })
      .eq('id', record.id)
      .select()
      .single();

    if (error) throw error;

    const workHours = ((now - new Date(record.checkin_at)) / 3600000).toFixed(2);

    res.json({
      message: 'Check-out successful',
      checkout_at: updated.checkout_at,
      location: locResult.location.name,
      face_score: score.toFixed(4),
      work_hours: workHours,
    });
  } catch (err) {
    console.error('checkin/out error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkin/register-face
// Body: { descriptor: number[128] }
router.post('/register-face', auth, async (req, res) => {
  try {
    const { descriptor } = req.body;
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128)
      return res.status(400).json({ error: 'descriptor must be array of 128 numbers' });

    await supabase
      .from('face_descriptors')
      .upsert(
        { employee_id: req.user.id, descriptor },
        { onConflict: 'employee_id' }
      );

    await supabase
      .from('employees')
      .update({ face_registered: true })
      .eq('id', req.user.id);

    res.json({ message: 'Face registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/checkin/today
router.get('/today', auth, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('attendance')
    .select('*, checkin_locations(name)')
    .eq('employee_id', req.user.id)
    .eq('work_date', today)
    .single();
  res.json(data || null);
});

module.exports = router;
