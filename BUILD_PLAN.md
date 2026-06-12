# BUILD_PLAN.md — Splitwise Clone

## 1. Product Research
- **Splitwise Workflows Studied**:
  - Creating groups and adding members.
  - Adding expenses and specifying splits (Equal, Unequal, Percentages, and Shares).
  - Showing individual owe/owed statements.
  - Recording settlements (direct repayments) between group members.
  - Social chat on expenses for clarification of costs.
- **Assumptions**:
  - Only one currency (INR / ₹) is handled.
  - A user pays the expense, and the remaining participants owe a split of that expense.
  - Settlements are manual records of payments rather than integrated bank transfers.
  - Balances are computed in real-time on query execution rather than stored to avoid synchronization issues.

---

## 2. Architecture
- **Tech Stack**: Next.js App Router (TypeScript), Prisma ORM, and SQLite database.
- **Database Schema**: Structured relations with constraints for `User`, `Group`, `GroupMember`, `Expense`, `ExpenseSplit`, `Settlement`, and `Comment`.
- **API Design**: RESTful JSON endpoints for authentication, group operations, splits calculations, settle ups, and polling chat.
- **Frontend**: Full-width grid layouts, HSL dark/light modes, premium glassmorphism accents, sidebar navigation, dynamic modals for expense additions, and live-polling feed containers.

---

## 3. AI Collaboration Process
- **Initial Direction**:
  - Initiated manually through standard clean package.json configuration to bypass create-next-app filesystem locking bugs on Windows environments.
  - Structured file-by-file roadmap ensuring compliance with instructions.
- **How context is maintained**:
  - Keeping a running `AI_CONTEXT.md` defining database structures, active endpoints, and changes.
  - Linking references back to code coordinates.

---

## 4. Tradeoffs
- **Polling vs WebSockets**: Polling is selected for comment feeds to ensure serverless compatibility.
- **SQLite Database**: SQLite is highly portable, self-contained, and relational. Tradeoff: Ephemeral files on Vercel deployments. To solve this in production, a Postgres DATABASE_URL can be substituted.
- **Single Currency**: Simple INR decimal rounding instead of handling multi-currency conversion rates.
