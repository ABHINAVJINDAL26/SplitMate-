'use client';

import React, { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface SettleModalProps {
  groupId: string;
  members: User[];
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SettleModal({
  groupId,
  members,
  currentUser,
  onClose,
  onSuccess,
}: SettleModalProps) {
  const [fromUserId, setFromUserId] = useState(currentUser.id);
  // Default to first member who is not current user, if available
  const initialToUser = members.find((m) => m.id !== currentUser.id)?.id || members[0]?.id || '';
  const [toUserId, setToUserId] = useState(initialToUser);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (fromUserId === toUserId) {
      setError('Sender and receiver must be different members');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          fromUserId,
          toUserId,
          amount: parsedAmount,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record settlement');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="glass-panel" style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title} className="gradient-text">Record Payment / Settle Up</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label htmlFor="fromUserSelect">Who Paid?</label>
            <select
              id="fromUserSelect"
              className="form-input"
              value={fromUserId}
              onChange={(e) => setFromUserId(e.target.value)}
              style={styles.select}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id} style={styles.option}>
                  {m.name} {m.id === currentUser.id ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="toUserSelect">Who Received?</label>
            <select
              id="toUserSelect"
              className="form-input"
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              style={styles.select}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id} style={styles.option}>
                  {m.name} {m.id === currentUser.id ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="settleAmount">Amount (₹)</label>
            <input
              id="settleAmount"
              type="number"
              step="0.01"
              className="form-input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="settleNote">Note (optional)</label>
            <input
              id="settleNote"
              type="text"
              className="form-input"
              placeholder="e.g. Paid Alice back in cash"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div style={styles.footer}>
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="glow-btn" disabled={loading}>
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(5, 7, 16, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxWidth: '480px',
    padding: '30px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  select: {
    cursor: 'pointer',
  },
  option: {
    background: 'var(--bg-sidebar)',
    color: 'var(--text-primary)',
  },
  error: {
    background: 'var(--owe-red-glow)',
    border: '1px solid var(--owe-red)',
    color: 'var(--owe-red)',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  },
};
