import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const targetEmail = email.toLowerCase().trim();

    // Verify current user is a member of the group
    const isMember = await db.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!isMember) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Check if target user exists
    let targetUser = await db.user.findUnique({
      where: { email: targetEmail },
    });

    let message = 'User added successfully';

    if (!targetUser) {
      // User doesn't exist, create a placeholder user so they can be added
      const defaultPassword = 'Password123!';
      const passwordHash = await hashPassword(defaultPassword);
      const name = targetEmail.split('@')[0];
      const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(targetEmail)}`;

      targetUser = await db.user.create({
        data: {
          name,
          email: targetEmail,
          passwordHash,
          avatarUrl,
        },
      });

      message = `Placeholder user created (default pass: Password123!) and added to group`;
    }

    // Check if already a member of the group
    const alreadyMember = await db.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUser.id,
        },
      },
    });

    if (alreadyMember) {
      return NextResponse.json({ error: 'User is already a member of this group' }, { status: 400 });
    }

    // Add to group
    await db.groupMember.create({
      data: {
        groupId,
        userId: targetUser.id,
      },
    });

    // Return the added member details
    const addedMember = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      avatarUrl: targetUser.avatarUrl,
    };

    return NextResponse.json({ member: addedMember, message }, { status: 200 });
  } catch (error) {
    console.error('Add group member error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify group exists and get its creator
    const group = await db.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Only the group creator (admin) can remove members
    if (group.createdById !== user.id) {
      return NextResponse.json({ error: 'Only the group creator can remove members' }, { status: 403 });
    }

    // Creator cannot remove themselves
    if (userId === user.id) {
      return NextResponse.json({ error: 'You cannot remove yourself from the group' }, { status: 400 });
    }

    // Check if the user is a member
    const membership = await db.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'User is not a member of this group' }, { status: 404 });
    }

    // Calculate user's active balance inside this group
    const expenses = await db.expense.findMany({
      where: { groupId },
      include: {
        splits: {
          where: { userId },
        },
      },
    });

    let balance = 0;
    
    // Process expenses balance contribution
    for (const exp of expenses) {
      if (exp.paidById === userId) {
        // User paid this expense, others owe them
        const otherSplitsSum = await db.expenseSplit.aggregate({
          where: { expenseId: exp.id, NOT: { userId } },
          _sum: { amountOwed: true },
        });
        balance += otherSplitsSum._sum.amountOwed || 0;
      }
      
      const userSplit = exp.splits[0];
      if (userSplit && exp.paidById !== userId) {
        // User owes for this expense
        balance -= userSplit.amountOwed;
      }
    }

    // Process settlements balance contribution
    const settlementsSent = await db.settlement.aggregate({
      where: { groupId, fromUserId: userId },
      _sum: { amount: true },
    });
    const settlementsReceived = await db.settlement.aggregate({
      where: { groupId, toUserId: userId },
      _sum: { amount: true },
    });

    balance += settlementsSent._sum.amount || 0;
    balance -= settlementsReceived._sum.amount || 0;

    // Check if balance is non-zero
    if (Math.abs(balance) > 0.01) {
      return NextResponse.json(
        { error: `Cannot remove member with outstanding balance (₹${balance.toFixed(2)}). Please settle up first.` },
        { status: 400 }
      );
    }

    // Delete membership and clean up splits or comments if needed
    // (We leave their name in old expenses/comments but remove them from membership)
    await db.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

