import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { calculateSplits } from '@/lib/splits';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenseId = params.id;

    // Load expense and its group creator info
    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      include: {
        group: {
          select: { createdById: true },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Only expense creator or group admin can delete
    const isAdmin = expense.group.createdById === user.id;
    const isCreator = expense.createdById === user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the expense (Cascade delete handles Splits and Comments in DB)
    await db.expense.delete({
      where: { id: expenseId },
    });

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenseId = params.id;

    // Load expense and its group creator info
    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      include: {
        group: {
          select: { createdById: true },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Only expense creator or group admin can edit
    const isAdmin = expense.group.createdById === user.id;
    const isCreator = expense.createdById === user.id;

    if (!isAdmin && !isCreator) {
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
      return NextResponse.json({ error: 'Payer is required' }, { status: 400 });
    }

    if (!splitType || !['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE'].includes(splitType)) {
      return NextResponse.json({ error: 'Invalid split type' }, { status: 400 });
    }

    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      return NextResponse.json({ error: 'Splits must not be empty' }, { status: 400 });
    }

    // Calculate splits with exact rounding adjustments
    let computedSplits;
    try {
      computedSplits = calculateSplits(totalAmount, splitType, splits);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // Run transaction: delete old splits, update expense, insert new splits
    const updatedExpense = await db.$transaction(async (tx) => {
      // 1. Delete existing splits
      await tx.expenseSplit.deleteMany({
        where: { expenseId },
      });

      // 2. Update expense values
      const exp = await tx.expense.update({
        where: { id: expenseId },
        data: {
          description: description.trim(),
          totalAmount: Math.round(totalAmount * 100) / 100,
          paidById,
          splitType,
        },
      });

      // 3. Create new splits
      const splitsData = computedSplits.map((cs) => {
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

      return exp;
    });

    const fullExpense = await db.expense.findUnique({
      where: { id: updatedExpense.id },
      include: {
        paidBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({ expense: fullExpense });
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
