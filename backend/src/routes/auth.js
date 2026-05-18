const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

// POST /api/auth/login
// Body: { employee_id: "03570806" }
// ไม่ต้องใช้ password — face scan เป็น auth หลัก
router.post('/login', async (req, res) => {
  const { employee_id } = req.body;

  if (!employee_id || !/^\d+$/.test(employee_id))
    return res.status(400).json({ error: 'กรุณากรอกรหัสพนักงาน (ตัวเลขเท่านั้น)' });

  const { data: emp, error } = await supabase
    .from('employees')
    .select('id, employee_id, full_name, is_active, face_registered, department_id')
    .eq('employee_id', employee_id)
    .single();

  if (error || !emp)
    return res.status(401).json({ error: 'ไม่พบรหัสพนักงานในระบบ' });

  if (!emp.is_active)
    return res.status(403).json({ error: 'บัญชีนี้ถูกระงับการใช้งาน' });

  const token = jwt.sign(
    { id: emp.id, employee_id: emp.employee_id, full_name: emp.full_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
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

// POST /api/auth/change-password (ใช้สำหรับ admin ตั้งค่า)
router.post('/change-password', require('../middleware/auth'), async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const hash = await bcrypt.hash(new_password, 10);
  await supabase.from('employees').update({ password_hash: hash }).eq('id', req.user.id);
  res.json({ message: 'Password updated successfully' });
});

module.exports = router;
