import React, { useState } from 'react';
import { format, addDays, isWeekend, parseISO } from 'date-fns';

export default function BulkImport({ supabase, session, onClose, onTrialsImported }) {
  const [csv, setCsv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState([]);

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

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) throw new Error('CSV must have header and at least one data row');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};

      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      if (!row.name || !row.phone) {
        throw new Error(`Row ${i}: name and phone are required`);
      }

      rows.push({
        student_name: row.name,
        student_phone: row.phone,
        student_email: row.email || null,
        is_minor: row.is_minor === 'yes' || row.is_minor === 'true',
        parent_name: row.parent_name || null,
        parent_phone: row.parent_phone || null,
        date_signed: row.date_signed || format(new Date(), 'yyyy-MM-dd'),
        sms_consent: row.sms_consent === 'yes' || row.sms_consent === 'true',
        notes: row.notes || null
      });
    }

    return rows;
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    setCsv(text);

    try {
      const rows = parseCSV(text);
      setPreview(rows.slice(0, 5));
      setError('');
    } catch (err) {
      setError(err.message);
      setPreview([]);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      const rows = parseCSV(csv);

      const trialsToInsert = rows.map(row => ({
        owner_id: session.user.id,
        student_name: row.student_name,
        student_phone: row.student_phone,
        student_email: row.student_email,
        is_minor: row.is_minor,
        parent_name: row.parent_name,
        parent_phone: row.parent_phone,
        date_signed: row.date_signed,
        trial_start_date: row.date_signed,
        trial_dates: calculateTrialDates(row.date_signed),
        status: 'trial_scheduled',
        sms_consent: row.sms_consent,
        notes: row.notes
      }));

      const { error } = await supabase
        .from('trials')
        .insert(trialsToInsert);

      if (error) throw error;

      onTrialsImported();
      onClose();
    } catch (err) {
      setError('Import failed: ' + err.message);
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
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>Bulk Import CSV</h2>

        <p style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Upload a CSV file with columns: name, phone, email (optional), is_minor (optional), parent_name, parent_phone, sms_consent, date_signed, notes
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            📥 Choose CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid var(--border-color)',
              borderRadius: '6px'
            }}
          />
        </div>

        {preview.length > 0 && (
          <div style={{
            background: 'var(--bg-primary)',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>Preview ({preview.length} rows)</h3>
            {preview.map((row, idx) => (
              <div key={idx} style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
                paddingBottom: '6px',
                borderBottom: '1px solid var(--border-color)'
              }}>
                {row.student_name} • {row.student_phone}
              </div>
            ))}
          </div>
        )}

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
            onClick={handleImport}
            disabled={preview.length === 0 || loading}
            style={{
              flex: 1,
              padding: '12px',
              background: preview.length > 0 ? 'var(--status-green)' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: preview.length > 0 && !loading ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Importing...' : `✓ Import ${preview.length} Trials`}
          </button>
          <button
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
      </div>
    </div>
  );
}