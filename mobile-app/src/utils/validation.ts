/**
 * Form validation utilities for production-ready forms
 */

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
}

export function isValidZip(zip: string): boolean {
  const re = /^\d{5}(-\d{4})?$/;
  return re.test(zip.trim());
}

export function isValidDate(dateStr: string): boolean {
  if (!dateStr || dateStr.length !== 10) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return {valid: false, message: `${fieldName} is required`};
  }
  return {valid: true};
}

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) return {valid: true}; // optional
  if (!isValidEmail(email)) return {valid: false, message: 'Enter a valid email address'};
  return {valid: true};
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone.trim()) return {valid: true}; // optional
  if (!isValidPhone(phone)) return {valid: false, message: 'Enter a valid phone number (at least 10 digits)'};
  return {valid: true};
}

export function validateZip(zip: string): ValidationResult {
  if (!zip.trim()) return {valid: true}; // optional
  if (!isValidZip(zip)) return {valid: false, message: 'Enter a valid ZIP code (12345 or 12345-6789)'};
  return {valid: true};
}

export function validateAmount(amount: string): ValidationResult {
  const n = parseFloat(amount);
  if (isNaN(n) || n < 0) return {valid: false, message: 'Enter a valid amount'};
  return {valid: true};
}
