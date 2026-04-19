-- Customer acknowledgment signature captured at invoice creation (data URL PNG)
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS customer_signature_data_url TEXT;
