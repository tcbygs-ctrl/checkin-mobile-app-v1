-- Migration: Add admin role to employees
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'employee'
  CHECK (role IN ('employee', 'admin'));

-- Set first employee as admin (optional — adjust employee_id as needed)
-- UPDATE employees SET role = 'admin' WHERE employee_id = '00000001';
