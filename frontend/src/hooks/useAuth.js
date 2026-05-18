import { useState, useEffect } from 'react';
import api from '../services/api';

export function useAuth() {
  const [employee, setEmployee] = useState(() => {
    try { return JSON.parse(localStorage.getItem('employee')); } catch { return null; }
  });

  // ตรวจสอบ token หมดอายุทุกครั้งที่ mount
  useEffect(() => {
    const expiry = localStorage.getItem('token_expiry');
    if (expiry && Date.now() > parseInt(expiry)) {
      logout();
    }
  }, []);

  // login ด้วย employee_id อย่างเดียว (ไม่ต้องใช้ password)
  const login = async (employee_id) => {
    const { data } = await api.post('/auth/login', { employee_id });
    localStorage.setItem('token', data.token);
    localStorage.setItem('employee', JSON.stringify(data.employee));
    // 7 วัน
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('token_expiry', expiry.toString());
    setEmployee(data.employee);
    return data.employee;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employee');
    localStorage.removeItem('token_expiry');
    setEmployee(null);
  };

  return { employee, login, logout };
}
