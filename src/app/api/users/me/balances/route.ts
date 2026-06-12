import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

interface GlobalSummaryItem {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  netAmount: number; // Positive: they owe me, Negative: I owe them
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all groups the user is a member of
    const memberships = await db.groupMember.findMany({
      where: { userId: user.id },
      select: { groupId: true },
    });

    const groupIds = memberships.map((m) => m.groupId);

    // Initialize global balances sheet: userId -> net amount relative to logged-in user
    // Positive means they owe the logged-in user. Negative means the logged-in user owes them.
    const relativeLedger: Record<string, number> = {};
    const userDetails: Record<string, { id: string; name: string; email: string; avatarUrl: string | null }> = {};

    // Calculate balances for each group
    for (const groupId of groupIds) {
      // Get all group members
      const members = await db.groupMember.findMany({
        where: { groupId },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      members.forEach((m) => {
        if (m.userId !== user.id && !userDetails[m.userId]) {
          userDetails[m.userId] = m.user;
          relativeLedger[m.userId] = 0;
        }
      });

      // Get all expenses in group
      const expenses = await db.expense.findMany({
        where: { groupId },
        include: {
          splits: true,
        },
      });

      // Get all settlements in group
      const settlements = await db.settlement.findMany({
        where: { groupId },
      });

      // Process expenses
      expenses.forEach((expense) => {
        const payerId = expense.paidById;

        expense.splits.forEach((split) => {
          const debtorId = split.userId;
          const amount = split.amountOwed;

          // Case 1: Logged-in user paid, and debtorId owes a share
          if (payerId === user.id && debtorId !== user.id) {
            if (relativeLedger[debtorId] !== undefined) {
              relativeLedger[debtorId] += amount;
            }
          }
          // Case 2: Someone else paid, and logged-in user owes a share
          else if (debtorId === user.id && payerId !== user.id) {
            if (relativeLedger[payerId] !== undefined) {
              relativeLedger[payerId] -= amount;
            }
          }
        });
      });

      // Process settlements
      settlements.forEach((settlement) => {
        const senderId = settlement.fromUserId;
        const receiverId = settlement.toUserId;
        const amount = settlement.amount;

        // Case 1: Logged-in user sent money to someone
        if (senderId === user.id && receiverId !== user.id) {
          if (relativeLedger[receiverId] !== undefined) {
            relativeLedger[receiverId] += amount;
          }
        }
        // Case 2: Someone sent money to logged-in user
        else if (receiverId === user.id && senderId !== user.id) {
          if (relativeLedger[senderId] !== undefined) {
            relativeLedger[senderId] -= amount;
          }
        }
      });
    }

    // Compute totals
    let overallBalance = 0;
    let totalOwed = 0; // Money others owe me
    let totalOwe = 0;  // Money I owe others
    const summary: GlobalSummaryItem[] = [];

    Object.entries(relativeLedger).forEach(([targetUserId, amount]) => {
      const roundedAmount = Math.round(amount * 100) / 100;
      if (Math.abs(roundedAmount) < 0.01) return;

      overallBalance += roundedAmount;
      if (roundedAmount > 0) {
        totalOwed += roundedAmount;
      } else {
        totalOwe += Math.abs(roundedAmount);
      }

      summary.push({
        user: userDetails[targetUserId],
        netAmount: roundedAmount,
      });
    });

    return NextResponse.json({
      overallBalance: Math.round(overallBalance * 100) / 100,
      totalOwed: Math.round(totalOwed * 100) / 100,
      totalOwe: Math.round(totalOwe * 100) / 100,
      summary: summary.sort((a, b) => b.netAmount - a.netAmount), // descending
    });
  } catch (error) {
    console.error('Calculate overall balances error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
