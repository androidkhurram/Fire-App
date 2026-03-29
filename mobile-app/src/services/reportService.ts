/**
 * Inspection/Maintenance report PDF generation and upload
 * Fire company workflow: generate report → show to technician → download/print for customer
 */
import {dataService, useSupabase} from './dataService';
import type {Inspection, Customer} from './dataService';
import type {InspectionWizardData} from '../screens/CreateInspectionScreen';

/** Escape HTML to prevent broken PDF / XSS */
function escapeHtml(s: string): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ReportSource {
  wizardData?: InspectionWizardData;
  inspection: Inspection;
  customer?: Customer | null;
}

/** Map inspection_items status to systemChecks response format */
function itemsToSystemChecks(
  items: Array<{item_name: string; status: 'pass' | 'fail' | 'na'}>,
): Record<string, 'yes' | 'no' | 'na'> {
  const responses: Record<string, 'yes' | 'no' | 'na'> = {};
  for (const {item_name, status} of items) {
    responses[item_name] = status === 'pass' ? 'yes' : status === 'fail' ? 'no' : 'na';
  }
  return responses;
}

/** Load inspection and build ReportSource for PDF generation */
export async function loadReportSource(inspectionId: string): Promise<ReportSource | null> {
  const inspection = await dataService.getInspection(inspectionId);
  if (!inspection) return null;
  const customer = inspection.customer_id
    ? await dataService.getCustomer(inspection.customer_id)
    : null;

  // Demo mode: get full wizard data from demoStore
  if (!useSupabase) {
    const {demoStore} = await import('./demoStore');
    const demo = await demoStore.getInspection(inspectionId);
    if (demo?.customerInfo || demo?.systemInfo) {
      const wizardData: InspectionWizardData = {
        customerInfo: demo.customerInfo as InspectionWizardData['customerInfo'],
        systemInfo: demo.systemInfo as InspectionWizardData['systemInfo'],
        projectInfo: demo.projectInfo as InspectionWizardData['projectInfo'],
        permitStatus: demo.permitStatus as InspectionWizardData['permitStatus'],
        workProgress: demo.workProgress as InspectionWizardData['workProgress'],
        systemChecks: demo.systemChecks as InspectionWizardData['systemChecks'],
        inspectionSetup: demo.inspectionSetup as InspectionWizardData['inspectionSetup'],
        comments: demo.comments as InspectionWizardData['comments'],
        paymentInfo: demo.paymentInfo as InspectionWizardData['paymentInfo'],
        photos: demo.photos as InspectionWizardData['photos'],
      };
      return {inspection, customer, wizardData};
    }
  }

  // Supabase: build wizardData from inspection row + inspection_items + photos
  const raw = inspection as Record<string, unknown>;
  const systemInfoJson = raw.system_info_json as Record<string, unknown> | undefined;
  const paymentInfoJson = raw.payment_info_json as Record<string, unknown> | undefined;
  const notes = raw.notes as string | undefined;
  const permitApplied = raw.permit_applied as boolean | undefined;
  const permitStatus = raw.permit_status as string | undefined;
  const permitNotes = raw.permit_notes as string | undefined;
  const inspectionResult = (raw.inspection_result as string) ?? inspection.inspection_status;

  const [items, photos] = await Promise.all([
    dataService.getInspectionItems(inspectionId),
    dataService.getInspectionPhotos(inspectionId),
  ]);

  const hasExtendedData =
    systemInfoJson ||
    paymentInfoJson ||
    notes ||
    permitApplied != null ||
    permitStatus ||
    permitNotes ||
    items.length > 0 ||
    photos.length > 0;

  if (!hasExtendedData) return {inspection, customer};

  const wizardData: InspectionWizardData = {
    customerInfo: customer
      ? {
          businessName: customer.business_name,
          address: customer.address,
          suite: customer.suite,
          city: customer.city,
          state: customer.state,
          zipCode: customer.zip,
          telephone: customer.phone,
          email: customer.email,
          contactPersonName: customer.contact_person_name,
          contactPersonPhone: customer.contact_person_phone,
          contactPersonEmail: customer.contact_person_email,
        }
      : undefined,
    systemInfo: systemInfoJson as InspectionWizardData['systemInfo'],
    permitStatus:
      permitApplied != null || permitStatus || permitNotes
        ? {
            permitApplied: permitApplied ?? false,
            permitStatus: permitStatus ?? '',
            permitNotes: permitNotes ?? '',
          }
        : undefined,
    systemChecks:
      items.length > 0 ? {responses: itemsToSystemChecks(items)} : undefined,
    inspectionSetup: {
      inspectionDate: inspection.inspection_date,
      inspectionResult: inspectionResult ?? 'pass',
    },
    comments: notes ? {commentText: notes} : undefined,
    paymentInfo: paymentInfoJson
      ? {
          paymentMode: (paymentInfoJson.paymentMode as 'cash' | 'credit_card') ?? 'cash',
          totalAmount: String(paymentInfoJson.totalAmount ?? ''),
          advanceAmount: String(paymentInfoJson.advanceAmount ?? ''),
          balanceAmount: String(paymentInfoJson.balanceAmount ?? ''),
        }
      : undefined,
    photos: photos.map(p => ({uri: p.photo_url})),
  };

  return {inspection, customer, wizardData};
}

function formatSystemBrandItems(items?: Array<{brand: string; model?: string; quantity?: number; dateOfManufacture?: string}>): string {
  if (!items?.length) return '';
  return items
    .map(
      i =>
        `<tr><td><strong>${escapeHtml(i.brand)}${i.model ? ` – ${escapeHtml(i.model)}` : ''}</strong></td><td>Qty: ${escapeHtml(String(i.quantity ?? '—'))}, DOM: ${escapeHtml(String(i.dateOfManufacture ?? '—'))}</td></tr>`,
    )
    .join('');
}

function formatTemperatureQuantities(
  label: string,
  quantities?: Record<string, number>,
): string {
  if (!quantities) return '';
  const entries = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([temp, qty]) => `${temp}°: ${qty}`)
    .join(', ');
  return entries ? `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(entries)}</td></tr>` : '';
}

function buildReportHtmlFromWizard(
  data: InspectionWizardData,
  serviceType: string,
  nextServiceDate?: string | null,
): string {
  const customer = data.customerInfo;
  const system = data.systemInfo;
  const permit = data.permitStatus;
  const checks = data.systemChecks?.responses;
  const setup = data.inspectionSetup;
  const comments = data.comments;
  const photos = data.photos ?? [];

  const rows = (label: string, value: string) =>
    value ? `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>` : '';

  const checkRows = checks
    ? Object.entries(checks)
        .map(
          ([item, status]) =>
            `<tr><td>${escapeHtml(item)}</td><td>${status === 'yes' ? 'Pass' : status === 'no' ? 'Fail' : 'N/A'}</td></tr>`,
        )
        .join('')
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; font-size: 12px; }
    h1 { color: #333; border-bottom: 2px solid #c00; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .section { margin: 24px 0; }
    .section h2 { color: #555; font-size: 14px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(serviceType.charAt(0).toUpperCase() + serviceType.slice(1))} Report</h1>
  <p>Generated: ${escapeHtml(new Date().toLocaleString())}</p>

  <div class="section">
    <h2>Customer Information</h2>
    <table>
      ${rows('Business Name', customer?.businessName ?? '')}
      ${rows('Address', [customer?.address, customer?.suite].filter(Boolean).join(', ') || '')}
      ${rows('City', customer?.city ?? '')}
      ${rows('State', customer?.state ?? '')}
      ${rows('ZIP', customer?.zipCode ?? '')}
      ${rows('Phone', customer?.telephone ?? '')}
      ${rows('Email', customer?.email ?? '')}
      ${rows('Contact Person', customer?.contactPersonName ?? '')}
    </table>
  </div>

  <div class="section">
    <h2>System Information</h2>
    <table>
      ${rows('System Name/Modal', system?.systemNameModal ?? '')}
      ${rows('System Type', system?.systemType ?? '')}
      ${rows('Brand', Array.isArray(system?.systemBrand) ? system.systemBrand.join(', ') : (system?.systemBrand ?? ''))}
      ${formatSystemBrandItems(system?.systemBrandItems)}
      ${rows('Model', system?.systemModel ?? '')}
      ${rows('Serial Number', system?.serialNumber ?? '')}
      ${rows('UL 300 Requirement', system?.ul300Requirement ?? '')}
      ${rows('Cylinder Size', system?.cylinderSize ?? '')}
      ${rows('Cylinder Location', system?.cylinderLocation ?? '')}
      ${formatTemperatureQuantities('Fusible Links', system?.fusibleLinks)}
      ${formatTemperatureQuantities('Thermal Heat Detector', system?.thermalHeatDetector)}
      ${rows('Fuel Shut Off Type', system?.fuelShutOffType ?? '')}
      ${rows('Fuel Shut Off Size (1)', system?.fuelShutOffSize1 ?? '')}
      ${rows('Fuel Shut Off Size (2)', system?.fuelShutOffSize2 ?? '')}
      ${rows('Fuel Shut Off Serial (1)', system?.fuelShutOffSerial1 ?? '')}
      ${rows('Fuel Shut Off Serial (2)', system?.fuelShutOffSerial2 ?? '')}
      ${rows('Last Hydrostatic Test Date', system?.lastHydrostaticTestDate ?? '')}
      ${rows('Last Recharge Date', system?.lastRechargeDate ?? '')}
    </table>
  </div>

  <div class="section">
    <h2>Permit Status</h2>
    <table>
      ${rows('Permit Applied', permit?.permitApplied ? 'Yes' : 'No')}
      ${rows('Status', permit?.permitStatus ?? '')}
      ${rows('Notes', permit?.permitNotes ?? '')}
    </table>
  </div>

  ${checks && Object.keys(checks).length > 0 ? `
  <div class="section">
    <h2>Inspection Checklist</h2>
    <table>
      <tr><th>Item</th><th>Status</th></tr>
      ${checkRows}
    </table>
  </div>
  ` : ''}

  <div class="section">
    <h2>Inspection Details</h2>
    <table>
      ${rows('Inspection Date', setup?.inspectionDate ?? '')}
      ${rows('Result', setup?.inspectionResult ?? '')}
      ${nextServiceDate ? rows('Next Inspection Due', nextServiceDate) : ''}
    </table>
  </div>

  ${data.paymentInfo && (data.paymentInfo.totalAmount || data.paymentInfo.advanceAmount) ? (() => {
    const p = data.paymentInfo;
    const fmt = (v: unknown) => {
      const n = parseFloat(String(v ?? ''));
      return isNaN(n) ? '—' : `$${n.toFixed(2)}`;
    };
    return `
  <div class="section">
    <h2>Payment</h2>
    <table>
      ${rows('Payment Mode', p.paymentMode === 'credit_card' ? 'Credit Card' : 'Cash')}
      ${rows('Total Amount', fmt(p.totalAmount))}
      ${rows('Advance/Paid', fmt(p.advanceAmount))}
      ${rows('Balance', fmt(p.balanceAmount))}
    </table>
  </div>
  `;
  })() : ''}

  ${photos.length > 0 && photos.some(p => p.uri?.startsWith('http')) ? `
  <div class="section">
    <h2>Photos</h2>
    <table><tr>${photos
      .filter(p => p.uri?.startsWith('http'))
      .map(p => `<td style="padding:8px;"><img src="${escapeHtml(p.uri)}" alt="Photo" width="150" height="150" style="border:1px solid #ddd;" /></td>`)
      .join('')}</tr></table>
  </div>
  ` : ''}

  ${comments?.commentText ? `
  <div class="section">
    <h2>Comments</h2>
    <p>${escapeHtml(comments.commentText)}</p>
  </div>
  ` : ''}

  <div class="section">
    <h2>References</h2>
    <p>This inspection was conducted in accordance with NFPA 96 (Standard for Ventilation Control and Fire Protection of Commercial Cooking Operations) and ANSI/ANSUL standards for fire suppression systems.</p>
  </div>

  <div class="section signature-section">
    <h2>Technician Signature</h2>
    <div class="signature-block">
      <div class="signature-line"></div>
      <p class="signature-label">Technician Name / Date</p>
    </div>
  </div>
</body>
</html>`;
}

function buildReportHtmlFromInspection(
  inspection: Inspection,
  customer?: Customer | null,
): string {
  const serviceType = inspection.service_type ?? 'inspection';
  const rows = (label: string, value: string) =>
    value ? `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>` : '';
  const nextServiceRow = customer?.next_service_date
    ? rows('Next Inspection Due', customer.next_service_date)
    : '';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; font-size: 12px; }
    h1 { color: #333; border-bottom: 2px solid #c00; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .section { margin: 24px 0; }
    .section h2 { color: #555; font-size: 14px; }
    .signature-section { margin-top: 32px; }
    .signature-block { margin-top: 12px; }
    .signature-line { border-bottom: 1px solid #333; width: 240px; height: 24px; margin-bottom: 4px; }
    .signature-label { font-size: 11px; color: #666; }
  </style>
</head>
<body>
  <h1>${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <div class="section">
    <h2>Customer Information</h2>
    <table>
      ${rows('Business Name', customer?.business_name ?? '')}
      ${rows('Address', [customer?.address, customer?.suite].filter(Boolean).join(', ') || '')}
      ${rows('City', customer?.city ?? '')}
      ${rows('State', customer?.state ?? '')}
      ${rows('ZIP', customer?.zip ?? '')}
      ${rows('Phone', customer?.phone ?? '')}
      ${rows('Email', customer?.email ?? '')}
    </table>
  </div>
  <div class="section">
    <h2>Inspection Details</h2>
    <table>
      ${rows('Date', inspection.inspection_date)}
      ${rows('System Brand', inspection.system_brand ?? '')}
      ${rows('System Model', inspection.system_model ?? '')}
      ${rows('Result', inspection.inspection_status ?? '')}
      ${rows('Technician', inspection.technician_name ?? '')}
      ${nextServiceRow}
    </table>
  </div>
  <div class="section">
    <h2>References</h2>
    <p>NFPA 96, ANSI/ANSUL standards.</p>
  </div>
  <div class="section signature-section">
    <h2>Technician Signature</h2>
    <div class="signature-block">
      <div class="signature-line"></div>
      <p class="signature-label">Technician Name / Date</p>
    </div>
  </div>
</body>
</html>`;
}

function buildReceiptHtml(source: ReportSource): string {
  const customer = source.wizardData?.customerInfo ?? source.customer;
  const system = source.wizardData?.systemInfo;
  const payment = source.wizardData?.paymentInfo;
  const setup = source.wizardData?.inspectionSetup;
  const serviceType = source.inspection.service_type ?? 'inspection';
  const rows = (label: string, value: string) =>
    value ? `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>` : '';

  const custName = customer && 'businessName' in customer ? customer.businessName : customer?.business_name;
  const custAddr = customer && 'address' in customer
    ? [customer.address, (customer as {suite?: string}).suite].filter(Boolean).join(', ')
    : [source.customer?.address, source.customer?.suite].filter(Boolean).join(', ');
  const custCity = customer && 'city' in customer ? customer.city : source.customer?.city;
  const custState = customer && 'state' in customer ? customer.state : source.customer?.state;
  const custZip = customer && 'zipCode' in customer ? customer.zipCode : source.customer?.zip;
  const custPhone = customer && 'telephone' in customer ? customer.telephone : source.customer?.phone;
  const custEmail = customer && 'email' in customer ? customer.email : source.customer?.email;

  const paymentModeLabel = payment?.paymentMode === 'credit_card' ? 'Credit Card' : 'Cash';
  const formatMoney = (s: string) => {
    const n = parseFloat(s);
    return isNaN(n) ? '—' : `$${n.toFixed(2)}`;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; font-size: 12px; }
    h1 { color: #333; border-bottom: 2px solid #c00; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .section { margin: 24px 0; }
    .section h2 { color: #555; font-size: 14px; }
    .receipt-note { font-size: 11px; color: #666; margin-top: 24px; }
  </style>
</head>
<body>
  <h1>Receipt</h1>
  <p>${escapeHtml(serviceType.charAt(0).toUpperCase() + serviceType.slice(1))} Service</p>
  <p>Date: ${escapeHtml(setup?.inspectionDate ?? source.inspection.inspection_date ?? new Date().toISOString().split('T')[0] ?? '')}</p>
  <p>Receipt #: ${escapeHtml(source.inspection.id.slice(0, 8).toUpperCase())}</p>

  <div class="section">
    <h2>Customer</h2>
    <table>
      ${rows('Business', custName ?? '')}
      ${rows('Address', custAddr || '')}
      ${rows('City', custCity ?? '')}
      ${rows('State', custState ?? '')}
      ${rows('ZIP', custZip ?? '')}
      ${rows('Phone', custPhone ?? '')}
      ${rows('Email', custEmail ?? '')}
    </table>
  </div>

  <div class="section">
    <h2>Service Details</h2>
    <table>
      ${rows('Service Type', serviceType)}
      ${rows('System', [source.inspection.system_brand, source.inspection.system_model].filter(Boolean).join(' ') || (system?.systemNameModal ?? '') || '—')}
      ${rows('Result', setup?.inspectionResult ?? source.inspection.inspection_status ?? '—')}
    </table>
  </div>

  ${payment ? `
  <div class="section">
    <h2>Payment</h2>
    <table>
      ${rows('Payment Mode', paymentModeLabel)}
      ${rows('Total Amount', formatMoney(payment.totalAmount))}
      ${rows('Advance/Paid', formatMoney(payment.advanceAmount))}
      ${rows('Balance', formatMoney(payment.balanceAmount))}
    </table>
  </div>
  ` : ''}

  <p class="receipt-note">Thank you for your business. This receipt serves as a record of payment received.</p>
  <p class="receipt-note">Generated: ${new Date().toLocaleString()}</p>
</body>
</html>`;
}

export async function generateReceiptPdfForShare(
  source: ReportSource,
): Promise<{filePath: string; fileUri: string} | null> {
  try {
    const mod = await import('react-native-html-to-pdf');
    const {generatePDF} = mod;
    if (typeof generatePDF !== 'function') throw new Error('PDF module not available');
    const html = buildReceiptHtml(source);
    const options = {
      html,
      fileName: `receipt-${source.inspection.id.slice(0, 8)}`,
      directory: 'Documents',
      width: 612,
      height: 792,
      shouldPrintBackgrounds: true,
    };
    const file = await generatePDF(options);
    if (!file?.filePath) return null;
    const fileUri = file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`;
    return {filePath: file.filePath, fileUri};
  } catch (e) {
    if (__DEV__) console.warn('Receipt PDF generation failed:', e);
    const msg = e instanceof Error ? e.message : String(e);
    const isModuleError =
      msg.includes('convert') ||
      msg.includes('null') ||
      msg.includes('PDF module not available');
    if (isModuleError) {
      throw new Error(
        'PDF generation is not available. Try: 1) Rebuild the app (cd ios && pod install), 2) Run on a physical device, or 3) Restart the simulator.',
      );
    }
    return null;
  }
}

export async function generateReportPdfForShare(
  source: ReportSource,
): Promise<{filePath: string; fileUri: string} | null> {
  try {
    const mod = await import('react-native-html-to-pdf');
    const {generatePDF} = mod;
    if (typeof generatePDF !== 'function') throw new Error('PDF module not available');
    const serviceType = source.inspection.service_type ?? 'inspection';
    const inspectionDate = source.wizardData?.inspectionSetup?.inspectionDate ?? source.inspection.inspection_date;
    const nextServiceDate = inspectionDate
      ? (() => {
          const d = new Date(inspectionDate);
          d.setMonth(d.getMonth() + 6);
          return d.toISOString().split('T')[0] ?? null;
        })()
      : source.customer?.next_service_date ?? null;
    const html =
      source.wizardData != null
        ? buildReportHtmlFromWizard(source.wizardData, serviceType, nextServiceDate)
        : buildReportHtmlFromInspection(source.inspection, source.customer);
    const options = {
      html,
      fileName: `report-${source.inspection.id.slice(0, 8)}`,
      directory: 'Documents',
      width: 612,
      height: 792,
      shouldPrintBackgrounds: true,
    };
    const file = await generatePDF(options);
    if (!file?.filePath) return null;
    const fileUri = file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`;
    return {filePath: file.filePath, fileUri};
  } catch (e) {
    if (__DEV__) console.warn('PDF generation failed:', e);
    return null;
  }
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0]!;
}

export async function generateAndUploadReport(
  inspectionId: string,
  data: InspectionWizardData,
  serviceType: 'inspection' | 'maintenance',
): Promise<string | null> {
  try {
    const {generatePDF} = await import('react-native-html-to-pdf');
    const inspectionDate = data.inspectionSetup?.inspectionDate ?? new Date().toISOString().split('T')[0]!;
    const nextServiceDate = addMonths(inspectionDate, 6);
    const html = buildReportHtmlFromWizard(data, serviceType, nextServiceDate);
    const options = {
      html,
      fileName: `report-${inspectionId}`,
      directory: 'Documents',
      width: 612,
      height: 792,
      shouldPrintBackgrounds: true,
    };
    const file = await generatePDF(options);
    if (!file?.filePath) return null;

    const path = `reports/${inspectionId}-${Date.now()}.pdf`;
    const fileUri = file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`;
    const url = await dataService.uploadFile('inspection-reports', path, {
      uri: fileUri,
      type: 'application/pdf',
      name: `report-${inspectionId}.pdf`,
    });
    return url;
  } catch {
    return null;
  }
}
