import React, { useState, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import QuickIntakeForm from './QuickIntakeForm';
import BulkImport from './BulkImport';

export default function Dashboard({ supabase, session }) {
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleStatusChange = async (trialId, newStatus) => {
    try {
      const { error } = await supabase
        .from('trials')
        .update({ status: newStatus, updated_at: new Date() })
        .eq('id', trialId)
        .eq('owner_id', session.user.id);

      if (error) throw error;
      loadTrials();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const stats = {
    starting_today: trials.filter(t => t.trial_start_date === today).length,
    active: trials.filter(t => {
      const start = parseISO(t.trial_start_date);
      const end = addDays(start, 2);
      const now = new Date();
      return now >= start && now <= end && t.status === 'trial_scheduled';
    }).length,
    ending_today: trials.filter(t => {
      const start = parseISO(t.trial_start_date);
      const end = addDays(start, 2);
      return format(end, 'yyyy-MM-dd') === today && t.status === 'trial_scheduled';
    }).length,
    joined: trials.filter(t => t.status === 'joined').length,
    not_joined: trials.filter(t => t.status === 'not_joined').length,
  };

  let filteredTrials = trials;
  if (filter === 'joined') filteredTrials = trials.filter(t => t.status === 'joined');
  else if (filter === 'not_joined') filteredTrials = trials.filter(t => t.status === 'not_joined');
  else if (filter === 'active') filteredTrials = trials.filter(t => t.status === 'trial_scheduled');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      <div style={{
        background: 'var(--header-bg)',
        color: 'var(--header-text)',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderBottom: '4px solid var(--header-accent)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>🏋️ The Den Trial System</h1>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '12px'
            }}
          >
            Log Out
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Starting Today</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary-blue)' }}>{stats.starting_today}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Active</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--status-green)' }}>{stats.active}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Ending Today</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--status-orange)' }}>{stats.ending_today}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Joined</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--status-green)' }}>{stats.joined}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Not Joined</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--status-red)' }}>{stats.not_joined}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '12px 20px',
                background: 'var(--primary-blue)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ➕ New Trial
            </button>
            <button
              onClick={() => setShowBulkImport(true)}
              style={{
                padding: '12px 20px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📥 Bulk Import
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[
              { label: 'All Trials', value: 'all', count: trials.length },
              { label: 'Active', value: 'active', count: stats.active },
              { label: 'Joined', value: 'joined', count: stats.joined },
              { label: 'Not Joined', value: 'not_joined', count: stats.not_joined }
            ].map(btn => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                style={{
                  padding: '8px 14px',
                  background: filter === btn.value ? 'var(--primary-blue)' : 'var(--bg-secondary)',
                  color: filter === btn.value ? 'white' : 'var(--text-primary)',
                  border: filter === btn.value ? 'none' : '2px solid var(--border-color)',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {btn.label} ({btn.count})
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
          ) : (
            <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '11px' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '11px' }}>Phone</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '11px' }}>Trial Dates</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '11px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '11px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrials.map(trial => (
                    <tr key={trial.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{trial.student_name}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{trial.student_phone}</td>
                      <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>{trial.trial_dates}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: trial.status === 'joined' ? 'rgba(0,170,68,0.2)' : trial.status === 'not_joined' ? 'rgba(221,0,0,0.2)' : 'rgba(255,153,51,0.2)',
                          color: trial.status === 'joined' ? 'var(--status-green)' : trial.status === 'not_joined' ? 'var(--status-red)' : 'var(--status-orange)'
                        }}>
                          {trial.status === 'trial_scheduled' ? '🔄 In Progress' : trial.status === 'joined' ? '✓ Joined' : '✗ Not Joined'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {trial.status === 'trial_scheduled' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(trial.id, 'joined')}
                                style={{
                                  padding: '6px 10px',
                                  background: 'var(--status-green)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: '600',
                                  fontSize: '11px'
                                }}
                              >
                                ✓ Joined
                              </button>
                              <button
                                onClick={() => handleStatusChange(trial.id, 'not_joined')}
                                style={{
                                  padding: '6px 10px',
                                  background: 'var(--status-red)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: '600',
                                  fontSize: '11px'
                                }}
                              >
                                ✗ Not Joined
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && <QuickIntakeForm supabase={supabase} session={session} onClose={() => { setShowForm(false); loadTrials(); }} onTrialAdded={loadTrials} />}
      {showBulkImport && <BulkImport supabase={supabase} session={session} onClose={() => { setShowBulkImport(false); loadTrials(); }} onTrialsImported={loadTrials} />}
    </div>
  );
}