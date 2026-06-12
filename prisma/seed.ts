import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing database records
  await prisma.comment.deleteMany({});
  await prisma.settlement.deleteMany({});
  await prisma.expenseSplit.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const alice = await prisma.user.create({
    data: {
      name: 'Alice Smith',
      email: 'alice@example.com',
      passwordHash,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=alice@example.com`,
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Jones',
      email: 'bob@example.com',
      passwordHash,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=bob@example.com`,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      passwordHash,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=charlie@example.com`,
    },
  });

  console.log(`Created users: ${alice.name}, ${bob.name}, ${charlie.name}`);

  // 2. Create Group
  const skiTrip = await prisma.group.create({
    data: {
      name: 'Ski Trip 2026',
      description: 'Expenses for our annual winter ski trip in the Alps!',
      createdById: alice.id,
    },
  });

  console.log(`Created group: ${skiTrip.name}`);

  // 3. Add Members to Group
  await prisma.groupMember.createMany({
    data: [
      { groupId: skiTrip.id, userId: alice.id },
      { groupId: skiTrip.id, userId: bob.id },
      { groupId: skiTrip.id, userId: charlie.id },
    ],
  });

  // 4. Add a sample equal split expense to demonstrate
  const lunchExpense = await prisma.expense.create({
    data: {
      groupId: skiTrip.id,
      description: 'Alps Lodge Lunch',
      totalAmount: 300.00,
      paidById: alice.id,
      splitType: 'EQUAL',
      createdById: alice.id,
    },
  });

  await prisma.expenseSplit.createMany({
    data: [
      { expenseId: lunchExpense.id, userId: alice.id, amountOwed: 100.00 },
      { expenseId: lunchExpense.id, userId: bob.id, amountOwed: 100.00 },
      { expenseId: lunchExpense.id, userId: charlie.id, amountOwed: 100.00 },
    ],
  });

  // Add a sample comment
  await prisma.comment.create({
    data: {
      expenseId: lunchExpense.id,
      userId: bob.id,
      message: 'Thanks for paying Alice! I will settle up tonight.',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
