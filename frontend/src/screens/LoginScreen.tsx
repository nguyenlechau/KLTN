import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import '../styles/login.css';

export function LoginScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    
    if (!form.email || !form.password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch<{
        token: string;
        user: { id: string; email: string; name: string; role: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      localStorage.setItem('access_token', response.token);
      localStorage.setItem('user_role', response.user.role);
      localStorage.setItem('user_email', response.user.email);
      // Force full reload so the top-level router reads the new token
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-right">
        <div className="login-box">
          <div className="login-brand">
            <div className="login-brand-icon">📊</div>
            <div>
              <div className="login-brand-name">POSM System</div>
              <div className="login-brand-sub">Outdoor Advertising Assets</div>
            </div>
          </div>

          <h1>Welcome back</h1>
          <p className="login-subtitle">Sign in to your account to continue</p>

          {error && (
            <Alert type="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <div className="login-form">
            <div className="form-group">
              <label htmlFor="login-email">Email address</label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(value) => setForm({ ...form, password: value })}
              />
            </div>

            <Button
              onClick={handleLogin}
              loading={isLoading}
              style={{ width: '100%', marginTop: '0.25rem' }}
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </div>

          <div className="login-footer">
            <p>Demo credentials</p>
            <small>brand@example.com · password (Brand) &nbsp;|&nbsp; inputter@example.com · password (Inputter)</small>
          </div>
        </div>
      </div>
    </div>
  );
}
