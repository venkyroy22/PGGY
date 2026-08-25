# PGGY — PG Hostel Management Platform

PGGY is a lightweight SaaS web platform for PG (Paying Guest) and hostel owners to manage their properties, tenants, and rent cycles. It features an automated WhatsApp reminder engine.

## Tech Stack
- **Framework:** Next.js (App Router, JavaScript)
- **Styling:** Tailwind CSS (Claude-style minimal UI)
- **Database:** PostgreSQL
- **ORM:** Prisma 7 (@prisma/adapter-pg)
- **Authentication:** Custom JWT via `jose` and `bcryptjs`
- **WhatsApp API:** Abstracted BSP integration (AiSensy/Interakt)
- **Deployment:** VPS with Nginx & PM2

## Local Development Setup

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy `.env.example` to `.env` and fill in your local Postgres URL and JWT secret:
   ```bash
   cp .env.example .env
   ```

3. **Database Setup:**
   Run Prisma migrations to create the tables in your PostgreSQL database:
   ```bash
   npx prisma migrate dev --name init
   ```
   *(Note: Prisma 7 uses `prisma.config.js` and requires `@prisma/adapter-pg` which is pre-configured in `lib/prisma.js`)*

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

## Production Deployment (VPS)

This app is designed to be deployed on a Linux VPS (e.g., Ubuntu on DigitalOcean/AWS) using PM2 and Nginx.

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start with PM2:**
   We provide an `ecosystem.config.js` for cluster-mode PM2 execution:
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

3. **Nginx Reverse Proxy:**
   Copy the contents of `nginx.conf.example` to your Nginx sites-available directory (e.g., `/etc/nginx/sites-available/pggy`), enable it, and reload Nginx.

4. **Cron Job for Rent Generation & WhatsApp Reminders:**
   Add the following to your server's crontab (`crontab -e`) to trigger rent cycles on the 1st of every month and daily WhatsApp reminders:
   
   ```bash
   # Generate rent cycles on the 1st of every month at 1:00 AM
   0 1 1 * * curl -X POST https://yourdomain.com/api/cron/generate-rent -H "Authorization: Bearer YOUR_CRON_SECRET"

   # Run the WhatsApp reminder engine every day at 10:00 AM
   0 10 * * * curl -X POST https://yourdomain.com/api/cron/send-reminders -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

## Design Philosophy
- **No TypeScript:** Built purely in JavaScript for rapid iteration.
- **Minimalist UI:** Extensive use of whitespace, refined typography (Inter), and subtle borders to create a premium, Claude-like aesthetic.
- **Idempotency:** The cron endpoints are idempotent. Running them multiple times will not create duplicate rent cycles or send duplicate reminders on the same day.
