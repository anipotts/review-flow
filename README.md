# MaMaDigital

A review collection system for DadaDigital. Send beautiful star-rating emails to customers after service — 5-star clicks route to Google Reviews, 1-4 stars route to the client's contact page.

## How It Works

```
Send Email → Customer clicks star → 5★ → Google Reviews
                                  → 1-4★ → Client contact page
                                  → Click logged in analytics
```

## Developer Quick Start

```bash
# Clone
git clone https://github.com/anipotts/mamadigital.git
cd mamadigital

# Install
npm install

# Environment variables
cp .env.example .env.local
# Fill in your Supabase + Resend credentials

# Run the database migrations
# Copy contents of supabase/migrations/*.sql
# and run in your Supabase SQL Editor

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Setup Guide

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → paste and run all migrations in `supabase/migrations/`
3. Copy your project URL and anon key from Settings → API

### 2. Resend

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain (e.g. `dadadigital.com`)
3. Create an API key

### DNS for dadadigital.com

Add these DNS records for Resend email sending:

| Type  | Name                          | Value                          |
|-------|-------------------------------|--------------------------------|
| TXT   | `resend._domainkey`           | _(provided by Resend)_         |
| TXT   | `@`                           | _(SPF record from Resend)_     |
| CNAME | `em.dadadigital.com`          | _(provided by Resend)_         |

### 3. Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `RESEND_API_KEY` | Resend API key (or configure in Settings UI) |
| `EMAIL_FROM` | Sender address (e.g. `MaMaDigital <feedback@dadadigital.com>`) |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `https://mamadigital.dadadigital.com`) |
| `ADMIN_PASSWORD` | Dashboard login password (or configure in Settings UI) |
| `WEBHOOK_SECRET` | Secret for Acuity webhook integrations |
| `CRON_SECRET` | Secret for weekly cron job |

### 4. Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy

### 5. First Review

1. Log in at `/login` with your `ADMIN_PASSWORD`
2. Add a client (you'll need a [Google Place ID](https://developers.google.com/maps/documentation/places/web-service/place-id))
3. Go to "Send Reviews" → enter a customer name/email → send
4. Check your inbox and click a star

## Tech Stack

- **Next.js 16** (App Router, Server Components)
- **Supabase** (PostgreSQL database)
- **Resend** + **React Email** (transactional emails)
- **Tailwind CSS v4** (styling)
- **TypeScript**

## FAQ

**How do I find a Google Place ID?**
Use the [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder).

**Can I send bulk emails?**
Yes — use the "Bulk CSV" mode on the Send page. Upload any CSV with name and email columns — smart detection handles various column names.

**What happens if a customer clicks multiple stars?**
Each click is logged as a separate event. The review request status shows the most recent click.

**How is auth handled?**
Simple password auth via Settings or environment variable. A single HTTP-only cookie is set on login. There's no user registration — it's a single-admin system.

**Can I change API keys without redeploying?**
Yes — use the Settings page in the dashboard. Changes take effect within 60 seconds.
