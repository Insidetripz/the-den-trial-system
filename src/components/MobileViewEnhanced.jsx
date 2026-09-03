import React, { useState, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import QuickIntakeForm from './QuickIntakeForm';

export default function MobileViewEnhanced({ supabase, session }) {
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('priority');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTrials();

    const subscription = supabase
      .channel('trials:change')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trials', filter: `owner_id=eq.${session.user.id}` }, () => {
        loadTrials();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadTrials = async () => {
    try {
      const { data, error } = await supabase
        .from('trials')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrials(data || []);
    } catch (err) {
      console.error('Error loading trials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (trialId, newStatus) => {
    try {
      await supabase
        .from('trials')
        .update({ status: newStatus, updated_at: new Date() })
        .eq('id', trialId)
        .eq('owner_id', session.user.id);
      loadTrials();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  let displayTrials = trials;

  if (activeTab === 'priority') {
    displayTrials = trials.filter(t => {
      if (t.status !== 'trial_scheduled') return false;
      const start = parseISO(t.trial_start_date);
      const end = addDays(start, 2);
      const now = new Date();
      return (now >= start && now <= end) || format(end, 'yyyy-MM-dd') === today;
    });
  } else if (activeTab === 'active') {
    displayTrials = trials.filter(t => {
      if (t.status !== 'trial_scheduled') return false;
      const start = parseISO(t.trial_start_date);
      const end = addDays(start, 2);
      const now = new Date();
      return now >= start && now <= end;
    });
  }

  if (searchTerm) {
    displayTrials = displayTrials.filter(t =>
      t.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.student_phone.includes(searchTerm)
    );
  }

  const getTrialStatus = (trial) => {
    if (trial.status === 'joined') return { badge: '✓ JOINED', color: '#00aa44', bgColor: 'rgba(0,170,68,0.2)' };
    if (trial.status === 'not_joined') return { badge: '✗ NO JOIN', color: '#dd0000', bgColor: 'rgba(221,0,0,0.2)' };

    const start = parseISO(trial.trial_start_date);
    const end = addDays(start, 2);
    const now = new Date();

    if (format(end, 'yyyy-MM-dd') === today && now <= end) {
      return { badge: '🔴 ENDING', color: '#ff9933', bgColor: 'rgba(255,153,51,0.2)' };
    }
    if (now >= start && now <= end) {
      return { badge: '🟢 ACTIVE', color: '#00aa44', bgColor: 'rgba(0,170,68,0.2)' };
    }

    return { badge: '⏳ PENDING', color: '#0066ff', bgColor: 'rgba(0,102,255,0.2)' };
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '60px'
    }}>
      <div style={{
        background: 'var(--header-bg)',
        color: 'var(--header-text)',
        padding: '16px',
        textAlign: 'center',
        borderBottom: '4px solid var(--header-accent)',
        flexShrink: 0
      }}>
        <h1 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800' }}>🏋️ The Den</h1>
        <p style={{ margin: 0, fontSize: '11px', opacity: 0.9 }}>Trial Check-In • Tap to Update</p>
      </div>

      <div style={{ padding: '12px', background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search name or phone..."
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '4px',
        padding: '8px',
        background: 'var(--bg-secondary)',
        flexShrink: 0
      }}>
        {[
          { id: 'priority', label: '⚡ Priority', count: trials.filter(t => {
            if (t.status !== 'trial_scheduled') return false;
            const start = parseISO(t.trial_start_date);
            const end = addDays(start, 2);
            const now = new Date();
            return (now >= start && now <= end) || format(end, 'yyyy-MM-dd') === today;
          }).length },
          { id: 'active', label: '→ Active', count: trials.filter(t => {
            if (t.status !== 'trial_scheduled') return false;
            const start = parseISO(t.trial_start_date);
            const end = addDays(start, 2);
            const now = new Date();
            return now >= start && now <= end;
          }).length },
          { id: 'all', label: 'All', count: trials.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 8px',
              background: activeTab === tab.id ? 'var(--primary-blue)' : 'var(--bg-primary)',
              color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
              border: activeTab === tab.id ? 'none' : '2px solid var(--border-color)',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '11px',
              textAlign: 'center'
            }}
          >
            {tab.label}
            <br />
            <span style={{ fontSize: '10px', opacity: 0.8 }}>({tab.count})</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            Loading...
          </div>
        ) : displayTrials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            No trials found
          </div>
        ) : (
          displayTrials.map(trial => {
            const status = getTrialStatus(trial);
            const isExpanded = expandedId === trial.id;

            return (
              <div
                key={trial.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: `2px solid var(--border-color)`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setExpandedId(isExpanded ? null : trial.id)}
              >
                <div style={{ marginBottom: '8px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {trial.student_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        📱 {trial.student_phone}
                      </div>
                    </div>
                    <div style={{
                      background: status.bgColor,
                      color: status.color,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap'
                    }}>
                      {status.badge}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  📅 {trial.trial_dates}
                </div>

                <div style={{ fontSize: '11px', marginBottom: '12px' }}>
                  {trial.sms_consent ? '✓ Can Text' : '❌ No Consent'}
                </div>

                {isExpanded && (
                  <div style={{
                    background: 'var(--bg-primary)',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    borderLeft: `3px solid var(--primary-blue)`
                  }}>
                    {trial.student_email && <div>📧 {trial.student_email}</div>}
                    {trial.is_minor && trial.parent_name && <div>👤 Parent: {trial.parent_name}</div>}
                    {trial.is_minor && trial.parent_phone && <div>📞 Parent: {trial.parent_phone}</div>}
                    {trial.notes && <div style={{ marginTop: '8px' }}>📝 {trial.notes}</div>}
                    <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '10px' }}>
                      Signed: {trial.date_signed}
                    </div>
                  </div>
                )}

                {trial.status === 'trial_scheduled' && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(trial.id, 'joined');
                      }}
                      style={{
                        padding: '12px',
                        background: 'var(--status-green)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textTransform: 'uppercase'
                      }}
                    >
                      ✓ Joined
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(trial.id, 'not_joined');
                      }}
                      style={{
                        padding: '12px',
                        background: 'var(--status-red)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textTransform: 'uppercase'
                      }}
                    >
                      ✗ Did Not Join
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--header-bg)',
        color: 'var(--header-text)',
        padding: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '2px solid var(--header-accent)',
        zIndex: 100
      }}>
        <div style={{ fontSize: '12px', fontWeight: '700' }}>
          {trials.filter(t => t.status === 'trial_scheduled').length} Leads
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '8px 12px',
              background: 'var(--header-accent)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            ➕ New
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Log Out
          </button>
        </div>
      </div>

      {showForm && <QuickIntakeForm supabase={supabase} session={session} onClose={() => setShowForm(false)} onTrialAdded={loadTrials} />}
    </div>
  );
}