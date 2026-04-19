/**
 * User-facing error handling for production
 */
import {Alert} from 'react-native';

export function showError(title: string, message: string): void {
  Alert.alert(title, message, [{text: 'OK'}]);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as {message: unknown}).message;
    if (typeof m === 'string') return m;
  }
  if (typeof error === 'string') return error;
  return '';
}

/** Map known DB errors to actionable copy (raw Postgres text is confusing on device). */
function friendlyMessage(raw: string): string | null {
  if (raw.includes('inspections_technician_id_fkey')) {
    return (
      'This login exists in Supabase Auth but not in the app user list (public.users). ' +
      'An admin should add you under Technicians, or run the INSERT in SUPABASE_SETUP.md using your Auth user UUID.'
    );
  }
  return null;
}

export function handleAsyncError(
  error: unknown,
  fallbackTitle = 'Something went wrong',
  fallbackMessage = 'Please try again.',
): void {
  const msg = getErrorMessage(error);
  const mapped = msg ? friendlyMessage(msg) : null;
  const displayMessage =
    mapped ?? (msg && msg.length < 300 ? msg : fallbackMessage);
  showError(fallbackTitle, displayMessage);
}
