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
   * *Note: `[YOUR-PASSWORD]` ki jagah wo password likhein jo apne abhi create kiya tha. Agar aapke password me `@` jaisa special character hai, to use URL-encode karein (jaise `@` ko `%40` me badlein).*

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

### Step 3: Automatic Database Initialization
Aapka project deploy hote hi, Vercel **automatically** database me empty tables schema push kar deta hai (chuki build script me `prisma db push` integrated hai).

Isliye aapko manual tables push karne ki koi zarurat nahi hai! Database bilkul **fresh aur empty** (bina seed data ke) live ready ho jayega.

*Note: Agar aap test/showcase ke liye seed demo data (Alice, Bob, Charlie) manually insert karna chahte hain, to apne local computer ke terminal se ye run kar sakte hain:*
```bash
npx prisma db seed
```

---

## 📌 Environment variables list for Local Development (`.env`)

Local run karne ke liye project ke root me `.env` file banayein aur ye paste karein:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
JWT_SECRET="5e8b4df9d97e8876c12361cfba7c53d10c26da7d9284218a"
NODE_ENV="development"
```
