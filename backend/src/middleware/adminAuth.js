const supabase = require('../supabase');

module.exports = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { data } = await supabase
    .from('employees')
    .select('role')
    .eq('id', req.user.id)
    .single();
  if (data?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};
