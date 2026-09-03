import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import MobileViewEnhanced from './components/MobileViewEnhanced';

// Initialize Supabase
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key'
);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 769);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    if (newDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return <LoginScreen supabase={supabase} />;
  }

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        style={{
          position: 'fixed',
          top: '12px',
          right: '12px',
          zIndex: 50,
          background: 'var(--primary-blue)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          fontWeight: '700'
        }}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      {isMobile ? (
        <MobileViewEnhanced supabase={supabase} session={session} />
      ) : (
        <Dashboard supabase={supabase} session={session} />
      )}
    </div>
  );
}