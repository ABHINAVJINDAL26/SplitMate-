import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId, fromUserId, toUserId, amount, note } = await req.json();

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    if (!fromUserId || !toUserId) {
      return NextResponse.json({ error: 'Sender and receiver are required' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Settle amount must be greater than 0' }, { status: 400 });
    }

    // Verify current user belongs to the group
    const isMember = await db.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify both sender and receiver belong to the group
    const membersCount = await db.groupMember.count({
      where: {
        groupId,
        userId: { in: [fromUserId, toUserId] },
      },
    });

    if (membersCount !== 2 && fromUserId !== toUserId) {
      return NextResponse.json({ error: 'Both users must be members of the group' }, { status: 400 });
    }

    // Record settlement
    const settlement = await db.settlement.create({
      data: {
        groupId,
        fromUserId,
        toUserId,
        amount: Math.round(amount * 100) / 100,
        note: note ? note.trim() : `Recorded payment of ₹${amount.toFixed(2)}`,
      },
      include: {
        fromUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
        toUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ settlement }, { status: 201 });
  } catch (error) {
    console.error('Create settlement error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
