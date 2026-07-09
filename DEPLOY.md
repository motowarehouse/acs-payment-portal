# Deployment Guide — Motowarehouse ACS Payments

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Railway)
- **Auth**: NextAuth.js (credentials, database-backed, 2 accounts)
- **Charts / Excel**: Recharts, SheetJS (xlsx)
- **Deployment**: Railway (or any Node host)

This app matches the visual style of the Motowarehouse Insurance and Staff Leave
apps (same teal/navy palette, Lato font, sidebar layout), but it is a fully
separate application with its own login and database.

---

## Step 1: Set Up the Database

1. Go to [Railway](https://railway.app) → New Project → add a **PostgreSQL** plugin
   (or reuse any Postgres instance you already have — but give this app its **own**
   database, separate from the leave/insurance apps).
2. Copy the connection string — you'll need it as `DATABASE_URL`.

## Step 2: Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL     = (your Postgres connection string)
NEXTAUTH_SECRET  = (run: openssl rand -base64 32)
NEXTAUTH_URL     = https://your-app.up.railway.app  (or http://localhost:3000 locally)

ADMIN1_USERNAME  = (choose a username, e.g. nikolas)
ADMIN1_PASSWORD  = (choose a strong password)
ADMIN1_NAME      = Nikolas

ADMIN2_USERNAME  = (second account, e.g. owner)
ADMIN2_PASSWORD  = (choose a strong password)
ADMIN2_NAME      = Owner
```

The ADMIN1/ADMIN2 variables are only read once, by the seed script, to create the
two login accounts. Change the passwords before seeding.

## Step 3: Install, Migrate, Seed (local)

The easy way on Windows: double-click **`setup.bat`** (it runs the three commands
below), then **`start.bat`**. Or manually:

```bash
cd acs-payment-portal
npm install
npx prisma db push     # create the database tables
npm run db:seed        # create the 2 login accounts
npm run dev            # run locally at http://localhost:3000
```

## Step 4: Push to GitHub

1. Create an empty repository named **`acs-payment-portal`** under the
   `motowarehouse` GitHub account (no README/gitignore — the push adds those).
2. Double-click **`push-to-github.bat`**. Sign in to GitHub if prompted.

## Step 5: Deploy to Railway

1. Railway → New Project → **Deploy from GitHub** → pick `acs-payment-portal`.
2. Attach the PostgreSQL plugin.
3. Set the environment variables from Step 2 on the Railway service.
4. Railway runs `prisma generate && next build` automatically (see `package.json`),
   then `npx prisma db push && npm run start` (see `railway.json`).
5. After the first deploy, run `npm run db:seed` once via Railway's shell/CLI to
   create the two login accounts.

---

## How It Works

- **Import → File 1 (Shipments)**: the daily `ΑΝΑΖΗΤΗΣΗ ΑΠΟΣΤΟΛΩΝ` Excel export.
  Each row is stored and classified as **outbound** (we are the sender → a client
  owes the COD) or **inbound** (we are the recipient → informational). Outbound COD
  rows start as *Awaiting payment*. Duplicate tracking numbers in a file are flagged.
- **Import → File 2 (Cash/Visa)**: the ACS *Notification of Payment* file. Each row
  is matched to its shipment by tracking number and recorded as a payment. Because
  ACS does not split cash vs visa per row, these import as **Cash/Visa (ACS)**; you
  can reclassify a line to Cash or Visa on the shipment if you know which.
- **Cheques**: entered manually (bank, cheque number, amount, date) against a
  shipment, since the ACS cheque list arrives as a scanned document.
- **Reconciliation**: a shipment is **Paid** when its payments sum to the COD,
  **Partially paid** when less (split tender across cash/card/cheque is supported),
  and an **Exception** when overpaid or when a payment has no matching shipment.
  Status is editable, including **Returned / Uncollected** for packages ACS returns.
- **Dashboard**: outstanding COD, today's reconciliation, status breakdown,
  shipments list with filters, exceptions queue, and per-customer totals.

The single key that links all three files is the **ACS tracking / AWB number**
(`Αριθμός Αποδεικτικού` in File 1, `ACS AWB NUMBER` in File 2, `POD Δ.Δ.` in File 3).

## Adding More Accounts Later

The two seeded accounts live in the `User` table (bcrypt-hashed). To add a third,
insert a row via `npx prisma studio` or extend `prisma/seed.ts` — there's no
per-seat UI, since the brief called for two logins.

## A Note on This Build

This project was developed and verified in a sandboxed environment without access
to Prisma's binary CDN (`binaries.prisma.sh`), so the Prisma query engine could not
be downloaded there. The application compiled cleanly (`✓ Compiled successfully`)
and its core reconciliation logic was verified with standalone tests against the
real ACS sample files (22/22 checks passed). Running `npm install` / `setup.bat` on
your own machine or on Railway (both have normal internet) lets `prisma generate`
complete fully — a routine step, not expected to cause issues.
