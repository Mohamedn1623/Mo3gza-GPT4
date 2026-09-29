# LapGPT

## Deployment on Vercel

1. Push the project to GitHub.
2. Create a new Vercel project and connect the repository.
3. In Vercel > Project Settings > Environment Variables, add:
   - `SUPABASE_URL=https://your-project.supabase.co`
   - `SUPABASE_SECRET_KEY=your-server-only-secret-key` (or the legacy `SUPABASE_SERVICE_ROLE_KEY`)
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=your-email@gmail.com`
   - `SMTP_PASSWORD=your-gmail-app-password`
   - `EMAIL_TO=your-recipient@example.com`
   - `EMAIL_FROM=LapGPT <your-email@gmail.com>`
   - `APP_URL=https://your-vercel-domain.vercel.app`
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` (use the values from your private local `.env`, with a random session secret of at least 32 characters)
4. Deploy.

Before deploying, run `server/data/supabase-schema.sql` in the Supabase SQL Editor. Production deliberately refuses to save records to temporary local files when Supabase is missing. Copy the Gmail SMTP and admin login variables from your private `.env` into Vercel as well; local `.env` values are not uploaded automatically. Check `https://your-domain/api/health`; it must return `ok: true` with `checks.storage: "supabase"`, `checks.email: true`, and `checks.admin: true` before accepting orders.

## Email setup

For Gmail, use an App Password rather than the normal password.

## Local development

- `npm install`
- `npm run server` serves the built site and API together at `http://localhost:4000`.
- `npm run dev` starts the Vite development site at `http://localhost:5173`; run `npm run server` in a second terminal for API requests.

## Run the production site locally

- `npm start` builds the site and serves the frontend and API together at `http://localhost:4000`.

## Admin dashboard

- Open `http://localhost:4000/admin` and sign in with `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
- Create a Supabase project, then run `server/data/supabase-schema.sql` in its SQL editor.
- Copy `SUPABASE_URL` and the server-only `SUPABASE_SECRET_KEY` into `.env` (older projects may use `SUPABASE_SERVICE_ROLE_KEY`). Keep this key out of frontend variables and GitHub.
- Set a private `ADMIN_USERNAME`, a strong `ADMIN_PASSWORD`, and a random `ADMIN_SESSION_SECRET` (at least 32 characters).
- Configure Gmail SMTP with a Gmail App Password using `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_HOST=smtp.gmail.com`, and `SMTP_PORT=587` to email customers.
- For SMS, create a Twilio account and set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, plus either `TWILIO_FROM_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID`.
- In Vercel, add the same variables under **Project Settings → Environment Variables**, then redeploy. Do not add secrets to `VITE_*` variables.

When Supabase is configured, orders, service requests, replies, and contact messages use its persistent `lapgpt_records` table. Without Supabase, local development falls back to JSON files under `server/data`.
