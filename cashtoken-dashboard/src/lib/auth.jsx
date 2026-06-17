import { createContext, useContext, useState, useEffect } from 'react';
import { callApi } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cashtoken_session');
    if (!token) {
      setLoading(false);
      return;
    }

    callApi('validateSession')
      .then((data) => {
        if (data.ok) {
          setUser(data.user);
        } else {
          localStorage.removeItem('cashtoken_session');
        }
      })
      .catch(() => {
        localStorage.removeItem('cashtoken_session');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function login(username, password) {
    const data = await callApi('login', { username, password });
    if (data.ok) {
      localStorage.setItem('cashtoken_session', data.token);
      setUser(data.user);
    }
    return { ok: data.ok, must_change_password: data.must_change_password, error: data.error };
  }

  async function logout() {
    try {
      await callApi('logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('cashtoken_session');
    setUser(null);
  }

  async function changePassword(currentPwd, newPwd) {
    const data = await callApi('changePassword', {
      current_password: currentPwd,
      new_password: newPwd,
    });
    if (data.ok && data.user) {
      setUser(data.user);
    }
    return { ok: data.ok, error: data.error };
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
