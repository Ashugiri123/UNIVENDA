# UNIVENDA

UNIVENDA now includes a complete role-based authentication flow with separate login and registration routes for student sellers and customers.

## Tech stack

- React 18
- Vite 5
- Vercel serverless API routes
- Supabase Postgres via REST API
- Cookie-based JWT authentication
- Node `crypto.scrypt` password hashing
- AES-encrypted student-sensitive registration fields

## Auth flow

1. Users can open `/auth/seller` or `/auth/customer` to log in.
2. Each login page contains `Register if you are new`, which routes to registration.
3. `/register` is the role-selection step before onboarding.
4. `/register/seller` shows the detailed student seller form.
5. `/register/customer` shows the quick customer form.
6. Successful registration auto-logs the user in and redirects to the correct dashboard.
7. Protected dashboards re-check the role on every request.

## Required environment variables

- `STRIPE_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_JWT_SECRET`
- `AUTH_DATA_SECRET`
- `VITE_STRIPE_PRICE_DESCRIPTION`
- `VITE_STRIPE_PRICE_AMOUNT`
- `VITE_STRIPE_CURRENCY`

## Supabase setup

Run `supabase/schema.sql` against your Supabase project. The `users` table now stores:

- role and capabilities
- customer profile fields
- student onboarding fields
- encrypted `sensitive_profile` payloads for Aadhaar, bank data, profile photo, and approval document
- verification status for student sellers

## API routes

- `POST /api/auth/seller/signup`
- `POST /api/auth/seller/login`
- `POST /api/auth/customer/signup`
- `POST /api/auth/customer/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/seller/dashboard`
- `GET /api/customer/dashboard`
