# Splitwise Clone

A clean, responsive, and robust Splitwise Clone with a high-fidelity visual UI, built in Next.js + React + Prisma + SQLite.

## Deployed URL
[Live Demo Link (Placeholder)]

## Tech Stack
- **Frontend**: Next.js App Router (React, TypeScript)
- **Backend**: Next.js API Routes
- **Database**: SQLite (relational)
- **ORM**: Prisma Client
- **Realtime / Chat**: HTTP Short Polling
- **Styling**: Vanilla CSS (and CSS Modules) with premium custom HSL colors, glassmorphism, and responsive layouts.

## AI Tool Used
Antigravity (Google DeepMind pair programming assistant) - used as the primary development collaborator, utilizing `AI_CONTEXT.md` for context synchronization.

## Features
- **Authentication**: JWT cookies for secure sessions (Login/Signup).
- **Group Management**: Create groups and invite other members by email.
- **Split Calculations**: Form-based splits for 4 types: Equal, Unequally (amounts), Percentage, and Shares.
- **Dynamic Balances**: Computes who owes whom inside each group and global balances on dashboard.
- **Settle Up**: Log repayments to net out debts between users.
- **Expense Chat**: Polling-based comment thread under each expense.

## Setup Instructions (Local)

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd "Splitwise Clone"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   JWT_SECRET=super_secret_jwt_key_123456
   DATABASE_URL="file:./prisma/dev.db"
   ```

4. **Run Database Migrations & Seed**:
   ```bash
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```

6. **Open in Browser**:
   Navigate to `http://localhost:3000`.

## Project Documentation
- [AI_CONTEXT.md](file:///c:/Users/jabhi/Desktop/Splitwise%20Clone/AI_CONTEXT.md) — Product and engineering blueprints.
- [BUILD_PLAN.md](file:///c:/Users/jabhi/Desktop/Splitwise%20Clone/BUILD_PLAN.md) — Product research and engineering choices.
- [PROMPTS.md](file:///c:/Users/jabhi/Desktop/Splitwise%20Clone/PROMPTS.md) — Key prompts logged during development.
