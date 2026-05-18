import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CheckCircle, ClipboardList, User } from 'lucide-react';

const items = [
  { path: '/',         label: 'หน้าหลัก',    icon: Home },
  { path: '/checkin',  label: 'เข้า-ออกงาน', icon: CheckCircle },
  { path: '/history',  label: 'ประวัติ',      icon: ClipboardList },
  { path: '/profile',  label: 'โปรไฟล์',     icon: User },
];

export default function NavBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="navbar">
      {items.map(({ path, label, icon: Icon }) => (
        <button
          key={path}
          className={`nav-item ${pathname === path ? 'active' : ''}`}
          onClick={() => navigate(path)}
        >
          <Icon size={22} strokeWidth={1.8} />
          {label}
        </button>
      ))}
    </nav>
  );
}
