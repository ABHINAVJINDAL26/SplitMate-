'use client';

import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface ExpenseModalProps {
  groupId: string;
  members: User[];
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
  expense?: any; // The expense to edit, if passed
}

type SplitType = 'EQUAL' | 'UNEQUAL' | 'PERCENTAGE' | 'SHARE';

export default function ExpenseModal({
  groupId,
  members,
  currentUser,
  onClose,
  onSuccess,
  expense,
}: ExpenseModalProps) {
  const [description, setDescription] = useState(expense ? expense.description : '');
  const [amount, setAmount] = useState(expense ? expense.amount.toString() : '');
  const [paidById, setPaidById] = useState(expense ? expense.paidBy.id : currentUser.id);
  const [splitType, setSplitType] = useState<SplitType>(expense ? expense.splitType : 'EQUAL');
  
  // Keep track of which members are involved in the split (defaults to everyone or expense splits)
  const [involvedUsers, setInvolvedUsers] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (expense && expense.splits) {
      members.forEach((m) => {
        initial[m.id] = expense.splits.some((s: any) => s.userId === m.id);
      });
    } else {
      members.forEach((m) => {
        initial[m.id] = true;
      });
    }
    return initial;
  });

  // Inputs for different split types: userId -> value (string representation)
  const [unequalAmounts, setUnequalAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize inputs when members are loaded
  useEffect(() => {
    const uAmts: Record<string, string> = {};
    const pcts: Record<string, string> = {};
    const shs: Record<string, string> = {};

    members.forEach((m) => {
      uAmts[m.id] = '';
      pcts[m.id] = (100 / members.length).toFixed(1);
      shs[m.id] = '1';

      if (expense && expense.splits) {
        const found = expense.splits.find((s: any) => s.userId === m.id);
        if (found) {
          if (expense.splitType === 'UNEQUAL') {
            uAmts[m.id] = found.amountOwed.toString();
          } else if (expense.splitType === 'PERCENTAGE') {
            pcts[m.id] = (found.percentage ?? 0).toString();
          } else if (expense.splitType === 'SHARE') {
            shs[m.id] = (found.shareValue ?? 1).toString();
          }
        }
      }
    });

    setUnequalAmounts(uAmts);
    setPercentages(pcts);
    setShares(shs);
  }, [members, expense]);

  const toggleUserInvolvement = (userId: string) => {
    setInvolvedUsers((prev) => {
      const updated = { ...prev, [userId]: !prev[userId] };
      // Ensure at least one user is involved
      const anyInvolved = Object.values(updated).some((v) => v);
      if (!anyInvolved) return prev;
      return updated;
    });
  };

  const getInvolvedCount = () => {
    return Object.values(involvedUsers).filter(Boolean).length;
  };

  // On-the-fly sum calculation for validation display
  const getValidationSummary = () => {
    const total = parseFloat(amount) || 0;
    if (total <= 0) return null;

    if (splitType === 'UNEQUAL') {
      let sum = 0;
      Object.entries(unequalAmounts).forEach(([uid, val]) => {
        if (involvedUsers[uid]) {
          sum += parseFloat(val) || 0;
        }
      });
      const diff = total - sum;
      return {
        sum,
        target: total,
        isValid: Math.abs(diff) < 0.015,
        msg: `Sum: ₹${sum.toFixed(2)} / ₹${total.toFixed(2)} (${diff > 0 ? `need ₹${diff.toFixed(2)} more` : diff < 0 ? `₹${Math.abs(diff).toFixed(2)} over` : 'Matched!'})`,
      };
    }

    if (splitType === 'PERCENTAGE') {
      let sum = 0;
      Object.entries(percentages).forEach(([uid, val]) => {
        if (involvedUsers[uid]) {
          sum += parseFloat(val) || 0;
        }
      });
      const diff = 100 - sum;
      return {
        sum,
        target: 100,
        isValid: Math.abs(diff) < 0.015,
        msg: `Sum: ${sum.toFixed(1)}% / 100% (${diff > 0 ? `need ${diff.toFixed(1)}% more` : diff < 0 ? `${Math.abs(diff).toFixed(1)}% over` : 'Matched!'})`,
      };
    }

    if (splitType === 'SHARE') {
      let sum = 0;
      Object.entries(shares).forEach(([uid, val]) => {
        if (involvedUsers[uid]) {
          sum += parseFloat(val) || 0;
        }
      });
      return {
        sum,
        target: null,
        isValid: sum > 0,
        msg: `Total Shares: ${sum}`,
      };
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const total = parseFloat(amount);
    if (isNaN(total) || total <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    const involvedMembers = members.filter((m) => involvedUsers[m.id]);
    if (involvedMembers.length === 0) {
      setError('At least one group member must be involved in the split');
      return;
    }

    // Build the splits payload for submission
    const splitsPayload = involvedMembers.map((m) => {
      const payload: any = { userId: m.id };
      if (splitType === 'UNEQUAL') {
        payload.amountOwed = parseFloat(unequalAmounts[m.id]) || 0;
      } else if (splitType === 'PERCENTAGE') {
        payload.percentage = parseFloat(percentages[m.id]) || 0;
      } else if (splitType === 'SHARE') {
        payload.shareValue = parseFloat(shares[m.id]) || 0;
      }
      return payload;
    });

    // Client-side validations before network request
    const summary = getValidationSummary();
    if (summary && !summary.isValid) {
      setError(`Invalid splits configuration. ${summary.msg}`);
      return;
    }

    setLoading(true);

    const endpoint = expense ? `/api/expenses/${expense.id}` : `/api/groups/${groupId}/expenses`;
    const method = expense ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          totalAmount: total,
          paidById,
          splitType,
          splits: splitsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save expense');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validation = getValidationSummary();

  return (
    <div style={styles.overlay}>
      <div className="glass-panel" style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title} className="gradient-text">
            {expense ? 'Edit Shared Expense' : 'Add Shared Expense'}
          </h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="expenseDesc">Description</label>
              <input
                id="expenseDesc"
                type="text"
                className="form-input"
                placeholder="e.g. Dinner, Taxi, Groceries"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="expenseAmt">Amount (₹)</label>
              <input
                id="expenseAmt"
                type="number"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={styles.row}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="payerSelect">Paid By</label>
              <select
                id="payerSelect"
                className="form-input"
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                style={styles.select}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id} style={styles.option}>
                    {m.name} {m.id === currentUser.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="splitTypeSelect">Split Option</label>
              <select
                id="splitTypeSelect"
                className="form-input"
                value={splitType}
                onChange={(e) => setSplitType(e.target.value as SplitType)}
                style={styles.select}
              >
                <option value="EQUAL" style={styles.option}>Split Equally</option>
                <option value="UNEQUAL" style={styles.option}>Split Unequally (₹)</option>
                <option value="PERCENTAGE" style={styles.option}>Split by Percentage (%)</option>
                <option value="SHARE" style={styles.option}>Split by Shares</option>
              </select>
            </div>
          </div>

          {/* Splits list configuration */}
          <div style={styles.participantsSection}>
            <h4 style={styles.sectionTitle}>Split Breakdown</h4>
            <div style={styles.listContainer}>
              {members.map((m) => {
                const isInvolved = involvedUsers[m.id];
                return (
                  <div key={m.id} style={{
                    ...styles.listItem,
                    opacity: isInvolved ? 1 : 0.5,
                  }}>
                    <div style={styles.listItemLeft}>
                      <input
                        type="checkbox"
                        checked={isInvolved}
                        onChange={() => toggleUserInvolvement(m.id)}
                        style={styles.checkbox}
                      />
                      <span style={styles.memberName}>
                        {m.name} {m.id === currentUser.id ? '(You)' : ''}
                      </span>
                    </div>

                    {isInvolved && (
                      <div style={styles.listItemRight}>
                        {splitType === 'EQUAL' && (
                          <span style={styles.estimatedAmount}>
                            ₹{amount ? (parseFloat(amount) / getInvolvedCount()).toFixed(2) : '0.00'}
                          </span>
                        )}

                        {splitType === 'UNEQUAL' && (
                          <div style={styles.inputWrapper}>
                            <span style={styles.currencyPrefix}>₹</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              style={styles.inlineInput}
                              value={unequalAmounts[m.id] || ''}
                              onChange={(e) =>
                                setUnequalAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))
                              }
                              required
                            />
                          </div>
                        )}

                        {splitType === 'PERCENTAGE' && (
                          <div style={styles.inputWrapper}>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="0.0"
                              style={styles.inlineInput}
                              value={percentages[m.id] || ''}
                              onChange={(e) =>
                                setPercentages((prev) => ({ ...prev, [m.id]: e.target.value }))
                              }
                              required
                            />
                            <span style={styles.suffix}>%</span>
                          </div>
                        )}

                        {splitType === 'SHARE' && (
                          <div style={styles.inputWrapper}>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              placeholder="1"
                              style={styles.inlineInput}
                              value={shares[m.id] || ''}
                              onChange={(e) =>
                                setShares((prev) => ({ ...prev, [m.id]: e.target.value }))
                              }
                              required
                            />
                            <span style={styles.suffix}>shares</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {validation && (
              <div style={{
                ...styles.validationMessage,
                color: validation.isValid ? 'var(--owed-green)' : 'var(--owe-red)',
              }}>
                {validation.msg}
              </div>
            )}
          </div>

          <div style={styles.footer}>
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="glow-btn" disabled={loading}>
              {loading ? 'Saving...' : expense ? 'Save Changes' : 'Add Expense'}
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
    width: '95%',
    maxWidth: '560px',
    padding: '30px',
    maxHeight: '90vh',
    overflowY: 'auto',
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
  row: {
    display: 'flex',
    gap: '16px',
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
  participantsSection: {
    marginTop: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '180px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    background: 'rgba(255, 255, 255, 0.01)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    transition: 'opacity 0.2s',
  },
  listItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  checkbox: {
    cursor: 'pointer',
    width: '16px',
    height: '16px',
    accentColor: 'var(--primary)',
  },
  memberName: {
    fontSize: '14px',
  },
  listItemRight: {
    display: 'flex',
    alignItems: 'center',
  },
  estimatedAmount: {
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    padding: '4px 8px',
  },
  currencyPrefix: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginRight: '4px',
  },
  suffix: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginLeft: '4px',
  },
  inlineInput: {
    background: 'none',
    border: 'none',
    width: '60px',
    textAlign: 'right',
    color: '#fff',
    outline: 'none',
    fontSize: '14px',
  },
  validationMessage: {
    fontSize: '13px',
    fontWeight: 500,
    marginTop: '6px',
    textAlign: 'right',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
};
