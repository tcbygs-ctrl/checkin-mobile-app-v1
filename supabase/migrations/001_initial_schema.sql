-- =============================================
-- Check-in/Out System - Initial Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Table: departments
-- =============================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Table: employees
-- =============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(20) UNIQUE NOT NULL,  -- e.g. "03570806"
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE,
  department_id UUID REFERENCES departments(id),
  position VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  password_hash TEXT NOT NULL,
  face_registered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Table: face_descriptors
-- Face-api.js stores 128-dim Float32Array as JSON array
-- =============================================
CREATE TABLE IF NOT EXISTS face_descriptors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  descriptor JSONB NOT NULL,           -- [128 float values]
  image_url TEXT,                      -- optional: stored face image
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_face_descriptors_employee ON face_descriptors(employee_id);

-- =============================================
-- Table: checkin_locations
-- Admin-configured GPS locations where check-in is allowed
-- =============================================
CREATE TABLE IF NOT EXISTS checkin_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,  -- allowed radius
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Table: attendance
-- Check-in / Check-out records
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  location_id UUID REFERENCES checkin_locations(id),

  -- Check-in
  checkin_at TIMESTAMPTZ,
  checkin_lat DECIMAL(10, 8),
  checkin_long DECIMAL(11, 8),
  checkin_face_score DECIMAL(5, 4),     -- face match score (0-1)
  checkin_photo_url TEXT,               -- snapshot at check-in
  checkin_device TEXT,                  -- user-agent / device info

  -- Check-out
  checkout_at TIMESTAMPTZ,
  checkout_lat DECIMAL(10, 8),
  checkout_long DECIMAL(11, 8),
  checkout_face_score DECIMAL(5, 4),
  checkout_photo_url TEXT,

  -- Meta
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'present'  -- present | late | absent | holiday
    CHECK (status IN ('present','late','absent','holiday')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(employee_id, work_date)         -- one record per employee per day
);

CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(work_date);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, work_date);

-- =============================================
-- Table: work_schedule
-- Define normal working hours (for late detection)
-- =============================================
CREATE TABLE IF NOT EXISTS work_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL DEFAULT '08:00:00',
  end_time TIME NOT NULL DEFAULT '17:00:00',
  late_threshold_minutes INTEGER DEFAULT 15,  -- grace period
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Seed: Default work schedule
-- =============================================
INSERT INTO work_schedule (name, start_time, end_time, late_threshold_minutes, is_default)
VALUES ('มาตรฐาน 08:00-17:00', '08:00:00', '17:00:00', 15, TRUE);

-- =============================================
-- Seed: Sample check-in locations (5+)
-- =============================================
INSERT INTO checkin_locations (name, description, latitude, longitude, radius_meters) VALUES
  ('สำนักงานใหญ่ - อาคาร A', 'ชั้น 1 อาคารหลัก', 13.7563000, 100.5018000, 100),
  ('สำนักงานใหญ่ - อาคาร B', 'ชั้น 3 อาคาร B', 13.7570000, 100.5025000, 100),
  ('โรงงาน - นิคมอุตสาหกรรม', 'ประตูหน้า', 13.6900000, 100.6500000, 150),
  ('สาขา รามคำแหง', 'ชั้น 2 ห้อง 201', 13.7550000, 100.6700000, 80),
  ('สาขา สยาม', 'อาคาร Siam Tower ชั้น 5', 13.7455000, 100.5341000, 80),
  ('Warehouse - บางนา', 'คลังสินค้า Zone A', 13.6560000, 100.6890000, 200);

-- =============================================
-- Seed: Sample department
-- =============================================
INSERT INTO departments (name, code) VALUES
  ('ฝ่ายเทคโนโลยีสารสนเทศ', 'IT'),
  ('ฝ่ายทรัพยากรบุคคล', 'HR'),
  ('ฝ่ายการเงิน', 'FIN'),
  ('ฝ่ายปฏิบัติการ', 'OPS');

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_descriptors ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (backend uses service role key)
CREATE POLICY "service_role_all" ON employees FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON attendance FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON face_descriptors FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- Function: auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_face_descriptors_updated_at
  BEFORE UPDATE ON face_descriptors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_checkin_locations_updated_at
  BEFORE UPDATE ON checkin_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
