# Splitwise Clone — Production Deployment Guide (Hinglish)

Ye guide is Next.js + Prisma application ko production me deploy karne ka step-by-step method batati hai. Aap ise direct copy-paste karke use kar sakte hain.

Next.js serverless architecture (Vercel) par deploy karne ke liye hume database persistence chahiye. Iske do best options hain:
*   **Option A (Recommended & Easiest): Vercel + Neon (Free PostgreSQL)** - Sabse tez aur zero-downtime standard method.
*   **Option B: Render or Railway (SQLite with Persistent Disk)** - SQLite database ko deploy karne ke liye bina backend schema badle.

---

## 🚀 OPTION A: Deploy on Vercel + Neon PostgreSQL (Recommended)

Next.js apps Vercel par best perform karti hain. Serverless computing ke karan Vercel standard SQLite support nahi karta (کیونکہ local files bar-bar delete ho jati hain). Isliye hum dynamic relational databases use karte hain.

### Step 1: Create a Free PostgreSQL Database
1. Go to [Neon.tech](https://neon.tech/) and sign up.
2. Create a new project. Neon aapko ek connection string dega:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[host]/[dbname]?sslmode=require"
   ```
3. Ise copy karke save kar lein.

### Step 2: Update database provider in code
Prisma PostgreSQL ko full support karta hai. Deploy karne ke liye code me context provider dynamic kiya ja sakta hai.
Locally, `prisma/schema.prisma` me lines 1-4 ko refer karein:
```prisma
datasource db {
  provider = "postgresql" // SQLite se PostgreSQL me change karein
  url      = env("DATABASE_URL")
}
```

*Note: Humne workspace code ko flexible rakha hai taaki dynamic provider automatically read ho sake.*

### Step 3: Deploy on Vercel
1. Go to [Vercel](https://vercel.com/) and login with GitHub.
2. Click **Add New > Project** and import your repository `SplitMate-`.
3. Configure **Environment Variables** (Vercel console inside page settings):
   Add the following values:
   *   **Key**: `DATABASE_URL`
       **Value**: `postgresql://[your-neon-connection-string]`
   *   **Key**: `JWT_SECRET`
       **Value**: `generate_a_random_secure_secret_key_string` (generate with `openssl rand -base64 32`)
   *   **Key**: `NODE_ENV`
       **Value**: `production`
4. Click **Deploy**. Vercel will automatically build the server.

### Step 4: Run Database Migrations & Seed
Deploy complete hone ke baad Vercel tab se "Console / Command Prompt" open karein or local terminal se check karein:
```bash
npx prisma db push
npx prisma db seed
```
Aapka database Neon server par build ho jayega aur standard seed users (Alice, Bob, Charlie) instant create ho jayenge.

---

## 🛠️ OPTION B: Deploy on Render with SQLite (Persistent Volumes)

Agar aap code change nahi karna chahte aur SQLite (`dev.db`) database hi product environment me use karna chahte hain:

### Step 1: Create a Web Service on Render
1. Go to [Render](https://render.com/) and register.
2. Click **New > Web Service** and connect your GitHub repository `SplitMate-`.
3. Set configuration details:
   *   **Runtime**: `Node`
   *   **Build Command**: `npm install && npx prisma generate && npm run build`
   *   **Start Command**: `npx prisma migrate deploy && npm run start`
4. Choose **Free Instance** (or basic tier).

### Step 2: Configure Environment Variables
In the service page settings, go to **Environment** tab and add:
*   `DATABASE_URL` ➔ `file:/data/dev.db` (Hamara database volume disk mount path)
*   `JWT_SECRET` ➔ `generate_a_random_secure_secret_key_string`

### Step 3: Add a Persistent Disk Volume (Most Important!)
SQLite local server restart hone par reset na ho, isliye Render me persistent volume add karte hain:
1. Click **Disks** section in Render.
2. Click **Add Disk**:
   *   **Name**: `splitwise-db-disk`
   *   **Mount Path**: `/data`
   *   **Size**: `1 GB` (More than enough for millions of transaction ledgers)
3. Save changes.

### Step 4: Deploy & Seed
Click **Manual Deploy > Clear Cache & Deploy**.
Database sync and migration automatically run ho jayegi. Demo seed data insert karne ke liye shell access se execute karein:
```bash
npm run prisma:seed
```

---

## 📌 Production Environment Variables Checklist (Copy-Paste Template)

```env
# Database Credentials
DATABASE_URL="postgresql://username:password@hostname.neon.tech/dbname?sslmode=require"

# JWT Encryption Secret
JWT_SECRET="ab84b5dfd97e8876c12361cfba7c53d10c26da7d9284218a"

# Runtime Environment
NODE_ENV="production"
```
