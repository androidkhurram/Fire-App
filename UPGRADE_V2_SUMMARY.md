# Fire Inspection App v2 — Upgrade Summary

## Modified Files

### Navigation
- **`mobile-app/src/navigation/RootNavigator.tsx`** — Replaced CustomerTypeSelection with Dashboard; added CreateInvoice, CreateInspection with `serviceType`; updated CustomerDetails flow (Inspection/Maintenance/Installation); added CreateInvoiceWrapper.

### Screens
- **`mobile-app/src/screens/DashboardScreen.tsx`** — **NEW** — Replaces CustomerTypeSelection. Buttons: New Installation, Existing Customer, Create Invoice, Sign Out.
- **`mobile-app/src/screens/CreateInvoiceScreen.tsx`** — **NEW** — Invoice creation with customer picker, amount, tax, total, payment method/status.
- **`mobile-app/src/screens/CustomerDetailsScreen.tsx`** — Added onNewMaintenance, onNewInstallation; buttons: New Inspection, New Maintenance, New Installation, View History.
- **`mobile-app/src/screens/CustomersListScreen.tsx`** — Search by business_name, customer_name, phone, address; "Create New Customer" button.
- **`mobile-app/src/screens/CreateInspectionScreen.tsx`** — 8-step wizard; added `serviceType` prop; integrated PermitStatusStep, InspectionSetupStep; removed SystemBrandsStep.

### CreateInspection Steps
- **`mobile-app/src/screens/CreateInspection/PermitStatusStep.tsx`** — **NEW** — Permit applied, dates, status, notes, document URL.
- **`mobile-app/src/screens/CreateInspection/InspectionSetupStep.tsx`** — **NEW** — Inspection scheduled, date, result (pass/fail/needs_repair).
- **`mobile-app/src/screens/CreateInspection/SystemInformationStep.tsx`** — Added systemBrand, systemModel, serialNumber (merged from System Brands).
- **`mobile-app/src/screens/CreateInspection/ProjectInformationStep.tsx`** — Updated WIZARD_STEPS.
- **`mobile-app/src/screens/CreateInspection/WorkProgressStep.tsx`** — Updated WIZARD_STEPS.
- **`mobile-app/src/screens/CreateInspection/SystemChecksStep.tsx`** — Updated WIZARD_STEPS.
- **`mobile-app/src/screens/CreateInspection/CommentsStep.tsx`** — Updated WIZARD_STEPS.
- **`mobile-app/src/screens/CreateInspection/CustomerInformationStep.tsx`** — Added contactPersonName, contactPersonPhone, contactPersonEmail.

### Services
- **`mobile-app/src/services/dataService.ts`** — Added `Invoice`, `createInvoice`; extended `Customer` with contact_person fields; `createInspection` with `service_type`, `permitStatus`, `inspectionSetup`, system brand/model/serial; `createCustomer` with contact person.
- **`mobile-app/src/services/demoStore.ts`** — Added `DemoInvoice`, `createInvoice`, invoices storage; extended `DemoCustomer` with contact person; updated `createInspection` for new payload.

### Components
- **`mobile-app/src/components/FormInput.tsx`** — Fixed `error` style (error ? styles.inputError : undefined).

### Deleted
- **`mobile-app/src/screens/CustomerTypeSelectionScreen.tsx`** — Replaced by DashboardScreen.

---

## New Migration SQL

### 004_service_types.sql
```sql
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS service_type TEXT CHECK (service_type IN ('installation', 'inspection', 'maintenance'));
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS report_url TEXT;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS permit_applied BOOLEAN DEFAULT FALSE;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS permit_application_date DATE;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS permit_status TEXT CHECK (permit_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS permit_approval_date DATE;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS permit_notes TEXT;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS permit_document_url TEXT;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS inspection_scheduled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS inspection_date DATE;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS inspection_result TEXT CHECK (inspection_result IN ('pass', 'fail', 'needs_repair'));
```

### 005_invoices.sql
```sql
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  service_type TEXT CHECK (service_type IN ('installation', 'inspection', 'maintenance')),
  invoice_date DATE DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'invoice', 'check', 'other')),
  payment_status TEXT CHECK (payment_status IN ('paid', 'pending', 'overdue')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 006_contact_person_and_permissions.sql
```sql
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS contact_person_name TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS contact_person_phone TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS contact_person_email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS can_create_installation BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS can_create_inspection BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS can_create_invoice BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS can_view_reports BOOLEAN DEFAULT TRUE;
```

### 007_storage_buckets.sql
Documentation for required buckets: inspection-photos, inspection-reports, permit-documents, invoice-pdfs.

---

## New React Native Screens

| Screen | Path | Purpose |
|--------|------|---------|
| DashboardScreen | `screens/DashboardScreen.tsx` | New Installation, Existing Customer, Create Invoice, Sign Out |
| CreateInvoiceScreen | `screens/CreateInvoiceScreen.tsx` | Create invoice with customer, amount, tax, payment |
| PermitStatusStep | `screens/CreateInspection/PermitStatusStep.tsx` | Permit status wizard step |
| InspectionSetupStep | `screens/CreateInspection/InspectionSetupStep.tsx` | Inspection setup wizard step |

---

## Updated Flow

```
Login
  ↓
Dashboard
  ├─ New Installation → CreateInspection (serviceType: installation)
  ├─ Existing Customer → CustomersList
  │     ↓ Select customer
  │     CustomerDetails
  │       ├─ New Inspection → CreateInspection (serviceType: inspection)
  │       ├─ New Maintenance → CreateInspection (serviceType: maintenance)
  │       ├─ New Installation → CreateInspection (serviceType: installation)
  │       └─ View History → InspectionHistory
  └─ Create Invoice → CreateInvoiceScreen
```

---

## Wizard Steps (8 total)

1. Customer Information
2. System Information (includes system_brand, system_model, serial_number)
3. Project Information
4. Permit Status
5. Work Progress Phase
6. System Checks
7. Inspection Setup
8. Comments

---

## Service Types

- **installation** — No report generated
- **inspection** — Report generated
- **maintenance** — Report generated

---

## Demo Mode

- `dataService` and `demoStore` support demo mode for invoices, inspections, and customers.
- Invoices stored in AsyncStorage under `@fireapp_demo_invoices`.

---

## Build Status

✅ TypeScript: `npx tsc --noEmit` passes  
✅ iOS build: `xcodebuild` succeeds  

---

## Not Yet Implemented (Future)

- **react-native-google-places-autocomplete** for address autocomplete
- **Invoice PDF generation** — Store in Supabase bucket `invoice-pdfs`
- **Inspection report PDF** — Auto-generate for inspection/maintenance; store in `inspection-reports`; save to `inspections.report_url`
- **Permit document upload** — Supabase Storage `permit-documents`
- **Technician permission checks** — UI enforcement of `can_create_installation`, etc.
- **Admin portal** — Edit technician permissions
