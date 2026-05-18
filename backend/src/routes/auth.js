const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

// POST /api/auth/login
// Body: { employee_id: "03570806", password: "..." }
router.post('/login', async (req, res) => {
  const { employee_id, password } = req.body;

  if (!employee_id || !password)
    return res.status(400).json({ error: 'employee_id and password required' });

  const { data: emp, error } = await supabase
    .from('employees')
    .select('id, employee_id, full_name, password_hash, is_active, face_registered, department_id')
    .eq('employee_id', employee_id)
    .single();

  if (error || !emp) return res.status(401).json({ error: 'Invalid credentials' });
  if (!emp.is_active) return res.status(403).json({ error: 'Account disabled' });

  const valid = await bcrypt.compare(password, emp.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: emp.id, employee_id: emp.employee_id, full_name: emp.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({
    token,
    employee: {
      id: emp.id,
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      face_registered: emp.face_registered,
    },
  });
});

// POST /api/auth/change-password
router.post('/change-password', require('../middleware/auth'), async (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password)
    return res.status(400).json({ error: 'old_password and new_password required' });
  if (new_password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const { data: emp } = await supabase
    .from('employees')
    .select('password_hash')
    .eq('id', req.user.id)
    .single();

  const valid = await bcrypt.compare(old_password, emp.password_hash);
  if (!valid) return res.status(401).json({ error: 'Old password incorrect' });

  const hash = await bcrypt.hash(new_password, 10);
  await supabase.from('employees').update({ password_hash: hash }).eq('id', req.user.id);
  res.json({ message: 'Password changed successfully' });
});

module.exports = router;
