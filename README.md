# ระบบลงเวลาทำงาน (Check-in / Check-out System)

ระบบลงเวลาทำงานด้วยการสแกนใบหน้า + GPS ตรวจสอบตำแหน่ง พัฒนาด้วย Node.js + Supabase

## Features
- เข้า/ออกงานด้วยการสแกนใบหน้า (face-api.js)
- ตรวจสอบตำแหน่ง GPS (Haversine distance)
- รองรับจุด check-in มากกว่า 5 ตำแหน่ง กำหนด Lat/Long + รัศมีได้
- ล็อคอินด้วยรหัสพนักงาน เช่น `03570806`
- ประวัติย้อนหลัง 60 วัน + สรุปรายเดือน
- แจ้งเตือนมาสาย (late detection)

## Tech Stack
| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| Face Recognition | face-api.js (SSD MobileNetV1) |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (8h expiry) |
| Frontend | React 18, Vite |

## Project Structure
```
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── supabase.js
│   │   ├── middleware/auth.js
│   │   ├── routes/
│   │   │   ├── auth.js          # POST /api/auth/login
│   │   │   ├── checkin.js       # POST /api/checkin/in|out, register-face
│   │   │   ├── attendance.js    # GET /api/attendance/history|summary
│   │   │   ├── locations.js     # CRUD /api/locations
│   │   │   └── employees.js     # GET /api/employees/me
│   │   └── services/
│   │       ├── faceService.js   # extractDescriptor, compareDescriptors
│   │       └── locationService.js # findMatchingLocation (Haversine)
│   ├── models/                  # face-api model weights (download ด้วย script)
│   └── scripts/download-models.js
├── frontend/
│   └── src/
│       ├── pages/               # LoginPage, HomePage, CheckinPage, HistoryPage, ProfilePage, RegisterFacePage
│       ├── components/          # NavBar, CameraCapture
│       ├── hooks/               # useAuth, useGeolocation
│       └── services/api.js      # axios instance
└── supabase/
    └── migrations/001_initial_schema.sql
```

## Setup

### 1. Supabase
1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com)
2. รัน SQL ใน SQL Editor:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. คัดลอก **Project URL** และ **service_role key** จาก Settings → API

### 2. Backend
```bash
cd backend
cp .env.example .env
# แก้ไขค่าใน .env
npm install
node scripts/download-models.js   # ดาวน์โหลด face-api models (~30MB)
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables (backend/.env)
```env
PORT=3001
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=your_secret_min_32_chars
JWT_EXPIRES_IN=8h
FACE_MATCH_THRESHOLD=0.5
CORS_ORIGIN=http://localhost:5173
```

> **สำคัญ:** `SUPABASE_SERVICE_ROLE_KEY` มีสิทธิ์เต็ม อย่า expose ใน frontend

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | ล็อคอินด้วยรหัสพนักงาน |
| POST | `/api/auth/change-password` | เปลี่ยนรหัสผ่าน |
| POST | `/api/checkin/in` | เข้างาน (face + GPS) |
| POST | `/api/checkin/out` | ออกงาน (face + GPS) |
| POST | `/api/checkin/register-face` | ลงทะเบียนใบหน้า |
| GET  | `/api/checkin/today` | สถานะวันนี้ |
| GET  | `/api/attendance/history` | ประวัติ 60 วัน |
| GET  | `/api/attendance/summary` | สรุปรายเดือน |
| GET  | `/api/locations` | รายการจุด check-in |
| POST | `/api/locations` | เพิ่มจุด check-in |

## เพิ่มพนักงานใหม่
ใช้ Supabase Dashboard หรือ POST `/api/employees`:
```json
{
  "employee_id": "03570806",
  "full_name": "สมชาย ใจดี",
  "password": "initial_password",
  "department_id": "uuid",
  "position": "Software Engineer"
}
```
> password จะถูก hash ด้วย bcrypt อัตโนมัติ

## เพิ่ม/แก้ไขจุด Check-in
POST `/api/locations` (ต้องล็อคอินก่อน):
```json
{
  "name": "สาขาเพิ่มใหม่",
  "latitude": 13.7563,
  "longitude": 100.5018,
  "radius_meters": 100
}
```

## Face Recognition
- ใช้ `SSD MobileNetV1` + `FaceRecognitionNet` (128-dim descriptor)
- Threshold เริ่มต้น `0.5` (distance ≤ 0.5 = match)
- ปรับได้ใน `.env` → `FACE_MATCH_THRESHOLD`
  - ค่าต่ำ (0.4) = เข้มงวดขึ้น
  - ค่าสูง (0.6) = ยืดหยุ่นขึ้น

## Database Schema
```
employees          → ข้อมูลพนักงาน + password_hash
face_descriptors   → 128-dim face descriptor (JSON array)
checkin_locations  → จุด check-in (lat, lng, radius)
attendance         → บันทึกเวลาเข้า/ออก + GPS + face_score
work_schedule      → เวลาทำงานและ threshold มาสาย
departments        → แผนก
```
