# PROMPTS.md — Key Prompts Log

## Prompt: Setup and Scaffolding
**I asked:**
> "i attach one redme file , read it carefully and complete this assignment  with good ui, design, and complete"

**AI did / responded:**
- Analyzed the evaluation guidelines in `HOW_TO_COMPLETE_ASSIGNMENT.md`.
- Formulated a full implementation plan.
- Scaffolded the Next.js project with Prisma, SQLite, and TypeScript, including a custom styling template.
- Outlined documentation templates: `AI_CONTEXT.md`, `BUILD_PLAN.md`, `PROMPTS.md`, and `README.md`.

---

## Prompt: Schema Migration & Seeding
**I asked:**
> Run prisma initial migrations and database seeding.

**AI did / responded:**
- Ran `npx prisma migrate dev --name init` creating the SQLite schema structure.
- Created `prisma/seed.ts` to register Alice, Bob, Charlie and create group 'Ski Trip 2026' with a default Equal split lunch transaction.
- Ran `npx prisma db seed` to insert the data.

---

## Prompt: Testing and Validation
**I asked:**
> Start Next.js development server and verify application features (auth, unequal splits, comments chat, settle ups) via browser subagent.

**AI did / responded:**
- Booted Next.js dev server with `npm run dev` in background.
- Launched the browser subagent to run a sequence of UI interactions: logged in, navigated to group, added ₹900.00 Unequal Split Dinner Party, created chat comments, settled ₹100.00 repayment, and captured visual screenshots.
