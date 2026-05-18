const router = require('express').Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');

// GET /api/locations - list active locations
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('checkin_locations')
    .select('id, name, description, latitude, longitude, radius_meters')
    .eq('is_active', true)
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/locations - create (admin only — add role check as needed)
router.post('/', auth, async (req, res) => {
  const { name, description, latitude, longitude, radius_meters } = req.body;
  if (!name || latitude == null || longitude == null)
    return res.status(400).json({ error: 'name, latitude, longitude required' });

  const { data, error } = await supabase
    .from('checkin_locations')
    .insert({ name, description, latitude, longitude, radius_meters: radius_meters || 100 })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/locations/:id
router.patch('/:id', auth, async (req, res) => {
  const { name, description, latitude, longitude, radius_meters, is_active } = req.body;
  const { data, error } = await supabase
    .from('checkin_locations')
    .update({ name, description, latitude, longitude, radius_meters, is_active })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
