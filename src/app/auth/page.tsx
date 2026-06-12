'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) {
          router.push('/');
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundGlow1} />
      <div style={styles.backgroundGlow2} />
      
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoSymbol}>⇅</span>
            <span style={styles.logoText}>Splitwise</span>
          </div>
          <h2 style={styles.title} className="primary-gradient-text">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={styles.subtitle}>
            {isLogin ? 'Access your shared ledgers' : 'Start sharing expenses with friends'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  outline: 'none',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div style={styles.requirementTip}>
              🔑 <strong>Password requirements:</strong> Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" className="glow-btn" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setPassword('');
            }}
            style={styles.toggleBtn}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundGlow1: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0) 70%)',
    zIndex: -1,
  },
  backgroundGlow2: {
    position: 'absolute',
    bottom: '10%',
    right: '15%',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(0,0,0,0) 70%)',
    zIndex: -1,
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '40px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid var(--border-glass)',
  },
  logoSymbol: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'var(--primary)',
  },
  logoText: {
    fontWeight: 600,
    letterSpacing: '0.5px',
    fontSize: '15px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  requirementTip: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 12px',
    marginBottom: '20px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    lineHeight: '1.45',
    textAlign: 'left',
  },
  submitBtn: {
    marginTop: '10px',
    padding: '12px',
    fontSize: '16px',
  },
  error: {
    background: 'var(--owe-red-glow)',
    border: '1px solid var(--owe-red)',
    color: 'var(--owe-red)',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    marginTop: '24px',
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
};
