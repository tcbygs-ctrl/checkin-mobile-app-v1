import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CheckinPage from './pages/CheckinPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import RegisterFacePage from './pages/RegisterFacePage';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminEmployeesPage from './pages/admin/AdminEmployeesPage';
import AdminLocationsPage from './pages/admin/AdminLocationsPage';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  const expiry = localStorage.getItem('token_expiry');
  if (!token || (expiry && Date.now() > parseInt(expiry))) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const employee = (() => { try { return JSON.parse(localStorage.getItem('employee')); } catch { return null; } })();
  if (!employee) return <Navigate to="/login" replace />;
  if (employee.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/checkin" element={<PrivateRoute><CheckinPage /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/register-face" element={<PrivateRoute><RegisterFacePage /></PrivateRoute>} />

        <Route path="/admin" element={<PrivateRoute><AdminRoute><AdminOverviewPage /></AdminRoute></PrivateRoute>} />
        <Route path="/admin/employees" element={<PrivateRoute><AdminRoute><AdminEmployeesPage /></AdminRoute></PrivateRoute>} />
        <Route path="/admin/locations" element={<PrivateRoute><AdminRoute><AdminLocationsPage /></AdminRoute></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
