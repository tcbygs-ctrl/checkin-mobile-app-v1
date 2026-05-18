const router = require('express').Router();
const bcrypt = require('bcryptjs');
const supabase = require('../supabase');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// All admin routes require auth + adminAuth
router.use(auth, adminAuth);

// =============================================
// Attendance Overview
// =============================================

// GET /api/admin/attendance/today - all employees today
router.get('/attendance/today', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id, work_date, checkin_at, checkout_at, status,
      checkin_lat, checkin_long, checkin_face_score,
      checkout_face_score,
      employees(id, employee_id, full_name, department_id, departments(name)),
      checkin_locations(name)
    `)
    .eq('work_date', today)
    .order('checkin_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/admin/attendance?date=2024-05-01&employee_id=uuid
router.get('/attendance', async (req, res) => {
  const { date, employee_id, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from('attendance')
    .select(`
      id, work_date, checkin_at, checkout_at, status, note,
      employees(employee_id, full_name),
      checkin_locations(name)
    `, { count: 'exact' })
    .order('work_date', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (date) query = query.eq('work_date', date);
  if (employee_id) query = query.eq('employee_id', employee_id);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) });
});

// PATCH /api/admin/attendance/:id - edit note/status
router.patch('/attendance/:id', async (req, res) => {
  const { status, note } = req.body;
  const { data, error } = await supabase
    .from('attendance')
    .update({ status, note })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// =============================================
// Employee Management
// =============================================

// GET /api/admin/employees
router.get('/employees', async (req, res) => {
  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_id, full_name, email, phone, position, role, is_active, face_registered, departments(name, code)')
    .order('employee_id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/admin/employees
router.post('/employees', async (req, res) => {
  const { employee_id, full_name, email, password, department_id, position, phone, role } = req.body;
  if (!employee_id || !full_name) return res.status(400).json({ error: 'employee_id and full_name required' });
  if (!/^\d+$/.test(employee_id)) return res.status(400).json({ error: 'employee_id must be numeric' });

  const password_hash = await bcrypt.hash(password || 'nopassword', 10);
  const { data, error } = await supabase
    .from('employees')
    .insert({ employee_id, full_name, email, password_hash, department_id, position, phone, role: role || 'employee' })
    .select('id, employee_id, full_name, email, role')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/admin/employees/:id
router.patch('/employees/:id', async (req, res) => {
  const { full_name, email, phone, position, department_id, role, is_active } = req.body;
  const updates = {};
  if (full_name    !== undefined) updates.full_name    = full_name;
  if (email        !== undefined) updates.email        = email;
  if (phone        !== undefined) updates.phone        = phone;
  if (position     !== undefined) updates.position     = position;
  if (department_id!== undefined) updates.department_id= department_id;
  if (role         !== undefined) updates.role         = role;
  if (is_active    !== undefined) updates.is_active    = is_active;

  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/admin/employees/:id (soft delete)
router.delete('/employees/:id', async (req, res) => {
  const { error } = await supabase
    .from('employees')
    .update({ is_active: false })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Employee deactivated' });
});

// =============================================
// Location Management
// =============================================

// GET /api/admin/locations
router.get('/locations', async (req, res) => {
  const { data, error } = await supabase
    .from('checkin_locations')
    .select('*')
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/admin/locations
router.post('/locations', async (req, res) => {
  const { name, description, latitude, longitude, radius_meters } = req.body;
  if (!name || latitude == null || longitude == null)
    return res.status(400).json({ error: 'name, latitude, longitude required' });
  const { data, error } = await supabase
    .from('checkin_locations')
    .insert({ name, description, latitude, longitude, radius_meters: radius_meters || 100 })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/admin/locations/:id
router.patch('/locations/:id', async (req, res) => {
  const { name, description, latitude, longitude, radius_meters, is_active } = req.body;
  const updates = {};
  if (name         !== undefined) updates.name          = name;
  if (description  !== undefined) updates.description   = description;
  if (latitude     !== undefined) updates.latitude      = latitude;
  if (longitude    !== undefined) updates.longitude     = longitude;
  if (radius_meters!== undefined) updates.radius_meters = radius_meters;
  if (is_active    !== undefined) updates.is_active     = is_active;

  const { data, error } = await supabase
    .from('checkin_locations')
    .update(updates).eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/admin/locations/:id
router.delete('/locations/:id', async (req, res) => {
  const { error } = await supabase
    .from('checkin_locations')
    .update({ is_active: false })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Location deactivated' });
});

// GET /api/admin/departments
router.get('/departments', async (req, res) => {
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
