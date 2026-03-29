# Fire Inspection App - Screens Analysis

## Designer Screens (in `Screens/` folder)

| Screen | File | Status | Notes |
|--------|------|--------|-------|
| **Account Selection** | new inspection.jpg | ✅ Implemented | Existing Account / New Account |
| **Main Dashboard** | Main.jpg | ✅ Implemented | New Installation / New Inspection |
| **Customer Information** | customer information.jpg | ✅ Implemented | Step 1 of Create Inspection wizard |
| **System Information** | system information.jpg | ✅ Implemented | Step 2 - system config, fusible links, etc. |
| **Project Information** | project information.jpg | ✅ Implemented | Step 3 - dates, technician |
| **Work Progress Phase** | work progress phase.jpg | ✅ Implemented | Step 4 - installation task checklist |
| **System Checks** | work progress phase-1.jpg | ✅ Implemented | Step 5 - 34-item Yes/No/N/A checklist |
| **System Brands** | system brands.jpg, -1, -2, -3 | ✅ Implemented | Step 6 - brand/model selection, Add New modal |
| **Comments** | comments.jpg | ✅ Implemented | Step 7 - final comments |
| **Payment** | payment.jpg | ✅ Implemented | Term of Payment (Cash/Card/Invoice) |
| **Add Template** | upload picture.jpg | ✅ Implemented | File upload for templates/documents |

## Spec-Required Screens (iPad App Screens - Section 17)

| Screen | In Designer? | Status |
|--------|--------------|--------|
| Login | ❌ No | ✅ Implemented (email + password per spec) |
| Dashboard | ✅ Main.jpg | ✅ Implemented |
| Customers List | ❌ No | ✅ Implemented |
| Customer Details | ❌ No | ✅ Implemented |
| Create Inspection | ✅ Multi-step | ✅ Implemented (7-step wizard) |
| Work Progress Phase | ✅ Yes | ✅ Implemented |
| Upload Photos | ❌ No | ✅ Implemented |
| Comments | ✅ Yes | ✅ Implemented |
| Payment Entry | ✅ payment.jpg | ✅ Implemented |
| Inspection History | ❌ No | ✅ Implemented |

## Missing Screens (Identified & Implemented)

1. **Login** – Email/password auth per spec; designer has Account Selection which routes to Login
2. **Customers List** – Browse/search customers before creating inspection
3. **Customer Details** – View existing customer info, edit, start new inspection
4. **Inspection History** – List past inspections for a customer
5. **Upload Photos** – Dedicated screen for taking/selecting photos (different from Add Template which is document upload)

## Flow Variations in Designer

The designer provided **two workflow variants**:

**Flow A (7 steps)** – Used for Create Inspection:
1. Customer Information → 2. System Information → 3. Project Information → 4. Work Progress → 5. System Checks → 6. System Brands → 7. Comments

**Flow B (5 steps)** – Alternative (Payment-focused):
1. Customer Information → 2. System Information → 3. Payment → 4. Add Template → 5. Receipt

The app implements **Flow A** as the primary Create Inspection flow. Payment and Add Template can be integrated as separate steps or a parallel flow (e.g., after Comments).

## Payment Screen Enhancement

Designer mockup shows **Cash** and **Credit Card** only. Per spec (Section 12), **Invoice** was added as a third payment method option.

## Recommendations

1. **Receipt Screen** – In Flow B, step 5 is "Receipt". Consider adding a Receipt/Confirmation screen after inspection completion.
2. **Google Places** – Address field in Customer Information should use Google Places API for autocomplete (spec Section 6).
3. **Photo Integration** – Add `react-native-image-picker` for camera/gallery; wire to Supabase Storage.
4. **Document Picker** – Add `react-native-document-picker` for Add Template file uploads.
