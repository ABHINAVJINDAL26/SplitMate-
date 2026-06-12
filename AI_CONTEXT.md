# AI_CONTEXT.md — Splitwise Clone

## 1. Product Understanding
Splitwise is a group expense-sharing application that keeps track of shared expenses, payments, and balances. 
- **Groups**: A collaborative boundary where members can log expenses and settlements.
- **Expenses**: Shared costs where one member pays and the group splits it (Equally, Unequally, by Percentage, or by Shares).
- **Balances**: The net amount that each group member owes or is owed by other members inside the group.
- **Settlement**: Recording a peer-to-peer payment to net out outstanding debts.
- **Chat/Comments**: Discussions on individual expenses for context.

---

## 2. Product Scope (MVP)
- **User Authentication**: Simple email/password sign-up and login with cookie-based JWT sessions.
- **Group Management**: Creating groups, inviting members, listing group memberships.
- **Expenses Creation**: Adding expenses with descriptions, total amount, payer, and supporting four split types:
  - **Equal**: Divides total by number of splits.
  - **Unequal**: Specific currency amounts for each participant.
  - **Percentage**: Divides cost by custom percentages summing to 100%.
  - **Shares**: Divides cost by ratios of shares.
- **Group & Individual Balances**: Displays who owes whom in each group, and overall balances on the dashboard.
- **Settle Up / Payments**: Recording payments from User A to User B to reduce active debts.
- **Expense Comments**: Comment thread under each expense.

---

## 3. Out of Scope
- Multi-currency support (Defaulting to INR / ₹).
- Debt Simplification Algorithm (simplified repayments are calculated group-wise on-the-fly, but global multi-group minimization is out of scope).
- Push notifications / Email alerts.
- Image uploads (receipt OCR).
- Group roles/permissions (all group members have admin capabilities for MVP).
- Non-group expenses (all expenses must belong to a group).

---

## 4. User Personas
- **Group Creator**: A registered user who initializes a group and invites other members.
- **Group Member**: A user registered under a group who contributes to shared expenses, makes settlements, and chats.

---

## 5. Implementation Decisions
- **Relational DB**: SQLite was chosen for a relational model that does not require the user to configure external Postgres databases.
- **On-the-fly Balances**: Summing expense splits and subtracting settlements on the fly in database queries to avoid write-race conditions on static balance fields.
- **Real-time Comments**: Low-overhead HTTP short polling (every 4 seconds) on the frontend.
- **Authentication**: JWT token stored in an HTTP-only secure cookie, keeping the authorization state secure and standard.

---

## 6. Tech Stack
- **Frontend/Backend**: Next.js (App Router, React Server Components, TypeScript).
- **ORM**: Prisma Client.
- **Database**: SQLite (`prisma/dev.db`).
- **Styling**: Modern Vanilla CSS, CSS Variables, and Glassmorphism design tokens (no Tailwind CSS).

---

## 7. Database Schema
Defined in [schema.prisma](file:///c:/Users/jabhi/Desktop/Splitwise%20Clone/prisma/schema.prisma):
- `User`: id, name, email, passwordHash, avatarUrl, createdAt
- `Group`: id, name, description, createdById, createdAt
- `GroupMember`: id, groupId, userId, joinedAt
- `Expense`: id, groupId, description, totalAmount, paidById, splitType, createdById, createdAt
- `ExpenseSplit`: id, expenseId, userId, amountOwed, shareValue, percentage
- `Settlement`: id, groupId, fromUserId, toUserId, amount, note, createdAt
- `Comment`: id, expenseId, userId, message, createdAt

---

## 8. API Design
- `POST /api/auth/register` - Create user.
- `POST /api/auth/login` - Login and receive JWT cookie.
- `POST /api/auth/logout` - Clear JWT cookie.
- `GET /api/auth/me` - Fetch profile details.
- `GET /api/groups` - List groups the user belongs to.
- `POST /api/groups` - Create a group.
- `POST /api/groups/[id]/members` - Invite a user to a group by email.
- `DELETE /api/groups/[id]/members` - Remove a user from a group (creator/admin only, requires settled balance).
- `GET /api/groups/[id]/expenses` - List group expenses and settlements.
- `POST /api/groups/[id]/expenses` - Add a new expense (with split checks).
- `PUT /api/expenses/[id]` - Edit expense (creator/group admin only).
- `DELETE /api/expenses/[id]` - Delete expense (creator/group admin only).
- `GET /api/groups/[id]/balances` - Calculate group member balances and simplified debt paths.
- `POST /api/settlements` - Log a settle-up payment.
- `GET/POST /api/expenses/[id]/comments` - List or create comments on an expense.

---

## 9. Frontend Structure
- `/auth`: Login & Register page.
- `/`: Main dashboard. Lists groups on the left, balances on the right, and invites.
- `/groups/[id]`: Group detail page (member list, transaction history, group balance charts, settlement forms, expense creation forms).
- `/expenses/[id]`: Details of an expense including split breakdown and comments chat thread.

---

## 10. Deployment Plan
- **Frontend/Backend**: Vercel.
- **Database**: Prisma SQLite is bundled locally. For production deployment, switching to Neon Postgres or Supabase is as simple as updating `DATABASE_URL` in env vars and replacing `provider = "sqlite"` with `provider = "postgresql"` in `schema.prisma`.

---

## 11. Testing Plan
- **Manual Verification**:
  1. Add lunch of ₹300 split equally among A, B, C. Check if each owes ₹100.
  2. Add taxi of ₹150 split unequally: A owes ₹100, B owes ₹50. Verify balances.
  3. Add dinner of ₹1000 split by percentage: A owes 50%, B owes 30%, C owes 20%.
  4. Add groceries of ₹600 split by shares: A gets 0 shares, B gets 2 shares, C gets 1 share.
  5. Settle up between A and B, check if balance reflects settlement immediately.
  6. Post chat comments and verify they poll and display in the thread.

---

## 12. Tradeoffs & Known Limitations
- **SQLite**: Local file database. Fine for development, but must be migrated to Postgres for production deployment on serverless platforms (e.g. Vercel) since SQLite is ephemeral on stateless platforms.
- **Short Polling**: Chat comments poll every 4 seconds instead of true WebSockets. This was chosen for simplicity in a 2-day MVP build to ensure full serverless compatibility without external socket infrastructure.
- **Placeholder User Registration**: Adding a user to a group by email who is not registered auto-creates an account with a default password ("Password123!") as an MVP shortcut. In a production app, this should create a "pending invite" state (placeholder user, no login access until claimed via email verification link).

---

## 13. Changelog
- **2026-06-12**: Initial project scaffolding with Next.js App Router, SQLite, and Prisma. Completed schema definition and initial documentation structure.
- **2026-06-12**: Implemented user authentication JWT routes, Group CRUD, Member invitations, mathematical splits calculations, dynamic balances calculations, settlements, and expense chat comments.
- **2026-06-12**: Created modern global stylesheets with Outfit typography, glassmorphism panel styles, and colored financial states. Configured full-fidelity dashboard views.
- **2026-06-12**: Seeding complete and verified application functionality with browser subagent testing unequal splits, settlements, and comments.

---

## 14. Prompts & AI Responses Log
Refer to [PROMPTS.md](file:///c:/Users/jabhi/Desktop/Splitwise%20Clone/PROMPTS.md).
