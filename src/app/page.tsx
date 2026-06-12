'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ExpenseModal from '@/components/ExpenseModal';
import SettleModal from '@/components/SettleModal';
import ProfileModal from '@/components/ProfileModal';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt?: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  members: { user: User }[];
}

interface TransactionSplit {
  id: string;
  userId: string;
  amountOwed: number;
  percentage: number | null;
  shareValue: number | null;
  user: User;
}

interface Transaction {
  type: 'expense' | 'settlement';
  id: string;
  description: string;
  amount: number;
  paidBy: User;
  receivedBy?: User; // only for settlements
  splitType?: string; // only for expenses
  splits?: TransactionSplit[]; // only for expenses
  createdAt: string;
  createdById?: string; // only for expenses
}

interface GroupBalances {
  balances: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    balance: number;
  }[];
  repayments: {
    fromUser: User;
    toUser: User;
    amount: number;
  }[];
}

interface GlobalBalances {
  overallBalance: number;
  totalOwed: number;
  totalOwe: number;
  summary: {
    user: User;
    netAmount: number;
  }[];
}

interface Comment {
  id: string;
  message: string;
  createdAt: string;
  user: User;
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Group Specific Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groupBalances, setGroupBalances] = useState<GroupBalances | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteErr, setInviteErr] = useState('');

  // Global Data
  const [globalBalances, setGlobalBalances] = useState<GlobalBalances | null>(null);

  // Modal controls
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileGroupsCount, setProfileGroupsCount] = useState<number>(0);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null);
  
  // Active Transaction Details (for Comment Drawer)
  const [activeTx, setActiveTx] = useState<Transaction | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const commentEndRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);

  // Authentication check & initial load
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/auth');
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);
        
        // Fetch groups
        const groupsRes = await fetch('/api/groups');
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups || []);
        
        // Fetch global balances
        const globalRes = await fetch('/api/users/me/balances');
        const globalData = await globalRes.json();
        setGlobalBalances(globalData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [router]);

  // Load group details when a group is selected
  useEffect(() => {
    if (!selectedGroupId) {
      setTransactions([]);
      setGroupBalances(null);
      setActiveTx(null);
      // Refresh global balances
      fetch('/api/users/me/balances')
        .then((r) => r.json())
        .then((d) => setGlobalBalances(d))
        .catch(console.error);
      return;
    }

    // Load group transactions
    fetch(`/api/groups/${selectedGroupId}/expenses`)
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions || []))
      .catch(console.error);

    // Load group balances & simplified debt path
    fetch(`/api/groups/${selectedGroupId}/balances`)
      .then((r) => r.json())
      .then((d) => setGroupBalances(d))
      .catch(console.error);

    // Clear invite box
    setInviteEmail('');
    setInviteMsg('');
    setInviteErr('');
    setActiveTx(null);
  }, [selectedGroupId]);

  // Polling for comments on the active transaction
  useEffect(() => {
    if (!activeTx) return;
    const txId = activeTx.id;

    function fetchComments() {
      fetch(`/api/expenses/${txId}/comments`)
        .then((r) => r.json())
        .then((d) => {
          setComments(d.comments || []);
        })
        .catch(console.error);
    }

    fetchComments();
    const interval = setInterval(fetchComments, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, [activeTx]);

  // Scroll comments to bottom
  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleShowProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/profile`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfileUser(data.user);
      setProfileGroupsCount(data.groupsCount);
      setShowProfileModal(true);
    } catch (err) {
      console.error(err);
      if (currentUser && userId === currentUser.id) {
        setProfileUser(currentUser);
        setProfileGroupsCount(groups.length);
        setShowProfileModal(true);
      }
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
    router.refresh();
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, description: newGroupDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGroups((prev) => [data.group, ...prev]);
      setSelectedGroupId(data.group.id);
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDesc('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg('');
    setInviteErr('');
    if (!inviteEmail.trim() || !selectedGroupId) return;

    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInviteMsg(data.message || 'User added successfully!');
      setInviteEmail('');
      
      // Update local groups mapping
      const updatedGroups = groups.map((g) => {
        if (g.id === selectedGroupId) {
          return {
            ...g,
            members: [...g.members, { user: data.member }],
          };
        }
        return g;
      });
      setGroups(updatedGroups);

      // Re-load group balances
      const balRes = await fetch(`/api/groups/${selectedGroupId}/balances`);
      const balData = await balRes.json();
      setGroupBalances(balData);
    } catch (err: any) {
      setInviteErr(err.message);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!selectedGroupId) return;
    if (!confirm('Are you sure you want to remove this member from the group?')) return;

    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Member removed successfully!');

      // Update local groups state
      const updatedGroups = groups.map((g) => {
        if (g.id === selectedGroupId) {
          return {
            ...g,
            members: g.members.filter((m) => m.user.id !== targetUserId),
          };
        }
        return g;
      });
      setGroups(updatedGroups);

      // Re-load group balances
      const balRes = await fetch(`/api/groups/${selectedGroupId}/balances`);
      const balData = await balRes.json();
      setGroupBalances(balData);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Expense deleted successfully!');
      setActiveTx(null);
      refreshGroupData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeTx) return;

    try {
      const res = await fetch(`/api/expenses/${activeTx.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setComments((prev) => [...prev, data.comment]);
      setNewComment('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const refreshGroupData = () => {
    if (!selectedGroupId) return;
    setShowExpenseModal(false);
    setShowSettleModal(false);
    setEditingExpense(null);

    // Re-fetch transactions
    fetch(`/api/groups/${selectedGroupId}/expenses`)
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions || []))
      .catch(console.error);

    // Re-fetch balances
    fetch(`/api/groups/${selectedGroupId}/balances`)
      .then((r) => r.json())
      .then((d) => setGroupBalances(d))
      .catch(console.error);
  };

  const activeGroup = groups.find((g) => g.id === selectedGroupId);
  const activeGroupMembersList = activeGroup?.members.map((m) => m.user) || [];

  if (loading || !currentUser) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={styles.spinner} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Splitwise ledger...</p>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* Sidebar Panel */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <span style={styles.logoSymbol}>⇅</span>
            <span style={styles.logoText}>Splitwise</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
            Logout ↗
          </button>
        </div>

        {/* User Card */}
        <div
          style={{ ...styles.userCard, cursor: 'pointer' }}
          className="glass-panel glass-interactive"
          onClick={() => handleShowProfile(currentUser.id)}
        >
          <img src={currentUser.avatarUrl || ''} alt={currentUser.name} style={styles.userAvatar} />
          <div style={styles.userInfo}>
            <h4 style={styles.userName}>{currentUser.name}</h4>
            <span style={styles.userEmail}>{currentUser.email}</span>
          </div>
        </div>

        {/* Global Dashboard Navigation link */}
        <div style={styles.menuSection}>
          <button
            onClick={() => setSelectedGroupId(null)}
            className={`nav-link ${selectedGroupId === null ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: selectedGroupId === null ? 'rgba(139, 92, 246, 0.15)' : 'transparent', textAlign: 'left' }}
          >
            <span>🏠</span> Dashboard Summary
          </button>
        </div>

        {/* Groups list */}
        <div style={styles.groupsHeader}>
          <span style={styles.sectionHeading}>My Groups</span>
          <button onClick={() => setShowCreateGroup(true)} style={styles.addGroupBtn}>
            + Add
          </button>
        </div>

        {showCreateGroup && (
          <form onSubmit={handleCreateGroup} style={styles.createGroupForm} className="glass-panel">
            <input
              type="text"
              placeholder="Group name"
              className="form-input"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required
              style={{ fontSize: '13px', padding: '8px' }}
            />
            <input
              type="text"
              placeholder="Short description"
              className="form-input"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              style={{ fontSize: '13px', padding: '8px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="glow-btn" style={{ fontSize: '11px', padding: '6px 12px', flex: 1 }}>
                Save
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowCreateGroup(false)}
                style={{ fontSize: '11px', padding: '6px 12px', flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div style={styles.groupsList}>
          {groups.length === 0 ? (
            <p style={styles.noGroupsText}>No groups added yet.</p>
          ) : (
            groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`nav-link ${selectedGroupId === g.id ? 'active' : ''}`}
                style={{ width: '100%', border: 'none', background: selectedGroupId === g.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent', textAlign: 'left' }}
              >
                <span>👥</span> {g.name}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <main style={styles.mainContent}>
        {selectedGroupId === null ? (
          // Global Dashboard Summary
          <div style={styles.dashboardContainer}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px' }}>Dashboard Overview</h2>
            
            {/* Net Balance Cards */}
            <div style={styles.balanceSummaryGrid}>
              <div className="glass-panel" style={styles.balanceCard}>
                <span style={styles.balanceCardLabel}>Total Net Balance</span>
                <h3 style={{
                  ...styles.balanceCardVal,
                  color: (globalBalances?.overallBalance || 0) > 0
                    ? 'var(--owed-green)'
                    : (globalBalances?.overallBalance || 0) < 0
                      ? 'var(--owe-red)'
                      : 'var(--text-primary)',
                }}>
                  {(globalBalances?.overallBalance || 0) >= 0 ? '+' : '-'}₹{Math.abs(globalBalances?.overallBalance || 0).toFixed(2)}
                </h3>
              </div>

              <div className="glass-panel" style={styles.balanceCard}>
                <span style={styles.balanceCardLabel}>You Are Owed</span>
                <h3 style={{ ...styles.balanceCardVal, color: 'var(--owed-green)' }}>
                  ₹{(globalBalances?.totalOwed || 0).toFixed(2)}
                </h3>
              </div>

              <div className="glass-panel" style={styles.balanceCard}>
                <span style={styles.balanceCardLabel}>You Owe</span>
                <h3 style={{ ...styles.balanceCardVal, color: 'var(--owe-red)' }}>
                  ₹{(globalBalances?.totalOwe || 0).toFixed(2)}
                </h3>
              </div>
            </div>

            {/* Overall peer accounts */}
            <div className="glass-panel" style={{ padding: '30px', marginTop: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Global Debts Summary</h3>
              {(!globalBalances?.summary || globalBalances.summary.length === 0) ? (
                <div style={styles.emptyBalancesState}>
                  <p style={{ color: 'var(--text-muted)' }}>You are completely settled up globally! 🌟</p>
                </div>
              ) : (
                <div style={styles.summaryList}>
                  {globalBalances.summary.map((item) => {
                    const isOwed = item.netAmount > 0;
                    return (
                      <div key={item.user.id} style={styles.summaryListItem}>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                          onClick={() => handleShowProfile(item.user.id)}
                          title="Click to view profile"
                        >
                          <img src={item.user.avatarUrl || ''} alt={item.user.name} style={styles.peerAvatar} />
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{item.user.name}</h4>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.user.email}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: isOwed ? 'var(--owed-green)' : 'var(--owe-red)',
                          }}>
                            {isOwed ? 'owes you' : 'you owe'} ₹{Math.abs(item.netAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Group Specific Dashboard
          activeGroup && (
            <div style={styles.groupContainer}>
              {/* Group Header */}
              <div style={styles.groupHeader}>
                <div>
                  <h2 style={{ fontSize: '26px', fontWeight: 700 }}>{activeGroup.name}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                    {activeGroup.description || 'No description provided.'}
                  </p>
                </div>
                
                {/* Control Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setShowSettleModal(true)} className="secondary-btn">
                    💸 Settle Up
                  </button>
                  <button onClick={() => setShowExpenseModal(true)} className="glow-btn">
                    ➕ Add Expense
                  </button>
                </div>
              </div>

              {/* Grid content split: main transactions on left, group stats on right */}
              <div style={styles.groupGrid}>
                {/* Left side: Timeline list of expenses and settle ups */}
                <div style={styles.timelineContainer}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Group History</h3>
                  
                  {transactions.length === 0 ? (
                    <div style={styles.emptyHistoryState} className="glass-panel">
                      <span>📝</span>
                      <p>No transactions registered for this group yet.</p>
                      <button onClick={() => setShowExpenseModal(true)} style={styles.emptyHistoryBtn}>
                        Log your first expense
                      </button>
                    </div>
                  ) : (
                    <div style={styles.transactionsList}>
                      {transactions.map((tx) => {
                        const isExpense = tx.type === 'expense';
                        const isUserPayer = tx.paidBy.id === currentUser.id;
                        
                        // Calculate relative status to current user
                        let relativeStatus = '';
                        let relativeColor = 'var(--text-muted)';
                        
                        if (isExpense && tx.splits) {
                          const userSplit = tx.splits.find((s) => s.userId === currentUser.id);
                          if (isUserPayer) {
                            const othersOwe = tx.amount - (userSplit?.amountOwed || 0);
                            if (othersOwe > 0) {
                              relativeStatus = `You lent ₹${othersOwe.toFixed(2)}`;
                              relativeColor = 'var(--owed-green)';
                            } else {
                              relativeStatus = 'You paid';
                            }
                          } else if (userSplit) {
                            relativeStatus = `You owe ₹${userSplit.amountOwed.toFixed(2)}`;
                            relativeColor = 'var(--owe-red)';
                          } else {
                            relativeStatus = 'Not involved';
                          }
                        } else if (!isExpense) {
                          // Settlement
                          if (tx.paidBy.id === currentUser.id) {
                            relativeStatus = 'You settled up';
                            relativeColor = 'var(--settled-blue)';
                          } else if (tx.receivedBy?.id === currentUser.id) {
                            relativeStatus = 'Received payment';
                            relativeColor = 'var(--owed-green)';
                          } else {
                            relativeStatus = 'Settled repayment';
                          }
                        }

                        const isActive = activeTx?.id === tx.id;

                        return (
                          <div
                            key={tx.id}
                            className="glass-panel glass-interactive"
                            style={{
                              ...styles.transactionItem,
                              borderColor: isActive ? 'var(--primary)' : 'var(--border-glass)',
                              background: isActive ? 'rgba(139, 92, 246, 0.08)' : 'var(--card-glass)',
                            }}
                            onClick={() => {
                              setActiveTx(isActive ? null : tx);
                              setComments([]);
                            }}
                          >
                            <div style={styles.txLeft}>
                              <div style={{
                                ...styles.txIconBadge,
                                background: isExpense ? 'rgba(139, 92, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                color: isExpense ? 'var(--primary)' : 'var(--owed-green)',
                              }}>
                                {isExpense ? '🍔' : '🤝'}
                              </div>
                              <div>
                                <h4 style={styles.txDesc}>{tx.description}</h4>
                                <span style={styles.txMeta}>
                                  Paid by <strong>{tx.paidBy.name}</strong> •{' '}
                                  {new Date(tx.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            <div style={styles.txRight}>
                              <div style={{ textAlign: 'right' }}>
                                <span style={styles.txAmount}>₹{tx.amount.toFixed(2)}</span>
                                <span style={{ ...styles.txRelativeStatus, color: relativeColor }}>
                                  {relativeStatus}
                                </span>
                              </div>
                              <span style={styles.txChevron}>{isActive ? '▼' : '▶'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right side: Members lists, repayments path, group admin */}
                <div style={styles.statsSidebar}>
                  {/* Group Members Invite List */}
                  <div className="glass-panel" style={styles.groupCardSection}>
                    <h4 style={styles.cardSectionHeading}>Group Members</h4>
                    <div style={styles.membersAvatarList}>
                      {activeGroup.members.map((m) => {
                        const showRemove = activeGroup.createdById === currentUser.id && m.user.id !== currentUser.id;
                        return (
                          <div key={m.user.id} style={{ ...styles.memberListItem, justifyContent: 'space-between' }} title={m.user.email}>
                            <div 
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                              onClick={() => handleShowProfile(m.user.id)}
                              title="Click to view profile"
                            >
                              <img src={m.user.avatarUrl || ''} alt={m.user.name} style={styles.memberAvatar} />
                              <span style={styles.memberAvatarName}>{m.user.name}</span>
                            </div>
                            {showRemove && (
                              <button
                                onClick={() => handleRemoveMember(m.user.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--owe-red)', fontSize: '11px', cursor: 'pointer', padding: '2px 6px' }}
                                title="Remove member"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={handleAddMember} style={styles.addMemberForm}>
                      <input
                        type="email"
                        placeholder="Invite member email"
                        className="form-input"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        style={{ fontSize: '13px', padding: '8px 12px' }}
                      />
                      <button type="submit" className="glow-btn" style={{ padding: '8px 14px', fontSize: '13px' }}>
                        Invite
                      </button>
                    </form>
                    {inviteMsg && <p style={styles.inviteSuccess}>{inviteMsg}</p>}
                    {inviteErr && <p style={styles.inviteError}>{inviteErr}</p>}
                  </div>

                  {/* Net repayments checklist */}
                  <div className="glass-panel" style={styles.groupCardSection}>
                    <h4 style={styles.cardSectionHeading}>Simplified Debts</h4>
                    {(!groupBalances?.repayments || groupBalances.repayments.length === 0) ? (
                      <p style={styles.repaymentsSettledText}>Everything settled inside this group! ☀️</p>
                    ) : (
                      <div style={styles.repaymentsList}>
                        {groupBalances.repayments.map((rep, idx) => (
                          <div key={idx} style={styles.repaymentRow}>
                            <div style={styles.repaymentFlow}>
                              <span style={styles.debtorName}>{rep.fromUser.name}</span>
                              <span style={styles.flowArrow}>➔</span>
                              <span style={styles.creditorName}>{rep.toUser.name}</span>
                            </div>
                            <span style={styles.repaymentAmt}>₹{rep.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* Drawer Overlay for Comments & Split Breakdowns (revealed when a transaction is active) */}
      {activeTx && (
        <aside style={styles.commentsDrawer} className="glass-panel">
          <div style={styles.drawerHeader}>
            <h4 style={styles.drawerTitle}>Transaction Details</h4>
            <button onClick={() => setActiveTx(null)} style={styles.closeBtn}>×</button>
          </div>

          <div style={styles.drawerContent}>
            {/* Split Breakdown */}
            <div style={styles.breakdownSection}>
              <h5 style={styles.drawerSubheading}>{activeTx.description}</h5>
              <div style={styles.breakdownTotal}>
                <span>Total Amount</span>
                <strong>₹{activeTx.amount.toFixed(2)}</strong>
              </div>
              <div style={styles.breakdownPaid}>
                <span>Paid by</span>
                <strong 
                  style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }} 
                  onClick={() => handleShowProfile(activeTx.paidBy.id)}
                  title="Click to view profile"
                >
                  {activeTx.paidBy.name}
                </strong>
              </div>

              {activeTx.type === 'expense' && activeTx.splits && (
                <div style={styles.splitsBreakdown}>
                  <span style={styles.splitsHeading}>Split Breakdown ({activeTx.splitType})</span>
                  <div style={styles.splitsList}>
                    {activeTx.splits.map((s) => (
                      <div key={s.id} style={styles.splitRow}>
                        <span 
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => handleShowProfile(s.user.id)}
                          title="Click to view profile"
                        >
                          {s.user.name}
                        </span>
                        <span>
                          {s.percentage ? `${s.percentage}%` : s.shareValue ? `${s.shareValue} shares` : ''} •{' '}
                          <strong>₹{s.amountOwed.toFixed(2)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit/Delete Actions */}
              {activeTx.type === 'expense' && (activeTx.createdById === currentUser.id || activeGroup?.createdById === currentUser.id) && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                  <button
                    onClick={() => {
                      setEditingExpense(activeTx);
                      setShowExpenseModal(true);
                    }}
                    className="secondary-btn"
                    style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(activeTx.id)}
                    className="secondary-btn"
                    style={{ flex: 1, padding: '6px 12px', fontSize: '13px', color: 'var(--owe-red)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>

            {/* Comments/Chat section */}
            <div style={styles.commentsSection}>
              <h5 style={styles.drawerSubheading}>Expense Chat</h5>
              
              <div style={styles.commentsListContainer}>
                {comments.length === 0 ? (
                  <p style={styles.noCommentsText}>No messages. Send a message to clarify splits!</p>
                ) : (
                  comments.map((c) => {
                    const isOwnComment = c.user.id === currentUser.id;
                    return (
                      <div
                        key={c.id}
                        style={{
                          ...styles.commentBubbleContainer,
                          justifyContent: isOwnComment ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div style={{
                          ...styles.commentBubble,
                          background: isOwnComment ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                        }}>
                          {!isOwnComment && (
                             <span 
                               style={{ ...styles.commentUser, cursor: 'pointer', textDecoration: 'underline' }}
                               onClick={() => handleShowProfile(c.user.id)}
                               title="Click to view profile"
                             >
                               {c.user.name}
                             </span>
                           )}
                          <p style={styles.commentMessage}>{c.message}</p>
                          <span style={styles.commentTime}>
                            {new Date(c.createdAt).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={commentEndRef} />
              </div>

              <form onSubmit={handleAddComment} style={styles.commentForm}>
                <input
                  type="text"
                  placeholder="Ask a question..."
                  className="form-input"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{ flex: 1, padding: '10px' }}
                  required
                />
                <button type="submit" className="glow-btn" style={{ padding: '10px 14px' }}>
                  Send
                </button>
              </form>
            </div>
          </div>
        </aside>
      )}

      {/* Modals overlays */}
      {showExpenseModal && selectedGroupId && (
        <ExpenseModal
          groupId={selectedGroupId}
          members={activeGroupMembersList}
          currentUser={currentUser}
          expense={editingExpense || undefined}
          onClose={() => {
            setShowExpenseModal(false);
            setEditingExpense(null);
          }}
          onSuccess={refreshGroupData}
        />
      )}

      {showSettleModal && selectedGroupId && (
        <SettleModal
          groupId={selectedGroupId}
          members={activeGroupMembersList}
          currentUser={currentUser}
          onClose={() => setShowSettleModal(false)}
          onSuccess={refreshGroupData}
        />
      )}

      {showProfileModal && profileUser && (
        <ProfileModal
          user={profileUser}
          groupsCount={profileGroupsCount}
          isCurrentUser={currentUser !== null && profileUser.id === currentUser.id}
          onUpdate={(updatedUser) => {
            if (currentUser && updatedUser.id === currentUser.id) {
              setCurrentUser(updatedUser);
            }
            // Update user references in groups state
            setGroups(groups.map((g) => ({
              ...g,
              members: g.members.map((m) => m.user.id === updatedUser.id ? { ...m, user: updatedUser } : m)
            })));
            // Update user references in transactions
            setTransactions(transactions.map((t) => {
              const updatedPaidBy = t.paidBy.id === updatedUser.id ? updatedUser : t.paidBy;
              const updatedReceivedBy = t.receivedBy?.id === updatedUser.id ? updatedUser : t.receivedBy;
              const updatedSplits = t.splits?.map((s) => s.userId === updatedUser.id ? { ...s, user: updatedUser } : s);
              return {
                ...t,
                paidBy: updatedPaidBy,
                receivedBy: updatedReceivedBy,
                splits: updatedSplits,
              };
            }));
            // Update user references in global balances summary list
            if (globalBalances?.summary) {
              setGlobalBalances({
                ...globalBalances,
                summary: globalBalances.summary.map((s) => s.user.id === updatedUser.id ? { ...s, user: updatedUser } : s)
              });
            }
            setProfileUser(updatedUser);
          }}
          onClose={() => {
            setShowProfileModal(false);
            setProfileUser(null);
          }}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    background: 'var(--bg-dark)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.05)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  sidebar: {
    width: '300px',
    background: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    flexShrink: 0,
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoSymbol: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: 'var(--primary)',
  },
  logoText: {
    fontWeight: 700,
    fontSize: '18px',
    letterSpacing: '-0.5px',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'var(--transition-smooth)',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '14px',
    fontWeight: 600,
  },
  userEmail: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  menuSection: {
    marginBottom: '24px',
  },
  groupsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionHeading: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
    fontWeight: 700,
  },
  addGroupBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  createGroupForm: {
    padding: '12px',
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  groupsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
    flex: 1,
  },
  noGroupsText: {
    fontSize: '13px',
    color: 'var(--text-dark)',
    textAlign: 'center',
    marginTop: '12px',
  },
  mainContent: {
    flex: 1,
    padding: '40px',
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'center',
  },
  dashboardContainer: {
    width: '100%',
    maxWidth: '960px',
  },
  balanceSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  balanceCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  balanceCardLabel: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  balanceCardVal: {
    fontSize: '24px',
    fontWeight: 700,
  },
  emptyBalancesState: {
    textAlign: 'center',
    padding: '40px 0',
  },
  summaryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  summaryListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-glass)',
  },
  peerAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
  },
  groupContainer: {
    width: '100%',
    maxWidth: '960px',
  },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '24px',
  },
  groupGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '30px',
    alignItems: 'start',
  },
  timelineContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  emptyHistoryState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '50px 20px',
    textAlign: 'center',
    gap: '12px',
  },
  emptyHistoryBtn: {
    background: 'none',
    border: '1px solid var(--primary)',
    color: 'var(--primary)',
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'var(--transition-smooth)',
  },
  transactionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  transactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    cursor: 'pointer',
  },
  txLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  txIconBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  },
  txDesc: {
    fontSize: '15px',
    fontWeight: 600,
  },
  txMeta: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '2px',
    display: 'inline-block',
  },
  txRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  txAmount: {
    fontSize: '16px',
    fontWeight: 700,
    display: 'block',
  },
  txRelativeStatus: {
    fontSize: '12px',
    fontWeight: 500,
  },
  txChevron: {
    fontSize: '10px',
    color: 'var(--text-dark)',
  },
  statsSidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  groupCardSection: {
    padding: '24px',
  },
  cardSectionHeading: {
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-muted)',
    fontWeight: 600,
    marginBottom: '16px',
  },
  membersAvatarList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '150px',
    overflowY: 'auto',
    marginBottom: '16px',
  },
  memberListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  memberAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
  },
  memberAvatarName: {
    fontSize: '13px',
    fontWeight: 500,
  },
  addMemberForm: {
    display: 'flex',
    gap: '8px',
  },
  inviteSuccess: {
    fontSize: '12px',
    color: 'var(--owed-green)',
    marginTop: '8px',
  },
  inviteError: {
    fontSize: '12px',
    color: 'var(--owe-red)',
    marginTop: '8px',
  },
  repaymentsSettledText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '12px 0',
  },
  repaymentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  repaymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  repaymentFlow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  debtorName: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-muted)',
  },
  flowArrow: {
    color: 'var(--primary)',
    fontSize: '11px',
  },
  creditorName: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  repaymentAmt: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--owed-green)',
  },
  commentsDrawer: {
    width: '380px',
    borderLeft: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    flexShrink: 0,
    background: 'var(--bg-sidebar)',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  drawerTitle: {
    fontSize: '16px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-muted)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  drawerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    flex: 1,
    overflow: 'hidden',
  },
  breakdownSection: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
  },
  drawerSubheading: {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '12px',
  },
  breakdownTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '8px',
    color: 'var(--text-muted)',
  },
  breakdownPaid: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '16px',
    color: 'var(--text-muted)',
  },
  splitsBreakdown: {
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '12px',
  },
  splitsHeading: {
    fontSize: '11px',
    textTransform: 'uppercase',
    color: 'var(--text-dark)',
    fontWeight: 600,
    display: 'block',
    marginBottom: '8px',
  },
  splitsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  splitRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  commentsSection: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  commentsListContainer: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingRight: '4px',
    marginBottom: '12px',
  },
  noCommentsText: {
    fontSize: '12px',
    color: 'var(--text-dark)',
    textAlign: 'center',
    marginTop: '20px',
  },
  commentBubbleContainer: {
    display: 'flex',
    width: '100%',
  },
  commentBubble: {
    maxWidth: '85%',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  commentUser: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--primary)',
  },
  commentMessage: {
    fontSize: '13px',
    lineHeight: '1.4',
  },
  commentTime: {
    fontSize: '9px',
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'right',
    marginTop: '2px',
  },
  commentForm: {
    display: 'flex',
    gap: '8px',
  },
};
