import React, { useState } from 'react';
import { format, addDays, isWeekend, parseISO } from 'date-fns';

export default function QuickIntakeForm({ supabase, session, onClose, onTrialAdded }) {
  const [mode, setMode] = useState('type');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateTrialDates = (startDate) => {
    const dates = [];
    let current = parseISO(startDate);
    let count = 0;

    while (count < 3) {
      if (!isWeekend(current)) {
        dates.push(format(current, 'EEE, MMM d'));
        count++;
      }
      current = addDays(current, 1);
    }

    return dates.join(' - ');
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;

    try {
      setLoading(true);
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('trial_forms')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('trial_forms')
        .getPublicUrl(fileName);

      setPhoto(publicUrl);
    } catch (err) {
      setError('Photo upload failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !phone) {
      setError('Name and phone are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const trialDates = calculateTrialDates(today);

      const { error } = await supabase
        .from('trials')
        .insert({
          owner_id: session.user.id,
          student_name: name,
          student_phone: phone,
          student_email: email || null,
          parent_name: isMinor ? parentName : null,
          parent_phone: isMinor ? parentPhone : null,
          is_minor: isMinor,
          date_signed: today,
          trial_start_date: today,
          trial_dates: trialDates,
          status: 'trial_scheduled',
          sms_consent: smsConsent,
          notes: notes || null,
          form_photo_url: photo || null
        });

      if (error) throw error;

      onTrialAdded();
      onClose();
    } catch (err) {
      setError('Failed to add trial: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>Add New Trial</h2>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => setMode('type')}
            style={{
              flex: 1,
              padding: '10px',
              background: mode === 'type' ? 'var(--primary-blue)' : 'var(--bg-primary)',
              color: mode === 'type' ? 'white' : 'var(--text-primary)',
              border: mode === 'type' ? 'none' : '2px solid var(--border-color)',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ✏️ Type
          </button>
          <button
            onClick={() => setMode('scan')}
            style={{
              flex: 1,
              padding: '10px',
              background: mode === 'scan' ? 'var(--primary-blue)' : 'var(--bg-primary)',
              color: mode === 'scan' ? 'white' : 'var(--text-primary)',
              border: mode === 'scan' ? 'none' : '2px solid var(--border-color)',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            📷 Scan
          </button>
        </div>

        {mode === 'scan' && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Upload Form Photo
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handlePhotoUpload(e.target.files[0])}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid var(--border-color)',
                borderRadius: '6px'
              }}
            />
            {photo && <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--status-green)' }}>✓ Photo uploaded</div>}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Phone *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={isMinor}
              onChange={(e) => setIsMinor(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label style={{ fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Is minor? (Under 18)</label>
          </div>

          {isMinor && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Parent Name</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Parent Phone</label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label style={{ fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>✓ SMS Consent</label>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                minHeight: '60px',
                fontFamily: 'inherit'
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
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--status-green)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Adding...' : '➕ Add Trial'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}