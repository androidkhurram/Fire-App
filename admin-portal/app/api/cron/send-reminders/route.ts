import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSms, isTwilioConfigured } from '@/lib/twilio';

/** Allow many reminders in one run (Vercel / Next cap; raise on Pro if needed). */
export const maxDuration = 120;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type ReminderType = '1_month' | '2_weeks' | '1_week';

const REMINDER_MESSAGES: Record<ReminderType, (businessName: string, dueDate: string) => string> = {
  '1_month': (business, due) =>
    `FireApp: Your fire suppression inspection for ${business} is due on ${due}. Please schedule your appointment soon.`,
  '2_weeks': (business, due) =>
    `FireApp: Reminder - ${business}'s inspection is due in 2 weeks (${due}). Book your appointment now.`,
  '1_week': (business, due) =>
    `FireApp: Urgent - ${business}'s inspection is due in 1 week (${due}). Please schedule immediately.`,
};

function formatDateUS(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Server misconfigured: Supabase credentials required' },
      { status: 500 }
    );
  }

  if (!isTwilioConfigured()) {
    return NextResponse.json(
      { error: 'Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.' },
      { status: 503 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0]!;

  const results: { sent: number; skipped: number; errors: string[] } = { sent: 0, skipped: 0, errors: [] };

  for (const [reminderType, daysBefore] of [
    ['1_month', 30] as const,
    ['2_weeks', 14] as const,
    ['1_week', 7] as const,
  ]) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysBefore);
    const targetStr = targetDate.toISOString().split('T')[0]!;

    // Customers with next_service_date = targetStr, have phone, and we haven't sent this reminder yet
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, business_name, phone, next_service_date')
      .eq('next_service_date', targetStr)
      .not('phone', 'is', null)
      .neq('phone', '');

    if (custError) {
      results.errors.push(`Fetch customers: ${custError.message}`);
      continue;
    }

    if (!customers?.length) continue;

    for (const c of customers) {
      const customerId = c.id as string;
      const nextServiceDate = c.next_service_date as string;
      const phone = String(c.phone ?? '').trim();
      const businessName = (c.business_name as string) || 'Your business';

      if (!phone) {
        results.skipped++;
        continue;
      }

      // Skip if customer has an inspection scheduled for this due period (they've "booked")
      const { data: inspections } = await supabase
        .from('inspections')
        .select('id')
        .eq('customer_id', customerId)
        .gte('inspection_date', todayStr)
        .lte('inspection_date', targetStr)
        .limit(1);

      if (inspections?.length) {
        results.skipped++;
        continue;
      }

      // Check if we already sent this reminder type for this customer/due date
      const { data: existing } = await supabase
        .from('reminders')
        .select('id')
        .eq('customer_id', customerId)
        .eq('next_service_date', nextServiceDate)
        .eq('reminder_type', reminderType)
        .limit(1);

      if (existing?.length) {
        results.skipped++;
        continue;
      }

      const message = REMINDER_MESSAGES[reminderType as ReminderType](
        businessName,
        formatDateUS(nextServiceDate)
      );

      const smsResult = await sendSms(phone, message);

      if (smsResult.success) {
        const { error: insertErr } = await supabase.from('reminders').insert({
          customer_id: customerId,
          channel: 'sms',
          next_service_date: nextServiceDate,
          reminder_type: reminderType,
        });
        if (insertErr) {
          results.errors.push(
            `${businessName}: SMS sent (${smsResult.sid}) but DB log failed — customer may get a duplicate next run: ${insertErr.message}`
          );
        } else {
          results.sent++;
        }
      } else {
        results.errors.push(`${businessName}: ${smsResult.error}`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    sent: results.sent,
    skipped: results.skipped,
    errors: results.errors.length ? results.errors : undefined,
  });
}
