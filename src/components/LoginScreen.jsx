import React, { useState } from 'react';

export default function LoginScreen({ supabase }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError('Check your email for confirmation link');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--primary-blue) 0%, #0052cc 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '40px',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '8px',
          fontSize: '28px',
          fontWeight: '800',
          color: 'var(--text-primary)'
        }}>🏋️ The Den</h1>
        <p style={{
          textAlign: 'center',
          marginBottom: '32px',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>Trial Management System</p>

        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '600',
              fontSize: '14px',
              color: 'var(--text-primary)'
            }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '600',
              fontSize: '14px',
              color: 'var(--text-primary)'
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(221,0,0,0.1)',
              color: 'var(--status-red)',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--primary-blue)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '12px',
            background: 'transparent',
            color: 'var(--primary-blue)',
            border: '2px solid var(--primary-blue)',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {isSignUp ? 'Already have account? Log In' : "Don't have account? Sign Up"}
        </button>
      </div>
    </div>
  );
}