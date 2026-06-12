import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

interface MemberBalance {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  balance: number; // Positive means they are owed, negative means they owe
}

interface Repayment {
  fromUser: { id: string; name: string; email: string; avatarUrl: string | null };
  toUser: { id: string; name: string; email: string; avatarUrl: string | null };
  amount: number;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;

    // Verify membership
    const membership = await db.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all group members
    const members = await db.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    const userMap = new Map<string, typeof members[0]['user']>();
    members.forEach((m) => userMap.set(m.user.id, m.user));

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

    // We calculate net balance for each user
    // net_balance = sum(amount paid by user *that others owe*) - sum(amount user owes for other people's payments) + settlements
    // Let's model this using a balance sheet
    const netBalances: Record<string, number> = {};
    members.forEach((m) => {
      netBalances[m.user.id] = 0;
    });

    // Process expenses
    expenses.forEach((expense) => {
      const payerId = expense.paidById;
      
      expense.splits.forEach((split) => {
        const debtorId = split.userId;
        const amount = split.amountOwed;

        if (debtorId === payerId) {
          // Payer doesn't owe themselves anything on net balance sheet
          // (They spent their own money on their share)
          return;
        }

        // Payer is owed 'amount' by debtor
        if (netBalances[payerId] !== undefined) {
          netBalances[payerId] += amount;
        }
        // Debtor owes 'amount' to payer
        if (netBalances[debtorId] !== undefined) {
          netBalances[debtorId] -= amount;
        }
      });
    });

    // Process settlements (direct cash transfers)
    settlements.forEach((settlement) => {
      const senderId = settlement.fromUserId;
      const receiverId = settlement.toUserId;
      const amount = settlement.amount;

      // Sender paid, so their outstanding debt is reduced (their balance goes up / they owe less)
      if (netBalances[senderId] !== undefined) {
        netBalances[senderId] += amount;
      }
      // Receiver received, so their outstanding credit is reduced (their balance goes down / they are owed less)
      if (netBalances[receiverId] !== undefined) {
        netBalances[receiverId] -= amount;
      }
    });

    // Format member balances, rounding to 2 decimal places
    const memberBalancesList: MemberBalance[] = members.map((m) => {
      const u = m.user;
      const rawBalance = netBalances[u.id] || 0;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        balance: Math.round(rawBalance * 100) / 100,
      };
    });

    // Calculate Repayments (Debt Simplification)
    // We match debtors (balance < 0) with creditors (balance > 0)
    const debtors = memberBalancesList
      .filter((m) => m.balance < -0.009)
      .map((m) => ({ ...m, balance: Math.abs(m.balance) }))
      .sort((a, b) => b.balance - a.balance); // largest debts first

    const creditors = memberBalancesList
      .filter((m) => m.balance > 0.009)
      .map((m) => ({ ...m }))
      .sort((a, b) => b.balance - a.balance); // largest credits first

    const repayments: Repayment[] = [];

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const amountToSettle = Math.min(debtor.balance, creditor.balance);
      const roundedAmount = Math.round(amountToSettle * 100) / 100;

      if (roundedAmount > 0) {
        const fromUser = userMap.get(debtor.id)!;
        const toUser = userMap.get(creditor.id)!;

        repayments.push({
          fromUser,
          toUser,
          amount: roundedAmount,
        });
      }

      debtor.balance -= amountToSettle;
      creditor.balance -= amountToSettle;

      if (debtor.balance < 0.009) {
        dIdx++;
      }
      if (creditor.balance < 0.009) {
        cIdx++;
      }
    }

    return NextResponse.json({
      balances: memberBalancesList,
      repayments,
    });
  } catch (error) {
    console.error('Calculate balances error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
