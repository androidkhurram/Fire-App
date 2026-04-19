import type {Invoice} from '../services/dataService';

/**
 * Stable, human-facing invoice reference (UUID-based until a sequential DB column exists).
 * Same value everywhere: list, preview header, PDF, share sheet.
 */
export function getDisplayInvoiceNumber(invoice: Pick<Invoice, 'id'>): string {
  const compact = invoice.id.replace(/-/g, '').slice(0, 10).toUpperCase();
  return `INV-${compact}`;
}
