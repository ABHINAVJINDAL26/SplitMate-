import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { calculateSplits } from '@/lib/splits';

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

    // Fetch expenses
    const expenses = await db.expense.findMany({
      where: { groupId },
      include: {
        paidBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        splits: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch settlements
    const settlements = await db.settlement.findMany({
      where: { groupId },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        toUser: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Combine transactions (expenses + settlements)
    const transactions = [
      ...expenses.map((e) => ({
        type: 'expense' as const,
        id: e.id,
        description: e.description,
        amount: e.totalAmount,
        paidBy: e.paidBy,
        splitType: e.splitType,
        splits: e.splits,
        createdAt: e.createdAt,
        createdById: e.createdById,
      })),
      ...settlements.map((s) => ({
        type: 'settlement' as const,
        id: s.id,
        description: s.note || 'Settle Up Payment',
        amount: s.amount,
        paidBy: s.fromUser, // fromUser paid the money
        receivedBy: s.toUser,
        createdAt: s.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Fetch expenses/settlements error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { description, totalAmount, paidById, splitType, splits } = await req.json();

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: 'Total amount must be greater than 0' }, { status: 400 });
    }

    if (!paidById) {
      return NextResponse.json({ error: 'Payer (paidById) is required' }, { status: 400 });
    }

    if (!splitType || !['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE'].includes(splitType)) {
      return NextResponse.json({ error: 'Invalid split type' }, { status: 400 });
    }

    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      return NextResponse.json({ error: 'Splits list must not be empty' }, { status: 400 });
    }

    // Verify all split users are members of the group
    const memberIds = splits.map((s: any) => s.userId);
    const existingMembersCount = await db.groupMember.count({
      where: {
        groupId,
        userId: { in: memberIds },
      },
    });

    if (existingMembersCount !== memberIds.length) {
      return NextResponse.json({ error: 'One or more split users are not in this group' }, { status: 400 });
    }

    // Calculate splits with exact rounding adjustments
    let computedSplits;
    try {
      computedSplits = calculateSplits(totalAmount, splitType, splits);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // Create the expense and splits inside a transaction
    const newExpense = await db.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          groupId,
          description: description.trim(),
          totalAmount: Math.round(totalAmount * 100) / 100,
          paidById,
          splitType,
          createdById: user.id,
        },
      });

      // Map computed splits for database creation
      const splitsData = computedSplits.map((cs) => {
        // Find corresponding input split to extract percentage or shareValue
        const original = splits.find((s: any) => s.userId === cs.userId);
        return {
          expenseId: expense.id,
          userId: cs.userId,
          amountOwed: cs.amountOwed,
          percentage: cs.percentage ?? original?.percentage ?? null,
          shareValue: cs.shareValue ?? original?.shareValue ?? null,
        };
      });

      await tx.expenseSplit.createMany({
        data: splitsData,
      });

      return expense;
    });

    const fullExpense = await db.expense.findUnique({
      where: { id: newExpense.id },
      include: {
        paidBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({ expense: fullExpense }, { status: 201 });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
