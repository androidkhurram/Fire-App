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

export function handleAsyncError(
  error: unknown,
  fallbackTitle = 'Something went wrong',
  fallbackMessage = 'Please try again.',
): void {
  const msg = getErrorMessage(error);
  const displayMessage = msg && msg.length < 300 ? msg : fallbackMessage;
  showError(fallbackTitle, displayMessage);
}
