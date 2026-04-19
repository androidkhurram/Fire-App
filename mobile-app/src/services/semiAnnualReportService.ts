/**
 * Semi-Annual Inspection Report - PDF generation
 */
import {dataService} from './dataService';
import type {SemiAnnualReportFormData} from './dataService';
import type {SemiAnnualReportItem} from './dataService';

function escapeHtml(s: string): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateUS(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${m}/${d}/${y}`;
}

function buildSemiAnnualReportHtml(
  data: SemiAnnualReportFormData,
  items: SemiAnnualReportItem[],
): string {
  const reportTypeLabel =
    data.reportType === 'annual'
      ? 'Annual Inspection'
      : data.reportType === 'semi_annual'
        ? 'Semi-Annual Inspection'
        : 'Certified Inspection';

  const cert1 = data.isCertificationOfOriginalInstallation === true ? '✓' : ' ';
  const cert1Not = data.isCertificationOfOriginalInstallation === false ? '✓' : ' ';
  const cert2 = data.copyLeftWithClient === true ? '✓' : ' ';
  const cert2Not = data.copyLeftWithClient === false ? '✓' : ' ';

  const checklistRows = items
    .map((item, idx) => {
      const check = data.checklist?.[item.id] ?? {system1: 'yes', system2: 'yes'};
      const s1Class = check.system1 === 'yes' ? 'yes-badge' : check.system1 === 'no' ? 'no-badge' : '';
      const s2Class = check.system2 === 'yes' ? 'yes-badge' : check.system2 === 'no' ? 'no-badge' : '';
      const s1 = check.system1 === 'yes' ? 'Yes' : check.system1 === 'no' ? 'No' : '—';
      const s2 = check.system2 === 'yes' ? 'Yes' : check.system2 === 'no' ? 'No' : '—';
      let extra = data.explanations?.[item.id] ?? '';
      if (item.special_field_type === 'psi') {
        const psi = data.item5_psi;
        extra = [psi?.system1 ? `#1: ${psi.system1} PSI` : '', psi?.system2 ? `#2: ${psi.system2} PSI` : '']
          .filter(Boolean)
          .join('; ');
      }
      if (item.special_field_type === 'lb') {
        const lb = data.item6_lb;
        extra = [lb?.system1 ? `#1: ${lb.system1} Lb` : '', lb?.system2 ? `#2: ${lb.system2} Lb` : '']
          .filter(Boolean)
          .join('; ');
      }
      if (item.special_field_type === 'old_links') {
        extra = data.item12_oldLinksLeftWith ?? '';
      }
      if (item.special_field_type === 'mfg_date') {
        extra = data.item20_mfgOrHTDate ?? '';
      }
      return `<tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(item.description)}</td>
        <td><span class="${s1Class}">${s1}</span></td>
        <td><span class="${s2Class}">${s2}</span></td>
        <td>${escapeHtml(extra)}</td>
      </tr>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 24px; font-size: 11px; color: #334155; }
    .report-header { width: 100%; margin-bottom: 0; border-collapse: collapse; }
    .report-header td { vertical-align: top; padding: 16px; background: #334155; }
    .report-header-center { text-align: center; width: 70%; }
    .report-header-center h1 { font-size: 14px; font-weight: bold; margin: 0 0 4px 0; line-height: 1.2; color: #fff; }
    .report-header-right { text-align: right; font-size: 10px; width: 30%; }
    .report-header-right div { margin-bottom: 4px; color: #e2e8f0; }
    .report-header-right .checked { color: #f87171; font-weight: 600; }
    .comments-box { border: 2px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin: 16px 0; min-height: 48px; background: #f8fafc; }
    .comments-box .comments-label { font-weight: bold; font-size: 11px; margin-bottom: 4px; color: #475569; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #334155; color: #fff; font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-table { margin: 12px 0; }
    .info-table .info-label { background: #f1f5f9; color: #475569; width: 100px; font-weight: 600; }
    .info-table .info-value { padding: 8px 12px; color: #0f172a; font-weight: 600; }
    .section h2 { font-size: 12px; color: #334155; margin: 16px 0 8px 0; font-weight: 600; }
    .ref-text { font-size: 9px; color: #475569; margin: 16px 0 12px 0; line-height: 1.4; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .ref-text p { margin: 0 0 8px 0; }
    .ref-text strong { color: #334155; }
    .sig-heading { text-align: center; font-weight: bold; font-size: 12px; margin: 16px 0 12px 0; color: #334155; }
    .sig-block { width: 100%; border-collapse: collapse; margin-top: 12px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
    .sig-col { width: 25%; padding: 10px; vertical-align: top; }
    .sig-col:nth-child(odd) { background: #f8fafc; }
    .sig-col-label { font-weight: bold; font-size: 9px; margin-bottom: 4px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    .sig-col-line { border-bottom: 2px solid #94a3b8; min-height: 24px; margin-bottom: 2px; }
    .sig-col-desc { font-size: 8px; color: #64748b; }
    .yes-badge { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
    .no-badge { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
  </style>
</head>
<body>
  <table class="report-header">
    <tr>
      <td class="report-header-center">
        <h1>Hood and Duct Fire Extinguishing System(s)</h1>
        <h1>Certified Installation and Semi-Annual Inspection Report</h1>
      </td>
      <td class="report-header-right">
        <div>${data.reportType === 'annual' ? '☑' : '☐'} Annual Inspection</div>
        <div>${data.reportType === 'semi_annual' ? '☑' : '☐'} Semi-Annual Inspection</div>
        <div>${data.reportType === 'certified' ? '☑' : '☐'} Certified Inspection</div>
      </td>
    </tr>
  </table>

  <div class="comments-box">
    <div class="comments-label">COMMENTS:</div>
    <div>${escapeHtml(data.comments ?? '')}</div>
  </div>

  <table class="info-table">
    <tr>
      <td class="info-label">Customer Name</td>
      <td class="info-value">${escapeHtml(data.customerName ?? '')}</td>
      <td class="info-label">Date</td>
      <td class="info-value">${formatDateUS(data.date)}</td>
    </tr>
    <tr>
      <td class="info-label">Report Type</td>
      <td class="info-value">${reportTypeLabel}</td>
      <td class="info-label">Inspector</td>
      <td class="info-value">${escapeHtml(data.inspectorName ?? '')}</td>
    </tr>
  </table>

  <table class="info-table">
    <tr>
      <td class="info-label">Address</td>
      <td colspan="3" class="info-value">${escapeHtml(data.addressLine1 ?? '')}${data.addressLine2 ? ', ' + escapeHtml(data.addressLine2) : ''}</td>
    </tr>
    <tr>
      <td class="info-label">System #1</td>
      <td class="info-value">${escapeHtml(data.system1Label ?? '')}</td>
      <td class="info-label">System #2</td>
      <td class="info-value">${escapeHtml(data.system2Label ?? '')}</td>
    </tr>
    <tr>
      <td class="info-label">Certification</td>
      <td colspan="3" class="info-value">This <strong>is [${cert1}] / is not [${cert1Not}]</strong> certification of original installation.</td>
    </tr>
    <tr>
      <td class="info-label">Copy</td>
      <td colspan="3" class="info-value"><strong>Was [${cert2}] / was not [${cert2Not}]</strong> left with client.</td>
    </tr>
  </table>

  <div class="section">
    <h2>Inspection Checklist</h2>
    <table>
      <tr>
        <th>#</th>
        <th>DESCRIPTION</th>
        <th>SYSTEM 1</th>
        <th>SYSTEM 2</th>
        <th>EXPLANATIONS/EXCEPTIONS</th>
      </tr>
      ${checklistRows}
    </table>
  </div>

  <div class="ref-text">
    <p><strong>REFERENCE NFPA-96 (8-2.1):</strong> "Inspection and servicing of the fire extinguishing system by properly trained and qualified persons shall be made at least every six months." Insureds are responsible to provide this report to the insurer providing insurance coverage on the risk to receive your discounts. While the insured is required to maintain proper coverage, available discounts, if any, will affect the pricing of your insurance.</p>
    <p><strong>REFERENCE TEXAS INSURANCE CODE, Article 1.10, Section 7(a):</strong> "Violations (of the CODE) can result in disciplinary action including suspension or revocation of license or certificate of registration or an order to pay administrative penalties up to $25,000.00 per violation, restitution to customers, or other remedial action."</p>
    <p>All property and equipment (including this report) used in installing or servicing the above referenced system(s) will remain the property of ${escapeHtml(data.licensedCompany ?? '_________________________')} until payment is made in full.</p>
  </div>

  <div class="sig-heading">ACKNOWLEDGEMENT OF INSPECTION AND CONDITIONS:</div>

  <table class="sig-block" style="border: 1px solid #333;">
    <tr>
      <td class="sig-col" style="border: 1px solid #333; padding: 8px;">
        <div class="sig-col-label">INSPECTOR</div>
        <div class="sig-col-line">${escapeHtml(data.texasLicenseNumber ?? '')}</div>
        <div class="sig-col-desc">TEXAS LICENSE NUMBER</div>
      </td>
      <td class="sig-col" style="border: 1px solid #333; padding: 8px;">
        <div class="sig-col-label">SIGNATURE</div>
        <div class="sig-col-line">${escapeHtml(data.inspectorSignature ?? '')}</div>
        <div class="sig-col-desc">INSPECTION DATE</div>
        <div style="font-size: 10px; margin-top: 2px;">${formatDateUS(data.inspectionDate)}</div>
      </td>
      <td class="sig-col" style="border: 1px solid #333; padding: 8px;">
        <div class="sig-col-label">LICENSED COMPANY</div>
        <div class="sig-col-line">${escapeHtml(data.licensedCompany ?? '')}</div>
        <div class="sig-col-desc">TEXAS CERTIFICATE OF REGISTRATION NUMBER</div>
        <div style="font-size: 10px; margin-top: 2px;">${escapeHtml(data.texasCertificateNumber ?? '')}</div>
      </td>
      <td class="sig-col" style="border: 1px solid #333; padding: 8px;">
        <div class="sig-col-label">CUSTOMER</div>
        <div class="sig-col-line">${escapeHtml(data.customerAcknowledgementSignature ?? '')}</div>
        <div class="sig-col-desc">ACKNOWLEDGEMENT SIGNATURE</div>
        <div style="font-size: 10px; margin-top: 2px;">${escapeHtml(data.customerAcknowledgementName ?? '')}</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export type SemiAnnualReportPdfResult = {
  url: string;
  filePath: string;
  fileUri: string;
};

export async function generateSemiAnnualReportPdf(
  reportId: string,
  data: SemiAnnualReportFormData,
  items: SemiAnnualReportItem[],
): Promise<SemiAnnualReportPdfResult | null> {
  try {
    const {generatePDF} = await import('../native/htmlToPdfModule');
    if (typeof generatePDF !== 'function') return null;

    const html = buildSemiAnnualReportHtml(data, items);
    const options = {
      html,
      fileName: `semi-annual-report-${reportId.slice(0, 8)}`,
      directory: 'Documents',
      width: 612,
      height: 792,
      shouldPrintBackgrounds: true,
    };
    const file = await generatePDF(options);
    if (!file?.filePath) return null;

    const fileUri = file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`;
    const path = `semi-annual-reports/${reportId}-${Date.now()}.pdf`;
    const url = await dataService.uploadFile('inspection-reports', path, {
      uri: fileUri,
      type: 'application/pdf',
      name: `semi-annual-report-${reportId}.pdf`,
    });
    return {url, filePath: file.filePath, fileUri};
  } catch (e) {
    if (__DEV__) console.warn('Semi-annual report PDF generation failed:', e);
    return null;
  }
}
