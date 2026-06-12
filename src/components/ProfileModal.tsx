'use client';

import React, { useState } from 'react';

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
  isCurrentUser?: boolean;
  onUpdate?: (updatedUser: User) => void;
  onClose: () => void;
}

const PRESETS = [
  { name: 'Red Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix' },
  { name: 'Girl Hat', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
  { name: 'Anime Boy', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Jack' },
  { name: 'Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Pepper' },
  { name: 'Pixel sprite', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Ruby' },
  { name: 'Smile Bot', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Smile' },
  { name: 'Glasses Guy', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mason' },
  { name: 'Anime Girl', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Mimi' },
];

export default function ProfileModal({ user, groupsCount, isCurrentUser = false, onUpdate, onClose }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatar, setEditAvatar] = useState(user.avatarUrl || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState(
    PRESETS.some((p) => p.url === user.avatarUrl) ? '' : user.avatarUrl || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const handleSave = async () => {
    if (!editName.trim()) {
      setError('Name cannot be empty');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/users/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), avatarUrl: editAvatar.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      if (onUpdate) {
        onUpdate(data.user);
      }
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectAvatar = (url: string) => {
    setEditAvatar(url);
    setCustomAvatarUrl('');
  };

  return (
    <div style={styles.overlay}>
      <div className="glass-panel" style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title} className="gradient-text">
            {isEditing ? 'Edit My Profile' : isCurrentUser ? 'My Profile' : `${user.name}'s Profile`}
          </h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.content}>
          {isEditing ? (
            // EDITING MODE
            <div style={styles.editForm}>
              <div style={styles.avatarPreviewWrapper}>
                <img src={editAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=placeholder'} alt="Preview" style={styles.avatar} />
                <div style={styles.avatarPulse} />
              </div>

              <div className="form-group" style={{ width: '100%', textAlign: 'left' }}>
                <label>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                  disabled={loading}
                />
              </div>

              {/* Avatar Preset Grid */}
              <div style={{ width: '100%', textAlign: 'left' }}>
                <label style={styles.sectionLabel}>Choose Avatar Character</label>
                <div style={styles.avatarGrid}>
                  {PRESETS.map((preset) => {
                    const isSelected = editAvatar === preset.url;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => selectAvatar(preset.url)}
                        style={{
                          ...styles.gridItem,
                          borderColor: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                          background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        }}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} style={styles.gridAvatar} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL Input */}
              <div className="form-group" style={{ width: '100%', textAlign: 'left' }}>
                <label>Or enter Custom Image URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  value={customAvatarUrl}
                  onChange={(e) => {
                    setCustomAvatarUrl(e.target.value);
                    setEditAvatar(e.target.value);
                  }}
                  className="form-input"
                  style={{ width: '100%', fontSize: '13px' }}
                  disabled={loading}
                />
              </div>

              <div style={styles.actionButtons}>
                <button onClick={handleSave} className="glow-btn" style={styles.actionBtn} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setIsEditing(false)} className="secondary-btn" style={styles.actionBtn} disabled={loading}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // VIEW MODE
            <>
              <div style={styles.avatarWrapper}>
                <img src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=placeholder'} alt={user.name} style={styles.avatar} />
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
                  <span style={{ ...styles.value, ...styles.groupsTag }}>
                    {groupsCount} {groupsCount === 1 ? 'group' : 'groups'}
                  </span>
                </div>
              </div>

              <div style={styles.footer}>
                {isCurrentUser ? (
                  <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                    <button onClick={() => setIsEditing(true)} className="glow-btn" style={{ flex: 1, padding: '12px' }}>
                      ✏️ Edit Profile
                    </button>
                    <button onClick={onClose} className="secondary-btn" style={{ flex: 1, padding: '12px' }}>
                      Close
                    </button>
                  </div>
                ) : (
                  <button onClick={onClose} className="glow-btn" style={styles.closeActionBtn}>
                    Close Profile
                  </button>
                )}
              </div>
            </>
          )}
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
    maxWidth: '430px',
    padding: '30px',
    textAlign: 'center',
    maxHeight: '90vh',
    overflowY: 'auto',
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
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid var(--owe-red)',
    color: 'var(--owe-red)',
    padding: '10px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '15px',
    fontSize: '13px',
    textAlign: 'left',
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
  avatarPreviewWrapper: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: '10px',
    alignSelf: 'center',
  },
  avatar: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '2px solid var(--border-glass)',
    position: 'relative',
    zIndex: 2,
    objectFit: 'cover',
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
    color: 'var(--text-primary)', // Reset standard color text
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    marginTop: '4px',
  },
  footer: {
    width: '100%',
    marginTop: '8px',
  },
  closeActionBtn: {
    width: '100%',
    padding: '12px',
  },
  editForm: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: '8px',
  },
  avatarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    marginBottom: '10px',
  },
  gridItem: {
    border: '1px solid',
    borderRadius: 'var(--radius-md)',
    padding: '6px',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
  },
  gridAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.03)',
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  actionBtn: {
    flex: 1,
    padding: '12px',
  },
};
