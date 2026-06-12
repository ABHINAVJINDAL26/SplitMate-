'use client';

import React from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt?: string; // Optional creation timestamp
}

interface ProfileModalProps {
  user: User;
  groupsCount: number;
  onClose: () => void;
}

export default function ProfileModal({ user, groupsCount, onClose }: ProfileModalProps) {
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <div style={styles.overlay}>
      <div className="glass-panel" style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title} className="gradient-text">My Profile</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.content}>
          <div style={styles.avatarWrapper}>
            <img src={user.avatarUrl || ''} alt={user.name} style={styles.avatar} />
            <div style={styles.avatarPulse} />
          </div>

          <div style={styles.detailsList}>
            <div style={styles.detailRow}>
              <span style={styles.label}>Full Name</span>
              <span style={styles.value}>{user.name}</span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.label}>Email Address</span>
              <span style={styles.value}>{user.email}</span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.label}>Member Since</span>
              <span style={styles.value}>{joinDate}</span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.label}>Joined Groups</span>
              <span className="primary-gradient-text" style={{ ...styles.value, ...styles.groupsTag }}>
                {groupsCount} {groupsCount === 1 ? 'group' : 'groups'}
              </span>
            </div>
          </div>

          <div style={styles.footer}>
            <button onClick={onClose} className="glow-btn" style={styles.closeActionBtn}>
              Close Profile
            </button>
          </div>
        </div>
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
    maxWidth: '400px',
    padding: '30px',
    textAlign: 'center',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  avatarWrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  avatar: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '2px solid var(--border-glass)',
    position: 'relative',
    zIndex: 2,
  },
  avatarPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    background: 'var(--primary)',
    opacity: 0.15,
    filter: 'blur(8px)',
    zIndex: 1,
  },
  detailsList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 20px',
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    paddingBottom: '10px',
  },
  label: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  value: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    fontWeight: 500,
    wordBreak: 'break-all',
  },
  groupsTag: {
    background: 'rgba(139, 92, 246, 0.15)',
    border: '1px solid var(--primary)',
    color: 'var(--text-primary)',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
  footer: {
    width: '100%',
    marginTop: '8px',
  },
  closeActionBtn: {
    width: '100%',
    padding: '12px',
  },
};
