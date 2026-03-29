# Fire Inspection & Installation App — Design Document

**Version:** 2.0  
**Last Updated:** March 2025  
**Platform:** iPad (React Native), Admin Portal (Next.js), Backend (Supabase)

---

## 1. Project Overview

The Fire Inspection & Installation System is a production-ready application for fire safety companies. It consists of:

- **Mobile App (iPad)** — React Native app for technicians to perform installations, inspections, maintenance, and invoicing in the field
- **Admin Portal** — Next.js web dashboard for administrators
- **Backend** — Supabase (PostgreSQL, Auth, Storage)

The app supports three service types and two entry points:

- **Service types:** Installation, Inspection, Maintenance
- **Entry points:** New Installation (from dashboard), Existing Customer (search → select → choose service type), Create Invoice

---

## 2. Architecture

### 2.1 Monorepo Structure

```
FireAppLatest/
├── mobile-app/          # React Native CLI app (iPad)
│   ├── src/
│   │   ├── components/    # AppButton, FormInput, StepProgress
│   │   ├── config.ts      # Supabase URL & anon key
│   │   ├── navigation/    # RootNavigator
│   │   ├── screens/       # All app screens
│   │   │   └── CreateInspection/  # Wizard step components
│   │   ├── services/      # dataService, demoStore
│   │   ├── supabase/      # Supabase client
│   │   └── theme/         # colors.ts
│   └── ios/               # Xcode project, Pods
├── admin-portal/        # Next.js 14 admin dashboard
├── backend/             # Supabase migrations
│   └── supabase/migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_demo_access.sql
│       ├── 003_demo_users.sql
│       ├── 004_service_types.sql
│       ├── 005_invoices.sql
│       ├── 006_contact_person_and_permissions.sql
│       └── 007_storage_buckets.sql
└── Screens/             # Designer UI mockups (reference)
```

### 2.2 Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native 0.73, TypeScript, React Navigation (native-stack), Hermes |
| State | Local component state, AsyncStorage for session |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Admin | Next.js 14, TailwindCSS |
| Styling | StyleSheet, custom theme (colors.ts) |

### 2.3 Data Flow

- **Demo mode:** When Supabase is not configured, the app uses `demoStore` (AsyncStorage) for customers, inspections, and invoices.
- **Production mode:** When `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in `config.ts`, all data flows through Supabase.
- **Unified API:** `dataService` abstracts both modes — same interface for `getCustomers`, `createCustomer`, `createInspection`, `createInvoice`, etc.

---

## 3. App Flow & Navigation

### 3.1 Navigation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FIRE INSPECTION APP v2                                │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │    LOGIN     │  ← First screen (Technician/Admin, any credentials)
  └──────┬───────┘
         │ Success
         ▼
  ┌──────────────────────────┐
  │       DASHBOARD           │
  │  • New Installation       │
  │  • Existing Customer      │
  │  • Create Invoice         │
  │  • Sign Out               │
  └──┬──────────┬─────────┬───┘
     │          │         │
     │          │         └──────────────────► CreateInvoiceScreen
     │          │
     │          └────────────────────────────► CustomersList (search)
     │                                               │
     │                                               ▼
     │                                        CustomerDetails
     │                                          ├─ New Inspection
     │                                          ├─ New Maintenance
     │                                          ├─ New Installation
     │                                          └─ View History
     │                                               │
     └──────────────────────────────────────────────┼──► CreateInspection (8-step wizard)
                                                     │    serviceType: installation | inspection | maintenance
                                                     └──► InspectionHistory
```

### 3.2 Screen-by-Screen Description

| Screen | Purpose | Key Actions |
|--------|---------|-------------|
| **Login** | Technician or Admin sign-in. Accepts any email/password (demo mode). | Sign In |
| **Dashboard** | Main hub after login. | New Installation, Existing Customer, Create Invoice, Sign Out |
| **CreateInspection** | 8-step wizard for installation/inspection/maintenance. | Complete, Cancel |
| **CreateInvoice** | Create invoice with customer, amount, tax, payment. | Create Invoice, Cancel |
| **CustomersList** | Search (name, phone, address) and browse customers. | Select customer, Create New Customer |
| **CustomerDetails** | View customer info; start new service. | New Inspection, New Maintenance, New Installation, View History |
| **InspectionHistory** | List past inspections for a customer. | Back |
| **UploadPhotos** | Take/upload photos for an inspection. | Back, Complete |

### 3.3 Service Types

| Type | Report Generated | Typical Use |
|------|------------------|-------------|
| **installation** | No | New system install |
| **inspection** | Yes | Periodic inspection |
| **maintenance** | Yes | Maintenance service |

### 3.4 Key Design Decisions

1. **Login first:** Technicians/admins log in; customers are records, not users.
2. **Dashboard:** Single entry point for all workflows (installation, existing customer, invoice).
3. **Existing Customer flow:** Search → select → choose service type (Inspection, Maintenance, Installation).
4. **Create New Customer:** Available from CustomersList; continues into Installation flow.
5. **Sign Out:** On Dashboard screen.

---

## 4. Create Inspection Wizard (8 Steps)

The Create Inspection flow is an 8-step wizard used for installation, inspection, and maintenance.

| Step | Screen | Data Collected |
|------|--------|----------------|
| 1 | Customer Information | Business name, address, city, state, zip, phone, email, store no, fax; **contact person name, phone, email** |
| 2 | System Information | System name/modal, type, **brand, model, serial number**, UL300, cylinder size/location, fuel shut-off, hydrostatic test, recharge dates |
| 3 | Project Information | Project date, installation start/end dates, technician name |
| 4 | Permit Status | Permit applied (bool), application date, status (pending/approved/rejected), approval date, notes, document URL |
| 5 | Work Progress Phase | Completed tasks checklist (control box, nozzles, piping, etc.) |
| 6 | System Checks | Yes/No/NA for each system check item |
| 7 | Inspection Setup | Inspection scheduled (bool), inspection date, result (pass/fail/needs_repair) |
| 8 | Comments | Free-text comments |

- **New Installation:** Step 1 collects full customer info; a new customer record is created on completion.
- **Existing Customer:** Step 1 is pre-filled from the selected customer; no new customer is created.
- **System Brands:** Merged into System Information step (system_brand, system_model, serial_number).

---

## 5. Create Invoice Screen

| Field | Type | Description |
|-------|------|-------------|
| Customer | Picker | Select from existing customers |
| Service Type | Text | installation / inspection / maintenance |
| Invoice Date | Date | Default: today |
| Amount | Numeric | Subtotal |
| Tax | Numeric | Tax amount |
| Total | Numeric | Auto-calculated (amount + tax) |
| Payment Method | Text | cash / card / invoice / check / other |
| Payment Status | Text | paid / pending / overdue |

**Future:** PDF generation, store in Supabase bucket `invoice-pdfs`.

---

## 6. Database Schema (Supabase)

### 6.1 Core Tables

| Table | Purpose |
|-------|---------|
| **users** | Technicians/admins (extends `auth.users`); includes `can_create_installation`, `can_create_inspection`, `can_create_invoice`, `can_view_reports` |
| **customers** | Business name, address, contact, **contact_person_name**, **contact_person_phone**, **contact_person_email**, system type, service dates |
| **projects** | Project name, address, technician, status, dates |
| **inspections** | Customer, project, **service_type**, date, system brand/model/serial, status, phase; **permit_***, **inspection_scheduled**, **inspection_date**, **inspection_result**, **report_url** |
| **invoices** | Customer, project, service_type, amount, tax, total, payment_method, payment_status, pdf_url |
| **systems** | Detailed system config (cylinder, fuel shut-off, test dates) |
| **photos** | Inspection photos |
| **comments** | Inspection comments |
| **payments** | Payment records |
| **reminders** | Reminder tracking |

### 6.2 Migrations

| Migration | Purpose |
|-----------|---------|
| `001_initial_schema.sql` | Core tables, RLS policies |
| `002_demo_access.sql` | Demo access policies |
| `003_demo_users.sql` | Demo user accounts |
| `004_service_types.sql` | service_type, report_url, permit fields, inspection fields on inspections |
| `005_invoices.sql` | invoices table |
| `006_contact_person_and_permissions.sql` | contact_person_* on customers; can_create_* on users |
| `007_storage_buckets.sql` | Documentation for required storage buckets |

### 6.3 Storage Buckets (Create via Supabase Dashboard)

| Bucket | Purpose |
|--------|---------|
| inspection-photos | Photos from inspections |
| inspection-reports | PDF reports for inspection/maintenance |
| permit-documents | Permit documents |
| invoice-pdfs | Invoice PDFs |

---

## 7. Configuration

### 7.1 Supabase (`mobile-app/src/config.ts`)

```typescript
SUPABASE_URL     // Supabase project URL
SUPABASE_ANON_KEY  // Supabase anon/public key
```

- **Demo mode:** Leave empty or use placeholder — app uses `demoStore`.
- **Production:** Set real Supabase credentials.

### 7.2 iOS Bundle Identifier

- **FireApp:** `com.fireapp.inspection`
- **FireAppTests:** `com.fireapp.inspection.FireAppTests`

### 7.3 iPad-Specific Settings

- **Orientation:** Landscape only (`Info.plist`, `UISupportedInterfaceOrientations`)
- **Full screen:** `UIRequiresFullScreen`, `presentation: 'fullScreenModal'`
- **Deployment target:** iOS 13.4+

---

## 8. Components & Styling

### 8.1 Reusable Components

| Component | Purpose |
|-----------|---------|
| **AppButton** | Primary/outline variants, loading state |
| **FormInput** | Labeled text input, error state |
| **StepProgress** | Step indicator for wizard (sidebar) |

### 8.2 Theme (`theme/colors.ts`)

| Token | Value | Usage |
|-------|-------|-------|
| primary | #E91E63 | Active steps, accents |
| accent | #00C6AE | Buttons, links |
| darkGray | #333333 | Headings |
| gray | #757575 | Secondary text |
| background | #FFFFFF | Screen background |
| border | #E0E0E0 | Input borders |

---

## 9. Data Service API

### 9.1 dataService Methods

| Method | Purpose |
|--------|---------|
| `signIn(email, password)` | Login (any credentials accepted) |
| `signOut()` | Clear session |
| `getSession()` | Get current session |
| `getCustomers()` | List all customers |
| `getCustomer(id)` | Get single customer |
| `createCustomer(data)` | Create customer (includes contact person) |
| `getInspections(customerId?)` | List inspections (optionally by customer) |
| `createInspection(payload)` | Create inspection (service_type, permitStatus, inspectionSetup, etc.) |
| `createInvoice(payload)` | Create invoice |

### 9.2 Demo Store (demoStore)

- **Storage keys:** `@fireapp_demo_customers`, `@fireapp_demo_inspections`, `@fireapp_demo_invoices`, `@fireapp_demo_session`
- **Persistence:** AsyncStorage
- **Seed data:** Demo customers on first run

---

## 10. File Reference

| Path | Purpose |
|------|---------|
| `mobile-app/src/config.ts` | Supabase URL & anon key |
| `mobile-app/src/supabase/client.ts` | Supabase client, auth + AsyncStorage |
| `mobile-app/src/navigation/RootNavigator.tsx` | Navigation stack, screen wiring |
| `mobile-app/src/services/dataService.ts` | Unified data API (Supabase/demo) |
| `mobile-app/src/services/demoStore.ts` | In-memory + AsyncStorage demo data |
| `mobile-app/src/screens/DashboardScreen.tsx` | Main dashboard after login |
| `mobile-app/src/screens/CreateInvoiceScreen.tsx` | Invoice creation |
| `mobile-app/src/screens/CreateInspectionScreen.tsx` | 8-step wizard orchestrator |
| `mobile-app/src/screens/CreateInspection/*.tsx` | Wizard step components |
| `backend/supabase/migrations/*.sql` | Database schema |

---

## 11. Run Commands

### 11.1 Mobile App

```bash
cd mobile-app

# Start Metro (keep running)
npx react-native start --reset-cache

# Run on iPad simulator
npx react-native run-ios --simulator="iPad Pro 13-inch (M4)"

# Run on physical iPad (with iPad connected via USB)
npx react-native run-ios --device "samiaa's iPad" --no-packager
# or
npx react-native run-ios --udid <DEVICE_UDID> --no-packager
```

### 11.2 Admin Portal

```bash
cd admin-portal && npm run dev
# → http://localhost:3000 (or 3001–3005 if 3000 in use)
```

### 11.3 Database

Apply migrations via Supabase Dashboard SQL Editor or `supabase db push`.

---

## 12. Prerequisites for Physical iPad Deployment

1. **Apple Developer account** (free Personal Team or paid)
2. **iPad connected** via USB
3. **Developer Mode** on iPad: Settings → Privacy & Security → Developer Mode
4. **Trust computer** when prompted on iPad
5. **Trust developer profile:** Settings → General → VPN & Device Management → Trust
6. **Same Wi‑Fi:** iPad and Mac on same network for Metro
7. **ios-deploy** (optional): `brew install ios-deploy`

---

## 13. Build & Deployment Fixes (Historical)

### 13.1 iOS Build

- **@babel/runtime:** Moved to `mobile-app` dependencies
- **RCTThirdPartyFabricComponentsProvider.mm:** Generated via `generate-provider-cli.js`
- **Code signing:** `CODE_SIGN_STYLE = Automatic`, `DEVELOPMENT_TEAM` in Xcode
- **Bundle ID:** `com.fireapp.inspection` (unique)
- **URL.protocol error:** `react-native-url-polyfill` in `index.js`
- **Sign In stuck:** `CommonActions.reset()` for post-login navigation

### 13.2 iPad UX

- **Full screen:** `presentation: 'fullScreenModal'`, `contentStyle: {flex: 1}`
- **Landscape only:** `Info.plist`, `AndroidManifest.xml`

---

## 14. Future Enhancements

### 14.1 Not Yet Implemented

- **react-native-google-places-autocomplete** — Address autocomplete in customer search
- **Invoice PDF generation** — Store in Supabase bucket `invoice-pdfs`
- **Inspection report PDF** — Auto-generate for inspection/maintenance; store in `inspection-reports`; save URL to `inspections.report_url`
- **Permit document upload** — Supabase Storage `permit-documents`
- **Technician permission checks** — UI enforcement of `can_create_installation`, etc.
- **Admin portal** — Edit technician permissions

### 14.2 From Original README

- `react-native-image-picker` for photo capture/gallery
- `react-native-document-picker` for Add Template uploads
- Twilio (SMS) and SendGrid (email) for reminders
- Supabase Edge Functions for reminders and CSV import
