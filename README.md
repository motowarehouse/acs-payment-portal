# Motowarehouse ACS Payments

A reconciliation portal for K.S. Kyprianou Moto Warehouse Ltd. It tracks the ACS
shipments delivered to clients and matches the COD payments (cash / visa / cheque)
back to each shipment automatically, by tracking number.

## What it does

- **Import File 1 (Shipments)** — the daily `ΑΝΑΖΗΤΗΣΗ ΑΠΟΣΤΟΛΩΝ` Excel export. Each
  row is stored, its direction (outbound to a client vs inbound to us) is detected,
  and outbound COD rows start as *Awaiting payment*. Duplicate tracking numbers in a
  file are flagged.
- **Import File 2 (Cash/Visa payments)** — the ACS *Notification of Payment* file.
  Each row is matched to its shipment by tracking number and recorded as a payment.
  Unmatched rows and amount mismatches are flagged.
- **Cheques** — entered manually (bank, cheque number, amount, date) against a
  shipment, since the ACS cheque list arrives as a scanned document.
- **Reconciliation** — a shipment is `Paid` when its payments sum to the COD,
  `Partially paid` when less (split tender across cash/card/cheque is supported),
  and an `Exception` when overpaid. Statuses can be edited manually, including
  marking a package `Returned / Uncollected`.
- **Dashboard** — outstanding COD, today's reconciliation, status breakdown,
  shipments list with filters, exceptions queue, and per-customer totals.

## Stack

Next.js 14 · Prisma · PostgreSQL · NextAuth (2 logins) · Tailwind · Recharts ·
SheetJS. Same family as the leave and insurance apps, reusing the CFMOTO design system.

## Running it locally

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (Railway Postgres),
   `NEXTAUTH_SECRET` (run `openssl rand -base64 32`), and the two login accounts.
2. Double-click **`setup.bat`** once (installs, creates tables, seeds the 2 logins).
3. Double-click **`start.bat`** and open http://localhost:3000.

## Deploying

Push to GitHub and deploy on Railway (a `railway.json` is included). Set the same
environment variables in the Railway dashboard.
