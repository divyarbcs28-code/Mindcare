import { useState } from 'react';
import { Brain, Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';
import AuthShell from '../components/shared/AuthShell';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

export default function Login({ onLogin, onGoToRegister }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setError('');
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      onLogin({ ...data.user, token: data.token });
    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      image="/images/login-sunset.webp"
      quote="Welcome back. Take a breath — this space is yours."
      quoteBy="Every reflection is a small act of care."
    >
      <div>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: 'var(--shadow-primary)',
          }}>
            <Brain size={28} color="white" />
          </div>
          <h1 className="gradient-text font-display" style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
            MindCare
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 6, fontSize: '0.9rem' }}>
            Your personal mental wellness tracker
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem' }}>Welcome back</h2>
          <p style={{ margin: '0 0 28px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Sign in to continue your journey
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  className="input"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  style={{ paddingLeft: 40 }}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(231,111,81,0.1)',
                border: '1px solid rgba(231,111,81,0.3)',
                color: 'var(--color-danger)',
                fontSize: '0.83rem',
                marginBottom: 20,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', gap: 8 }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</>
                : <><ArrowRight size={16} /> Sign In</>
              }
            </button>
          </form>
        </div>

        {/* Register link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Don't have an account?{' '}
            <button
              onClick={onGoToRegister}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-light)', fontWeight: 600, fontSize: '0.875rem', padding: 0 }}
            >
              <UserPlus size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Create one
            </button>
          </p>
        </div>

      </div>
    </AuthShell>
  );
}
