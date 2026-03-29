-- Add reminder_type to track which reminder was sent (1_month, 2_weeks, 1_week)
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS reminder_type TEXT CHECK (reminder_type IN ('1_month', '2_weeks', '1_week'));

-- Index for efficient lookup of sent reminders per customer/due date
CREATE INDEX IF NOT EXISTS idx_reminders_customer_type_date
  ON public.reminders(customer_id, next_service_date, reminder_type);
