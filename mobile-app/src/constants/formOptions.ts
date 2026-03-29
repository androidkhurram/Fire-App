/**
 * Dropdown options for fire inspection forms
 */

export const SERVICE_TYPES = [
  {value: 'installation', label: 'Installation'},
  {value: 'inspection', label: 'Inspection'},
  {value: 'maintenance', label: 'Maintenance'},
] as const;

export const PAYMENT_METHODS = [
  {value: 'cash', label: 'Cash'},
  {value: 'card', label: 'Card'},
  {value: 'invoice', label: 'Invoice'},
  {value: 'check', label: 'Check'},
  {value: 'other', label: 'Other'},
] as const;

export const PAYMENT_STATUSES = [
  {value: 'paid', label: 'Paid'},
  {value: 'pending', label: 'Pending'},
  {value: 'overdue', label: 'Overdue'},
] as const;

export const INSPECTION_RESULTS = [
  {value: 'pass', label: 'Pass'},
  {value: 'fail', label: 'Fail'},
  {value: 'needs_repair', label: 'Needs Repair'},
] as const;

export const PERMIT_STATUSES = [
  {value: 'pending', label: 'Pending'},
  {value: 'approved', label: 'Approved'},
  {value: 'rejected', label: 'Rejected'},
] as const;

export const SYSTEM_TYPES = [
  {value: 'Wet Chemical', label: 'Wet Chemical'},
  {value: 'Dry Chemical', label: 'Dry Chemical'},
  {value: 'CO2', label: 'CO2'},
  {value: 'Clean Agent', label: 'Clean Agent'},
  {value: 'Water Mist', label: 'Water Mist'},
  {value: 'Foam', label: 'Foam'},
  {value: 'Other', label: 'Other'},
] as const;

export const YES_NO_OPTIONS = [
  {value: 'Yes', label: 'Yes'},
  {value: 'No', label: 'No'},
] as const;

export const CYLINDER_SIZES = [
  {value: 'Master', label: 'Master'},
  {value: 'Small', label: 'Small'},
  {value: 'Medium', label: 'Medium'},
  {value: 'Large', label: 'Large'},
] as const;

export const CYLINDER_LOCATIONS = [
  {value: 'Right', label: 'Right'},
  {value: 'Left', label: 'Left'},
  {value: 'Center', label: 'Center'},
  {value: 'Behind', label: 'Behind'},
  {value: 'Other', label: 'Other'},
] as const;

/** Default system brands - fallback when not using Supabase. */
export const DEFAULT_SYSTEM_BRANDS = [
  'Protex',
  'PyroChem',
  'Kidde-range Guard',
  'Buckeye',
  'Ansul',
  'Amerex',
] as const;

/** Default system checks - fallback when not using Supabase. */
export const DEFAULT_SYSTEM_CHECKS = [
  'All appliances properly covered w/correct nozzles',
  'Nozzles aimed correctly at appliances',
  'System installed in accordance w/MFG UL listing',
  'Piping properly supported',
  'Correct pipe size used',
  'Pressure gauge in proper range',
  'Has system has been discharged? report same',
  'Fusible links in proper position',
  'Manual pull station accessible',
  'Gas valve properly installed',
  'Electrical connections correct',
  'System tagged and dated',
  'Replaced fusible links',
  'Replaced thermal detectors',
  'Portable extinguishers properly serviced',
  'Service & Certification tag on system',
] as const;

export const FUEL_SHUT_OFF_TYPES = [
  {value: 'Electric', label: 'Electric'},
  {value: 'Manual', label: 'Manual'},
  {value: 'Pneumatic', label: 'Pneumatic'},
  {value: 'Other', label: 'Other'},
] as const;

export const US_STATES = [
  {value: 'AL', label: 'Alabama'},
  {value: 'AK', label: 'Alaska'},
  {value: 'AZ', label: 'Arizona'},
  {value: 'AR', label: 'Arkansas'},
  {value: 'CA', label: 'California'},
  {value: 'CO', label: 'Colorado'},
  {value: 'CT', label: 'Connecticut'},
  {value: 'DE', label: 'Delaware'},
  {value: 'FL', label: 'Florida'},
  {value: 'GA', label: 'Georgia'},
  {value: 'HI', label: 'Hawaii'},
  {value: 'ID', label: 'Idaho'},
  {value: 'IL', label: 'Illinois'},
  {value: 'IN', label: 'Indiana'},
  {value: 'IA', label: 'Iowa'},
  {value: 'KS', label: 'Kansas'},
  {value: 'KY', label: 'Kentucky'},
  {value: 'LA', label: 'Louisiana'},
  {value: 'ME', label: 'Maine'},
  {value: 'MD', label: 'Maryland'},
  {value: 'MA', label: 'Massachusetts'},
  {value: 'MI', label: 'Michigan'},
  {value: 'MN', label: 'Minnesota'},
  {value: 'MS', label: 'Mississippi'},
  {value: 'MO', label: 'Missouri'},
  {value: 'MT', label: 'Montana'},
  {value: 'NE', label: 'Nebraska'},
  {value: 'NV', label: 'Nevada'},
  {value: 'NH', label: 'New Hampshire'},
  {value: 'NJ', label: 'New Jersey'},
  {value: 'NM', label: 'New Mexico'},
  {value: 'NY', label: 'New York'},
  {value: 'NC', label: 'North Carolina'},
  {value: 'ND', label: 'North Dakota'},
  {value: 'OH', label: 'Ohio'},
  {value: 'OK', label: 'Oklahoma'},
  {value: 'OR', label: 'Oregon'},
  {value: 'PA', label: 'Pennsylvania'},
  {value: 'RI', label: 'Rhode Island'},
  {value: 'SC', label: 'South Carolina'},
  {value: 'SD', label: 'South Dakota'},
  {value: 'TN', label: 'Tennessee'},
  {value: 'TX', label: 'Texas'},
  {value: 'UT', label: 'Utah'},
  {value: 'VT', label: 'Vermont'},
  {value: 'VA', label: 'Virginia'},
  {value: 'WA', label: 'Washington'},
  {value: 'WV', label: 'West Virginia'},
  {value: 'WI', label: 'Wisconsin'},
  {value: 'WY', label: 'Wyoming'},
] as const;
