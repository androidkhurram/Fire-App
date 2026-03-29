import { supabaseServer } from '@/lib/supabase-server';
import Link from 'next/link';
import { formatDateUS } from '@/lib/date-utils';
import { DownloadPdfButton } from '@/components/DownloadPdfButton';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getReport(id: string) {
  const { data, error } = await supabaseServer
    .from('semi_annual_reports')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data;
}

export default async function SemiAnnualReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const formData = (report.form_data ?? {}) as Record<string, unknown>;

  const { data: items } = await supabaseServer
    .from('semi_annual_report_items')
    .select('id, description, sort_order, special_field_type')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  return (
    <div className="p-8 print:p-0">
      <style>
        {`@media print {
          .print\\:hidden { display: none !important; }
          body, html { margin: 0; padding: 0; }
        }`}
      </style>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/semi-annual-reports" className="text-red-600 hover:text-red-800 font-medium">
          ← Back to Reports
        </Link>
        <DownloadPdfButton elementId="semi-annual-report-print-area" title="Semi-Annual Report" />
      </div>

      <div id="semi-annual-report-print-area" className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: `
          @page { margin: 0; size: letter; }
          @media print {
            * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            body { padding: 12mm !important; }
          }
        ` }} />
        {/* Header - Navy with red accent */}
        <div className="bg-slate-800 px-6 py-3 mb-0">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="text-center align-top w-[70%]">
                  <h1 className="text-base font-bold text-white leading-tight">Hood and Duct Fire Extinguishing System(s)</h1>
                  <h1 className="text-base font-bold text-white leading-tight">Certified Installation and Semi-Annual Inspection Report</h1>
                </td>
                <td className="text-right align-top w-[30%]">
                  <div className="inline-block bg-white/10 rounded-lg px-4 py-2 text-sm text-slate-100">
                    <div className={formData.reportType === 'annual' ? 'text-red-400 font-medium' : ''}>{formData.reportType === 'annual' ? '☑' : '☐'} Annual Inspection</div>
                    <div className={formData.reportType === 'semi_annual' ? 'text-red-400 font-medium' : ''}>{formData.reportType === 'semi_annual' ? '☑' : '☐'} Semi-Annual Inspection</div>
                    <div className={formData.reportType === 'certified' ? 'text-red-400 font-medium' : ''}>{formData.reportType === 'certified' ? '☑' : '☐'} Certified Inspection</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-6">
        {/* Comments box */}
        <div className="border-2 border-slate-300 rounded-lg bg-slate-50 p-4 mb-4 min-h-[48px]">
          <div className="font-bold text-sm text-slate-700 mb-1 flex items-center gap-2">
            <span className="w-1 h-4 bg-red-600 rounded-full" />
            COMMENTS:
          </div>
          <div className="text-slate-800">{String(formData.comments ?? '')}</div>
        </div>

        {/* Info table */}
        <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden mb-4 shadow-sm">
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="px-4 py-3 text-sm text-slate-600 bg-slate-100 font-medium w-36">Customer Name</td>
              <td className="px-4 py-3 font-semibold text-slate-900 bg-white">{String(formData.customerName ?? '—')}</td>
              <td className="px-4 py-3 text-sm text-slate-600 bg-slate-100 font-medium w-24">Date</td>
              <td className="px-4 py-3 font-semibold text-slate-900 bg-white">{formatDateUS(formData.date as string)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-slate-600 bg-slate-100 font-medium">Report Type</td>
              <td className="px-4 py-3 font-semibold text-slate-900 bg-white">
                {formData.reportType === 'annual'
                  ? 'Annual'
                  : formData.reportType === 'semi_annual'
                    ? 'Semi-Annual'
                    : formData.reportType === 'certified'
                      ? 'Certified'
                      : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600 bg-slate-100 font-medium">Inspector</td>
              <td className="px-4 py-3 font-semibold text-slate-900 bg-white">{String(formData.inspectorName ?? '—')}</td>
            </tr>
          </tbody>
        </table>

        {/* Address & Systems */}
        <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden mb-4 shadow-sm">
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="px-4 py-3 text-sm text-slate-600 bg-slate-100 font-medium w-36">Address</td>
              <td className="px-4 py-3 font-semibold text-slate-900 bg-white" colSpan={3}>
                {String(formData.addressLine1 ?? '—')}
                {formData.addressLine2 ? `, ${String(formData.addressLine2)}` : ''}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-slate-600 bg-slate-100 font-medium">System #1</td>
              <td className="px-4 py-3 font-semibold text-slate-900 bg-white">{String(formData.system1Label ?? '—')}</td>
              <td className="px-4 py-3 text-sm text-slate-600 bg-slate-100 font-medium w-24">System #2</td>
              <td className="px-4 py-3 font-semibold text-slate-900 bg-white">{String(formData.system2Label ?? '—')}</td>
            </tr>
          </tbody>
        </table>

        {/* Certification */}
        <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden mb-4 shadow-sm">
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="px-4 py-3 text-sm text-slate-600 bg-slate-100 font-medium w-36">Certification</td>
              <td className="px-4 py-3 text-slate-800 bg-white">
                This <strong>is [{formData.isCertificationOfOriginalInstallation === true ? '✓' : ' '}] / is not [{formData.isCertificationOfOriginalInstallation === false ? '✓' : ' '}]</strong> certification of original installation.
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-slate-600 bg-slate-100 font-medium">Copy</td>
              <td className="px-4 py-3 text-slate-800 bg-white">
                <strong>Was [{formData.copyLeftWithClient === true ? '✓' : ' '}] / was not [{formData.copyLeftWithClient === false ? '✓' : ' '}]</strong> left with client.
              </td>
            </tr>
          </tbody>
        </table>

        <div className="overflow-x-auto">
          <h2 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <span className="w-1 h-5 bg-red-600 rounded-full" />
            Inspection Checklist
          </h2>
          <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden shadow-sm" style={{ pageBreakInside: 'auto' }}>
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">#</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Description</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Sys 1</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Sys 2</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {(items ?? []).map((item, idx) => {
                const checklist = (formData.checklist as Record<string, { system1: string; system2: string }>) ?? {};
                const c = checklist[item.id] ?? { system1: 'yes', system2: 'yes' };
                const explanations = (formData.explanations as Record<string, string>) ?? {};
                let extra = explanations[item.id] ?? '';
                if (item.special_field_type === 'psi') {
                  const psi = formData.item5_psi as { system1?: string; system2?: string } | undefined;
                  extra = [psi?.system1 ? `#1: ${psi.system1} PSI` : '', psi?.system2 ? `#2: ${psi.system2} PSI` : ''].filter(Boolean).join('; ');
                }
                if (item.special_field_type === 'lb') {
                  const lb = formData.item6_lb as { system1?: string; system2?: string } | undefined;
                  extra = [lb?.system1 ? `#1: ${lb.system1} Lb` : '', lb?.system2 ? `#2: ${lb.system2} Lb` : ''].filter(Boolean).join('; ');
                }
                if (item.special_field_type === 'old_links') extra = (formData.item12_oldLinksLeftWith as string) ?? '';
                if (item.special_field_type === 'mfg_date') extra = (formData.item20_mfgOrHTDate as string) ?? '';
                return (
                  <tr key={item.id} className="hover:bg-slate-50" style={{ pageBreakInside: 'avoid' }}>
                    <td className="px-4 py-2 text-slate-600 font-medium align-middle">{idx + 1}</td>
                    <td className="px-4 py-2 text-slate-900 align-middle">{item.description}</td>
                    <td className="px-4 py-2 align-middle">
                      <span className={`inline-block text-center px-3 py-1 rounded text-xs font-medium leading-tight ${c.system1 === 'yes' ? 'bg-green-100 text-green-800' : c.system1 === 'no' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}`} style={{ minWidth: '36px' }}>
                        {c.system1 === 'yes' ? 'Yes' : c.system1 === 'no' ? 'No' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <span className={`inline-block text-center px-3 py-1 rounded text-xs font-medium leading-tight ${c.system2 === 'yes' ? 'bg-green-100 text-green-800' : c.system2 === 'no' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}`} style={{ minWidth: '36px' }}>
                        {c.system2 === 'yes' ? 'Yes' : c.system2 === 'no' ? 'No' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600 text-sm align-middle">{extra || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer - Legal references */}
        <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed space-y-2">
          <p><strong className="text-slate-800">REFERENCE NFPA-96 (8-2.1):</strong> &quot;Inspection and servicing of the fire extinguishing system by properly trained and qualified persons shall be made at least every six months.&quot; Insureds are responsible to provide this report to the insurer providing insurance coverage on the risk to receive your discounts. While the insured is required to maintain proper coverage, available discounts, if any, will affect the pricing of your insurance.</p>
          <p><strong className="text-slate-800">REFERENCE TEXAS INSURANCE CODE, Article 1.10, Section 7(a):</strong> &quot;Violations (of the CODE) can result in disciplinary action including suspension or revocation of license or certificate of registration or an order to pay administrative penalties up to $25,000.00 per violation, restitution to customers, or other remedial action.&quot;</p>
          <p>All property and equipment (including this report) used in installing or servicing the above referenced system(s) will remain the property of <strong>{String(formData.licensedCompany ?? '_________________________')}</strong> until payment is made in full.</p>
        </div>

        {/* Footer - Signature block */}
        <div className="print:break-before-page mt-4">
          <div className="text-center font-bold text-sm mb-2 text-slate-800 flex items-center justify-center gap-2">
            <span className="w-8 h-0.5 bg-red-600" />
            ACKNOWLEDGEMENT OF INSPECTION AND CONDITIONS
            <span className="w-8 h-0.5 bg-red-600" />
          </div>
          <table className="w-full border border-slate-300 rounded-lg overflow-hidden shadow-sm">
          <tbody>
            <tr>
              <td className="border border-slate-200 p-4 align-top w-1/4 bg-slate-50">
                <div className="font-bold text-xs text-slate-700 uppercase tracking-wide">Inspector</div>
                <div className="border-b-2 border-slate-400 min-h-[28px] py-1 mt-1 text-slate-900">{String(formData.texasLicenseNumber ?? '')}</div>
                <div className="text-slate-500 text-xs mt-1">Texas License Number</div>
              </td>
              <td className="border border-slate-200 p-4 align-top w-1/4 bg-white">
                <div className="font-bold text-xs text-slate-700 uppercase tracking-wide">Signature</div>
                <div className="border-b-2 border-slate-400 min-h-[28px] py-1 mt-1 text-slate-900">{String(formData.inspectorSignature ?? '')}</div>
                <div className="text-slate-500 text-xs mt-1">Inspection Date</div>
                <div className="text-sm mt-1 font-medium text-slate-800">{formatDateUS(formData.inspectionDate as string)}</div>
              </td>
              <td className="border border-slate-200 p-4 align-top w-1/4 bg-slate-50">
                <div className="font-bold text-xs text-slate-700 uppercase tracking-wide">Licensed Company</div>
                <div className="border-b-2 border-slate-400 min-h-[28px] py-1 mt-1 text-slate-900">{String(formData.licensedCompany ?? '')}</div>
                <div className="text-slate-500 text-xs mt-1">Texas Certificate of Registration Number</div>
                <div className="text-sm mt-1 font-medium text-slate-800">{String(formData.texasCertificateNumber ?? '')}</div>
              </td>
              <td className="border border-slate-200 p-4 align-top w-1/4 bg-white">
                <div className="font-bold text-xs text-slate-700 uppercase tracking-wide">Customer</div>
                <div className="border-b-2 border-slate-400 min-h-[28px] py-1 mt-1 text-slate-900">{String(formData.customerAcknowledgementSignature ?? '')}</div>
                <div className="text-slate-500 text-xs mt-1">Acknowledgement Signature</div>
                <div className="text-sm mt-1 font-medium text-slate-800">{String(formData.customerAcknowledgementName ?? '')}</div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
        </div>
      </div>
    </div>
  );
}
