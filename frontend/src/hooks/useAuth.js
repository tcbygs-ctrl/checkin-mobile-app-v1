import { useState, useEffect } from 'react';
import api from '../services/api';

export function useAuth() {
  const [employee, setEmployee] = useState(() => {
    try { return JSON.parse(localStorage.getItem('employee')); } catch { return null; }
  });

  const login = async (employee_id, password) => {
    const { data } = await api.post('/auth/login', { employee_id, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('employee', JSON.stringify(data.employee));
    setEmployee(data.employee);
    return data.employee;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employee');
    setEmployee(null);
  };

  return { employee, login, logout };
}
