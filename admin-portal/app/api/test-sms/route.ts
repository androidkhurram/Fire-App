import { NextRequest, NextResponse } from 'next/server';
import { sendSms, isTwilioConfigured } from '@/lib/twilio';

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

  if (!isTwilioConfigured()) {
    return NextResponse.json(
      { error: 'Twilio not configured' },
      { status: 503 }
    );
  }

  const to = request.nextUrl.searchParams.get('to');
  if (!to) {
    return NextResponse.json(
      { error: 'Missing "to" query param. Example: /api/test-sms?to=+1234567890' },
      { status: 400 }
    );
  }

  const result = await sendSms(to, 'FireApp test: SMS reminders are working!');

  if (result.success) {
    return NextResponse.json({ success: true, message: 'Test SMS sent', sid: result.sid });
  }

  return NextResponse.json({ success: false, error: result.error }, { status: 500 });
}
