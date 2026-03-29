import { supabaseServer } from '@/lib/supabase-server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDateUS } from '@/lib/date-utils';
import { DownloadPdfButton } from '@/components/DownloadPdfButton';

export const dynamic = 'force-dynamic';

async function getInspection(id: string) {
  const { data, error } = await supabaseServer
    .from('inspections')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

async function getCustomer(customerId: string) {
  const { data, error } = await supabaseServer
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

async function getInspectionItems(inspectionId: string) {
  const { data, error } = await supabaseServer
    .from('inspection_items')
    .select('item_name, status')
    .eq('inspection_id', inspectionId);
  if (error) return [];
  return (data ?? []) as Array<{ item_name: string; status: string }>;
}

async function getInspectionPhotos(inspectionId: string) {
  const { data, error } = await supabaseServer
    .from('photos')
    .select('photo_url')
    .eq('inspection_id', inspectionId);
  if (error) return [];
  return (data ?? []) as Array<{ photo_url: string }>;
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (value == null || value === '') return null;
  return (
    <div className="mb-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-gray-900">{value}</dd>
    </div>
  );
}

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inspection = await getInspection(id);
  if (!inspection) notFound();

  const [customer, items, photos] = await Promise.all([
    inspection.customer_id
      ? getCustomer(inspection.customer_id as string)
      : Promise.resolve(null),
    getInspectionItems(id),
    getInspectionPhotos(id),
  ]);

  const systemInfo = inspection.system_info_json as Record<string, unknown> | null | undefined;
  const serviceType = (inspection.service_type as string) ?? 'inspection';
  const resultStatus =
    (inspection.inspection_result as string) ??
    (inspection.inspection_status as string) ??
    'pass';
  const statusColor =
    resultStatus === 'pass'
      ? 'bg-green-100 text-green-800'
      : resultStatus === 'fail'
        ? 'bg-red-100 text-red-800'
        : 'bg-yellow-100 text-yellow-800';

  const customerAddress = customer
    ? [customer.address, customer.suite, customer.city, customer.state, customer.zip]
        .filter(Boolean)
        .join(', ')
    : '';

  const systemDisplay =
    (inspection.system_brand as string) ||
    (systemInfo?.systemNameModal as string) ||
    (Array.isArray(systemInfo?.systemBrand)
      ? (systemInfo?.systemBrand as string[]).join(', ')
      : (systemInfo?.systemBrand as string) ?? '');
  const systemModel = (inspection.system_model as string) ?? (systemInfo?.systemModel as string) ?? '';

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Link
          href="/inspections"
          className="text-red-600 hover:text-red-800 font-medium text-sm"
        >
          ← Back to Inspections
        </Link>
        <DownloadPdfButton elementId="inspection-print-area" title="Inspection Report" />
      </div>

      <div id="inspection-print-area" className="rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Report
          </h1>
          <p className="text-gray-500 mb-6">#{String(inspection.id).slice(0, 8).toUpperCase()}</p>

          <div className="space-y-6">
        <InfoSection title="Customer Information">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow label="Business" value={customer?.business_name as string} />
            <InfoRow label="Contact" value={customer?.customer_name as string} />
            <InfoRow label="Phone" value={customer?.phone as string} />
            <InfoRow label="Email" value={customer?.email as string} />
            <div className="sm:col-span-2">
              <InfoRow label="Address" value={customerAddress || undefined} />
            </div>
          </dl>
        </InfoSection>

        {(systemInfo || systemDisplay || systemModel) ? (
          <InfoSection title="System Information">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <InfoRow
                label="System"
                value={
                  systemDisplay && systemModel
                    ? `${systemDisplay} ${systemModel}`
                    : systemDisplay || systemModel || undefined
                }
              />
              <InfoRow label="Type" value={systemInfo?.systemType as string} />
              <InfoRow label="Serial Number" value={(inspection.serial_number as string) ?? (systemInfo?.serialNumber as string)} />
              <InfoRow label="Cylinder Size" value={systemInfo?.cylinderSize as string} />
              <InfoRow label="Cylinder Location" value={systemInfo?.cylinderLocation as string} />
              <InfoRow label="Last Hydrostatic Test" value={systemInfo?.lastHydrostaticTestDate as string} />
              <InfoRow label="Last Recharge" value={systemInfo?.lastRechargeDate as string} />
            </dl>
          </InfoSection>
        ) : null}

        {(inspection.permit_applied != null || inspection.permit_status || inspection.permit_notes) ? (
          <InfoSection title="Permit Status">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <InfoRow
                label="Permit Applied"
                value={inspection.permit_applied ? 'Yes' : 'No'}
              />
              <InfoRow label="Status" value={inspection.permit_status as string} />
              <InfoRow label="Notes" value={inspection.permit_notes as string} />
            </dl>
          </InfoSection>
        ) : null}

        {items.length > 0 ? (
          <InfoSection title="System Checks">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Item</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.item_name}>
                    <td className="py-2 text-gray-900">{item.item_name}</td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === 'pass'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'fail'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.status === 'pass' ? 'Pass' : item.status === 'fail' ? 'Fail' : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </InfoSection>
        ) : null}

        <InfoSection title="Inspection Details">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow label="Date" value={formatDateUS(inspection.inspection_date as string)} />
            <div>
              <dt className="text-sm font-medium text-gray-500">Service Type</dt>
              <dd className="mt-1 text-gray-900">
                {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Result</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                  {String(resultStatus).replace('_', ' ')}
                </span>
              </dd>
            </div>
            <InfoRow label="Phase" value={inspection.phase as string} />
            <InfoRow
              label="Next Service Due"
              value={customer?.next_service_date ? formatDateUS(customer.next_service_date as string) : undefined}
            />
          </dl>
        </InfoSection>

        {inspection.notes ? (
          <InfoSection title="Comments">
            <p className="text-gray-900 whitespace-pre-wrap">{String(inspection.notes)}</p>
          </InfoSection>
        ) : null}

        {photos.length > 0 ? (
          <InfoSection title="Photos">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((p, idx) => (
                <a
                  key={idx}
                  href={p.photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-red-500 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.photo_url}
                    alt={`Inspection photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          </InfoSection>
        ) : null}

        {inspection.report_url ? (
          <InfoSection title="Report">
            <a
              href={inspection.report_url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-800 font-medium"
            >
              View PDF Report →
            </a>
          </InfoSection>
        ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
