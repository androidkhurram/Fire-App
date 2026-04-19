import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

export function getTwilioClient() {
  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required');
  }
  return twilio(accountSid, authToken);
}

export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && fromNumber);
}

/** E.164 after normalization; false if too few digits to be a real number. */
function normalizeToE164(to: string): { e164: string; ok: boolean } {
  let digits = to.replace(/\D/g, '');
  if (digits.length === 10) {
    digits = '1' + digits;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return { e164: '+' + digits, ok: true };
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return { e164: '+' + digits, ok: true };
  }
  return { e164: digits ? '+' + digits : '', ok: false };
}

export async function sendSms(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!isTwilioConfigured()) {
    return { success: false, error: 'Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.' };
  }

  const { e164: normalized, ok } = normalizeToE164(to);
  if (!ok) {
    return {
      success: false,
      error: 'Invalid phone number: need at least 10 digits (US) or a valid international number.',
    };
  }

  try {
    const client = getTwilioClient();
    const message = await client.messages.create({
      body,
      from: fromNumber!,
      to: normalized,
    });
    return { success: true, sid: message.sid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
