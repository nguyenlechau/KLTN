import { useState } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Card } from '../components/Card';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IlJFUVVFU1RFUiIsImNoYW5uZWxJZHMiOltdfQ.test';
      localStorage.setItem('access_token', token);
      window.location.href = '/';
      setLoading(false);
    }, 500);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--gray-50)' }}>
      <Card title="Sign In" style={{ maxWidth: '400px' }}>
        {error && <Alert type="error">{error}</Alert>}
        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="user@example.com"
            type="email"
            required
          />
          <Input
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            type="password"
            required
          />
          <Button type="submit" loading={loading} style={{ width: '100%' }}>
            Sign In (Demo)
          </Button>
        </form>
      </Card>
    </div>
  );
}
