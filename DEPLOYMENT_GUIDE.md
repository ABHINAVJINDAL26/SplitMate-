# Splitwise Clone — Production Deployment Guide (Hinglish)

Ye guide is Next.js + Prisma application ko production me deploy karne ka **sabse secure aur industry-standard** method batati hai. Hum **Vercel (for Frontend/API hosting)** aur **Supabase (for free PostgreSQL Database)** ka use karenge.

Aap niche diye gaye steps ko direct follow karke copy-paste kar sakte hain.

---

## 🚀 Step-by-Step Deployment Guide (Vercel + Supabase)

### Step 1: Create a Free PostgreSQL Database on Supabase
1. Go to [Supabase](https://supabase.com/) and sign up.
2. Click **New Project** and select a name (e.g., `SplitMate`).
3. Database Password create karein aur use safe jagah copy kar lein.
4. Project create hone ke baad:
   * Left menu me **Settings (gear icon) > Database** par click karein.
   * Page ko scroll karke **Connection string** section me jaaein.
   * **URI** tab select karein aur connection string URL copy karein. connection string aisi hogi:
     ```env
     postgresql://postgres:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   * *Note: `[YOUR-PASSWORD]` ki jagah wo password likhein jo apne abhi create kiya tha.*

---

### Step 2: Deploy on Vercel
1. Go to [Vercel](https://vercel.com/) and login with GitHub.
2. Click **Add New > Project** button.
3. Import your GitHub repository `SplitMate-`.
4. **Environment Variables** section me jaaein aur niche diye gaye values ko copy-paste karein:

| Key | Value (Paste Here) | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true` | Supabase connection URI |
| `JWT_SECRET` | `5e8b4df9d97e8876c12361cfba7c53d10c26da7d9284218a` | Secret key for auth |
| `NODE_ENV` | `production` | Run mode |

5. Click **Deploy** button. Vercel automatically project build karke deploy kar dega!

---

### Step 3: Initialize Database (Tables & Seed Data)
Aapka project deploy hone ke baad, database me tables aur start data (Alice, Bob, Charlie seed accounts) initialize karne ke liye apne local terminal me baseline setup command run karein:

1. Tables push karne ke liye:
   ```bash
   npx prisma db push
   ```
2. Demo users create karne ke liye:
   ```bash
   npx prisma db seed
   ```

Aapki application live hai aur secure logging systems ready hain!

---

## 📌 Environment variables list for Local Development (`.env`)

Local run karne ke liye project ke root me `.env` file banayein aur ye paste karein:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
JWT_SECRET="5e8b4df9d97e8876c12361cfba7c53d10c26da7d9284218a"
NODE_ENV="development"
```
