# Fire Inspection & Installation System

Production-ready iPad application and admin web portal for a Fire Inspection & Installation company.

## Project Structure

```
FireAppLatest/
├── mobile-app/          # React Native CLI (iPad)
├── admin-portal/        # Next.js 14 admin dashboard
├── backend/             # Supabase Edge Functions
├── Screens/             # Designer UI mockups (reference)
└── SCREENS_ANALYSIS.md  # Screen mapping & missing screens report
```

## Quick Start

### Prerequisites

- Node.js 18+
- Xcode (for iOS/iPad)
- Supabase account
- CocoaPods (`pod install` in mobile-app/ios)

### 1. Install Dependencies

```bash
npm install
```

### 2. (Optional) Configure Supabase

**Demo mode**: The app works without Supabase. Just run it—you'll see seed customers, can create inspections, and data persists in the app.

**Production**: Create `mobile-app/.env` or set in `mobile-app/src/config.ts`:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Mobile App (iPad)

```bash
cd mobile-app
npx react-native run-ios --simulator="iPad Pro 12.9-inch"
```

Or start Metro and run from Xcode:

```bash
npm run mobile   # from root - starts Metro
# Then: npx react-native run-ios
```

### 4. Run Admin Portal

```bash
npm run admin
```

### 5. Apply Database Schema

In Supabase Dashboard → SQL Editor, run the contents of:

```
backend/supabase/migrations/001_initial_schema.sql
```

## iPad App Screens (Implemented)

- **Account Selection** – Existing Account / New Account
- **Login** – Email + password
- **Main Dashboard** – New Installation / New Inspection / View Customers
- **Create Inspection** – 7-step wizard:
  1. Customer Information
  2. System Information
  3. Project Information
  4. Work Progress Phase
  5. System Checks
  6. System Brands
  7. Comments
- **Customers List** – Search and select customers
- **Customer Details** – View customer, new inspection
- **Inspection History** – Past inspections
- **Upload Photos** – Take/upload photos
- **Payment** – Term of Payment (Cash/Card/Invoice)
- **Add Template** – File upload

## Design Reference

All screens follow the designer mockups in the `Screens/` folder. See `SCREENS_ANALYSIS.md` for the full mapping and any screens that were added to meet the spec.

## Tech Stack

- **Mobile**: React Native CLI, TypeScript, React Navigation, Supabase
- **Admin**: Next.js 14, TailwindCSS, Supabase
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)

## SMS Reminders (Twilio)

Inspection due reminders are sent via Twilio SMS:

- **1 month before** due date
- **2 weeks before** due date
- **1 week before** due date

Reminders stop when the customer has an inspection scheduled for that period.

### Setup

1. **Twilio**: Sign up at [twilio.com](https://www.twilio.com), get Account SID, Auth Token, and a phone number.
2. **Env vars** (in `admin-portal/.env.local` or Vercel):

   ```
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1234567890
   CRON_SECRET=your_random_secret  # For Vercel cron auth
   ```

3. **Migration**: Run `supabase db push` (or apply `023_reminder_type.sql`).
4. **Vercel**: Deploy admin-portal; add **all** env vars in the project (including `CRON_SECRET`). Cron runs daily at **9:00 UTC** (`vercel.json`). Vercel injects `Authorization: Bearer <CRON_SECRET>` automatically when `CRON_SECRET` is set—without it, cron returns 401.

### Manual tests

Send a single SMS (same auth as cron):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://your-app.vercel.app/api/test-sms?to=%2B15551234567"
```

Run the full reminder job (dry-run behavior: only sends when `next_service_date` matches the 30/14/7-day windows):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/send-reminders
```

### Production checklist

- **Twilio**: Non-trial account (or trial only sends to [verified numbers](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account)). Complete **A2P 10DLC** (or toll-free verification) for US long-code messaging to real customers.
- **From number**: `TWILIO_PHONE_NUMBER` must be SMS-capable and match your Twilio registration.
- **Duplicate cron**: Vercel may occasionally invoke a cron twice; the job uses DB dedupe, but overlapping runs can still rarely double-send—see [Vercel cron idempotency](https://vercel.com/docs/cron-jobs/manage-cron-jobs#cron-jobs-and-idempotency). For stricter guarantees, add a DB unique constraint on `(customer_id, next_service_date, reminder_type)` and handle conflicts.
- **Supabase Edge Function** `backend/supabase/functions/reminder` is still a stub (TODO)—reminders are implemented in **admin-portal** `/api/cron/send-reminders`, not that function.

## Next Steps

1. Add `react-native-image-picker` for photo capture/gallery
2. Add `react-native-document-picker` for Add Template uploads
3. Integrate Google Places API for address autocomplete
4. Configure SendGrid (email) for optional email reminders
5. Implement Supabase Edge Functions for CSV import
