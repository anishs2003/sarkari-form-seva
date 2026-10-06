# Student Form Service Portal

A production-ready Next.js platform for students to discover official government jobs, forms, scholarships, and results, while also accessing a paid form-filing and document-processing service.

## Included architecture

- Public portal for notifications and opportunities
- Automatic ingestion workflow for official sources
- Manual onboarding and publishing workflow
- Pending review before publication
- Student registration and dashboard
- Application tracking with payment verification flow
- Admin dashboard for notifications and applications
- Secure document storage design with Supabase Storage
- SEO metadata, sitemap, and robots support
- Responsive mobile-first UI with Tailwind CSS

## Quick start

1. Install dependencies:

   npm install

2. Copy environment variables:

   cp .env.example .env.local

3. Add your Supabase values.

4. Run the app:

   npm run dev

5. Open http://localhost:3000

## Supabase setup

- Create a Supabase project.
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for public reads. Set `SUPABASE_SECRET_KEY` only in the server environment; it bypasses RLS and is never sent to browser code.
- Admin login does not use Supabase Auth. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` on the server; the existing `public.users` and `public.admins` tables authorize that email. Passwords are not stored in either table. Run `node sarkariformseva/scripts/create-admin-password-hash.mjs` from the workspace root to update the hash locally without printing it.
- Configure `NOTIFICATION_PDF_MAX_SIZE_MB` (defaults to 10 MB), `PAYMENT_SCREENSHOT_MAX_SIZE_MB` (defaults to 5 MB), and `APPLICATION_DOCUMENT_MAX_SIZE_MB` (defaults to 5 MB). Admin uploads, student application documents, and payment screenshots use the private `documents` bucket and server APIs.
- Set `NEXT_PUBLIC_PAYMENT_QR_URL` to the publicly accessible image URL for the service-charge QR code and `NEXT_PUBLIC_PAYMENT_UPI_ID` to the matching UPI ID. Never include a QR for official government fees.
- Run `supabase/schema.sql`, then apply the files in `supabase/migrations/` in filename order. For the project where Forms and Notifications are currently missing, `20261002_forms_notifications_admin.sql` creates/extends those same tables and installs the public read-only RLS policies.
- Form create/edit/publish/unpublish/delete, linked PDF changes, and service-charge changes are written to `audit_logs` with the authenticated admin user ID and form ID; apply `20260930_admin_form_audit_log.sql` on existing projects.
- The homepage reads published notifications from Supabase, ordered by `published_at`; apply the schema updates to an existing project before deployment.
- Create a private storage bucket named `documents`; the schema also ensures this bucket is private. Notification PDFs are stored there and are never written to browser storage.
- Create the first admin without Supabase Auth:
   1. From the workspace root, run `node sarkariformseva/scripts/create-admin-password-hash.mjs`. Enter and confirm the password directly in the terminal; the script writes its scrypt hash to server-only `ADMIN_PASSWORD_HASH` in `sarkariformseva/.env.local` without displaying it. Set `ADMIN_EMAIL` to the matching address. Restart the dev server.
   2. In Supabase SQL Editor, create the authorization record (replace the email/name):

     ```sql
       INSERT INTO public.users (email, role)
       VALUES ('admin@example.com', 'admin')
       ON CONFLICT (email) DO UPDATE
          SET role = 'admin',
           updated_at = NOW();

     INSERT INTO public.admins (user_id, full_name, role)
   SELECT users.id, 'Portal Administrator', 'admin'
     FROM public.users AS users
    WHERE users.email = 'admin@example.com'
      AND NOT EXISTS (
      SELECT 1 FROM public.admins AS existing WHERE existing.user_id = users.id
             );
     ```

   `public.admins.user_id` references `public.users.id`. Assign `admin` or `staff` in `public.users` and, when present, `public.admins`.
- Visit `/admin/login` and use the configured `ADMIN_EMAIL` and original password. Admin pages and APIs verify the signed HttpOnly session and current database role. Sign out clears the session cookie.
- Required environment variables are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD_HASH`. Never prefix the secret key with `NEXT_PUBLIC_` or include it in browser code or logs. Restart the dev server after changing `.env.local`.

## Deployment

This project is designed for Vercel deployment. Add the environment variables from `.env.example` in your Vercel project settings, then deploy the repo.

## Cron / scheduled fetching

Set up a Vercel cron or scheduled worker to call the notification ingestion endpoint every hour. Example route:

- `/api/cron/fetch-notifications`

## Files to customize

- `app/page.tsx` – homepage and portal sections
- `app/notifications/page.tsx` – public notification listing
- `app/admin/page.tsx` – admin dashboard
- `app/student/dashboard/page.tsx` – student dashboard
- `supabase/schema.sql` – Postgres schema for the application
- `.env.example` – environment configuration template

## Important implementation note

Forms and Notifications use the existing `public.forms` and `public.notifications` tables. Public clients use the publishable key and RLS; privileged writes use `SUPABASE_SECRET_KEY` only in server routes. Admin login uses a server-side scrypt password hash and a signed HttpOnly session, not Supabase Auth. Apply the schema and migrations before testing.
