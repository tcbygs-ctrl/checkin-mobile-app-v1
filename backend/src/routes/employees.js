const router = require('express').Router();
const bcrypt = require('bcryptjs');
const supabase = require('../supabase');
const auth = require('../middleware/auth');

// GET /api/employees/me
router.get('/me', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_id, full_name, email, phone, position, face_registered, departments(name, code)')
    .eq('id', req.user.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/employees - create employee (admin)
router.post('/', auth, async (req, res) => {
  try {
    const { employee_id, full_name, email, password, department_id, position, phone } = req.body;
    if (!employee_id || !full_name || !password)
      return res.status(400).json({ error: 'employee_id, full_name, password required' });

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('employees')
      .insert({ employee_id, full_name, email, password_hash, department_id, position, phone })
      .select('id, employee_id, full_name, email')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
