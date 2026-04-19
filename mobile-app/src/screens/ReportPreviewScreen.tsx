import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Share,
  Alert,
  Platform,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {AppButton} from '../components/AppButton';
import {KeyboardAwareFormScroll} from '../components/KeyboardAwareFormScroll';
import {colors} from '../theme/colors';
import {
  loadReportSource,
  generateReportPdfForShare,
  generateReceiptPdfForShare,
  type ReportSource,
} from '../services/reportService';

interface ReportPreviewScreenProps {
  inspectionId: string;
  onDone?: () => void;
  onAddPhotos?: () => void;
  /** Same as Dashboard — semi-annual inspection report */
  onSemiAnnualReport?: () => void;
}

function DetailRow({label, value}: {label: string; value: string | undefined}) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function SectionCard({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

type GeneratedPdf = {filePath: string; fileUri: string};

export function ReportPreviewScreen({
  inspectionId,
  onDone,
  onAddPhotos,
  onSemiAnnualReport,
}: ReportPreviewScreenProps) {
  const {width: windowWidth} = useWindowDimensions();
  const [source, setSource] = useState<ReportSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  /** Last generated report PDF — shown inline; Share uses this without regenerating */
  const [reportPdf, setReportPdf] = useState<GeneratedPdf | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const s = await loadReportSource(inspectionId);
        if (!cancelled) setSource(s ?? null);
      } catch {
        if (!cancelled) setSource(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [inspectionId]);

  const generateReportPdf = async () => {
    const s = await loadReportSource(inspectionId);
    if (!s) return null;
    return generateReportPdfForShare(s);
  };

  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      const result = await generateReportPdf();
      if (!result) {
        Alert.alert(
          'PDF Error',
          'Could not generate PDF. Ensure the app has storage permissions and try again.',
        );
        return;
      }
      setReportPdf(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not generate PDF.';
      Alert.alert('PDF Error', msg);
    } finally {
      setGenerating(false);
    }
  };

  const shareReportFile = async (pdf: GeneratedPdf, s: ReportSource) => {
    const shareResult = await Share.share(
      {
        url: pdf.fileUri,
        title: `${s.inspection.service_type ?? 'Inspection'} Report`,
        message: `Report ${s.inspection.id.slice(0, 8)}`,
      },
      {dialogTitle: 'Share Report'},
    );
    if (shareResult.action === Share.dismissedAction) {
      // User cancelled
    }
  };

  const handleShare = async () => {
    if (reportPdf && source) {
      try {
        await shareReportFile(reportPdf, source);
      } catch (e) {
        const msg = (e as {message?: string})?.message ?? '';
        if (!msg.includes('User did not share')) {
          Alert.alert('Error', msg || 'Could not share report');
        }
      }
      return;
    }

    setGenerating(true);
    try {
      const s = await loadReportSource(inspectionId);
      if (!s) {
        Alert.alert('Error', 'Could not load report data');
        return;
      }
      const result = await generateReportPdfForShare(s);
      if (!result) {
        Alert.alert(
          'PDF Error',
          'Could not generate PDF. Ensure the app has storage permissions and try again.',
        );
        return;
      }
      setReportPdf(result);
      await shareReportFile(result, s);
    } catch (e) {
      const msg = (e as {message?: string})?.message ?? '';
      if (msg.includes('User did not share')) {
        // User cancelled - that's ok
      } else if (msg.includes('PDF engine')) {
        Alert.alert('PDF Error', msg);
      } else {
        Alert.alert('Error', msg || 'Could not share report');
      }
    } finally {
      setGenerating(false);
    }
  };

  const hasPayment =
    source?.wizardData?.paymentInfo &&
    (source.wizardData.paymentInfo.totalAmount ||
      source.wizardData.paymentInfo.advanceAmount);

  const handleIssueReceipt = async () => {
    const s = await loadReportSource(inspectionId);
    if (!s) {
      Alert.alert('Error', 'Could not load data for receipt');
      return;
    }
    setGeneratingReceipt(true);
    try {
      const result = await generateReceiptPdfForShare(s);
      if (!result) {
        Alert.alert(
          'PDF Error',
          'Could not generate receipt. Ensure the app has storage permissions.',
        );
        return;
      }
      await Share.share({
        url: result.fileUri,
        title: 'Receipt',
        message: Platform.OS === 'ios' ? 'Service Receipt' : `Receipt ${s.inspection.id.slice(0, 8)}`,
      } as {url: string; title?: string; message?: string});
    } catch (e) {
      const msg = (e as {message?: string})?.message ?? '';
      if (msg.includes('User did not share')) {
        // User cancelled
      } else if (msg.includes('PDF') || msg.includes('Rebuild')) {
        Alert.alert('PDF Error', msg);
      } else {
        Alert.alert('Error', msg || 'Could not share receipt');
      }
    } finally {
      setGeneratingReceipt(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!source) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Report not found</Text>
        {onSemiAnnualReport && (
          <AppButton
            title="Report"
            onPress={onSemiAnnualReport}
            variant="outline"
            style={styles.semiAnnualReportBtn}
          />
        )}
        {onDone && <AppButton title="Done" onPress={onDone} style={styles.doneBtn} />}
      </View>
    );
  }

  const {inspection, customer, wizardData} = source;
  const serviceType = inspection.service_type ?? 'inspection';
  const resultStatus =
    wizardData?.inspectionSetup?.inspectionResult ??
    (inspection as Record<string, unknown>).inspection_result ??
    inspection.inspection_status ??
    'pass';
  const statusColor =
    resultStatus === 'pass'
      ? '#4CAF50'
      : resultStatus === 'fail'
        ? '#F44336'
        : '#FF9800';

  const cust = wizardData?.customerInfo ?? customer;
  const systemInfo = wizardData?.systemInfo;
  const permitStatus = wizardData?.permitStatus;
  const systemChecks = wizardData?.systemChecks?.responses;
  const comments = wizardData?.comments?.commentText;
  const photos = wizardData?.photos ?? [];

  const systemDisplay =
    inspection.system_brand ||
    systemInfo?.systemNameModal ||
    (Array.isArray(systemInfo?.systemBrand)
      ? systemInfo.systemBrand.join(', ')
      : systemInfo?.systemBrand ?? '');
  const systemModel = inspection.system_model ?? systemInfo?.systemModel ?? '';

  return (
    <KeyboardAwareFormScroll style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Report
      </Text>
      <Text style={styles.reportId}>#{inspection.id.slice(0, 8).toUpperCase()}</Text>

      <SectionCard title="Customer">
        <Text style={styles.cardValue}>{cust?.businessName ?? customer?.business_name ?? 'N/A'}</Text>
        {(cust?.address || customer?.address || cust?.suite || customer?.suite) && (
          <Text style={styles.cardSub}>
            {[
              cust?.address ?? customer?.address,
              cust?.suite ?? customer?.suite,
            ]
              .filter(Boolean)
              .join(', ')}
          </Text>
        )}
        <DetailRow label="City" value={cust?.city ?? customer?.city} />
        <DetailRow label="State" value={cust?.state ?? customer?.state} />
        <DetailRow label="ZIP" value={cust?.zipCode ?? customer?.zip} />
        <DetailRow label="Phone" value={cust?.telephone ?? customer?.phone} />
        <DetailRow label="Email" value={cust?.email ?? customer?.email} />
        <DetailRow label="Contact" value={cust?.contactPersonName ?? customer?.contact_person_name} />
      </SectionCard>

      {systemInfo && (systemDisplay || systemInfo.systemType || systemInfo.serialNumber) && (
        <SectionCard title="System Information">
          <DetailRow
            label="System"
            value={
              systemDisplay
                ? `${systemDisplay}${systemModel ? ` ${systemModel}` : ''}`
                : undefined
            }
          />
          <DetailRow label="Type" value={systemInfo.systemType} />
          <DetailRow label="Serial" value={systemInfo.serialNumber} />
          <DetailRow label="Cylinder Size" value={systemInfo.cylinderSize} />
          <DetailRow label="Cylinder Location" value={systemInfo.cylinderLocation} />
          <DetailRow label="Last Hydrostatic Test" value={systemInfo.lastHydrostaticTestDate} />
          <DetailRow label="Last Recharge" value={systemInfo.lastRechargeDate} />
        </SectionCard>
      )}

      {!systemInfo && (inspection.system_brand || inspection.system_model) && (
        <SectionCard title="System">
          <DetailRow
            label="System"
            value={`${inspection.system_brand ?? ''} ${inspection.system_model ?? ''}`.trim()}
          />
        </SectionCard>
      )}

      {permitStatus &&
        (permitStatus.permitApplied || permitStatus.permitStatus || permitStatus.permitNotes) && (
          <SectionCard title="Permit Status">
            <DetailRow label="Applied" value={permitStatus.permitApplied ? 'Yes' : 'No'} />
            <DetailRow label="Status" value={permitStatus.permitStatus} />
            <DetailRow label="Notes" value={permitStatus.permitNotes} />
          </SectionCard>
        )}

      {systemChecks && Object.keys(systemChecks).length > 0 && (
        <SectionCard title="System Checks">
          {Object.entries(systemChecks).map(([item, status]) => (
            <View key={item} style={styles.checkRow}>
              <Text style={styles.checkItem} numberOfLines={2}>
                {item}
              </Text>
              <View
                style={[
                  styles.checkBadge,
                  {
                    backgroundColor:
                      status === 'yes' ? '#4CAF50' : status === 'no' ? '#F44336' : '#9E9E9E',
                  },
                ]}
              >
                <Text style={styles.checkBadgeText}>
                  {status === 'yes' ? 'Pass' : status === 'no' ? 'Fail' : 'N/A'}
                </Text>
              </View>
            </View>
          ))}
        </SectionCard>
      )}

      <SectionCard title="Inspection Details">
        <DetailRow
          label="Date"
          value={wizardData?.inspectionSetup?.inspectionDate ?? inspection.inspection_date}
        />
        <View style={styles.row}>
          <Text style={styles.label}>Service</Text>
          <Text style={styles.value}>
            {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Result</Text>
          <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
            <Text style={styles.statusText}>{String(resultStatus).replace('_', ' ')}</Text>
          </View>
        </View>
        {(systemDisplay || systemModel) && (
          <DetailRow label="System" value={`${systemDisplay} ${systemModel}`.trim()} />
        )}
        <DetailRow
          label="Next Inspection Due"
          value={customer?.next_service_date ?? undefined}
        />
        <DetailRow label="Technician" value={inspection.technician_name} />
      </SectionCard>

      {comments && (
        <SectionCard title="Comments">
          <Text style={styles.commentText}>{comments}</Text>
        </SectionCard>
      )}

      {photos.length > 0 && photos.some(p => p.uri) && (
        <SectionCard title="Photos">
          <View style={styles.photoGrid}>
            {photos
              .filter(p => p.uri)
              .map((p, i) => (
                <Image
                  key={i}
                  source={{uri: p.uri}}
                  style={styles.photoThumb}
                  resizeMode="cover"
                />
              ))}
          </View>
        </SectionCard>
      )}

      {reportPdf && (
        <SectionCard title="Report PDF">
          <Text style={styles.pdfHint}>Preview below — use Share to send or save.</Text>
          <View style={[styles.pdfFrame, {height: Math.min(520, Math.max(360, windowWidth * 0.85))}]}>
            <WebView
              source={{uri: reportPdf.fileUri}}
              style={styles.pdfWebView}
              originWhitelist={['*']}
              scalesPageToFit
              {...(Platform.OS === 'ios'
                ? {
                    allowingReadAccessToURL:
                      reportPdf.fileUri.replace(/\/[^/]+$/, '/') || reportPdf.fileUri,
                  }
                : {})}
            />
          </View>
          <AppButton
            title="Share report"
            onPress={async () => {
              if (!source) return;
              try {
                await shareReportFile(reportPdf, source);
              } catch (e) {
                const msg = (e as {message?: string})?.message ?? '';
                if (!msg.includes('User did not share')) {
                  Alert.alert('Error', msg || 'Could not share report');
                }
              }
            }}
            variant="outline"
            style={styles.pdfShareBtn}
          />
        </SectionCard>
      )}

      <View style={styles.actions}>
        <AppButton
          title={generating ? 'Generating...' : reportPdf ? 'Regenerate PDF' : 'Generate PDF'}
          onPress={handleGeneratePdf}
          loading={generating}
          style={styles.primaryBtn}
        />
        <AppButton
          title={generating ? 'Generating...' : 'Share'}
          onPress={handleShare}
          loading={generating}
          variant="outline"
          style={styles.shareBtn}
        />
        {hasPayment && (
          <AppButton
            title={generatingReceipt ? 'Generating...' : 'Issue Receipt'}
            onPress={handleIssueReceipt}
            loading={generatingReceipt}
            variant="outline"
            style={[styles.viewOnlineBtn, styles.receiptBtn]}
          />
        )}
        {onAddPhotos && (
          <TouchableOpacity style={styles.viewOnlineBtn} onPress={onAddPhotos}>
            <Text style={styles.viewOnlineText}>Add Photos</Text>
          </TouchableOpacity>
        )}
        {onSemiAnnualReport && (
          <AppButton
            title="Report"
            onPress={onSemiAnnualReport}
            variant="outline"
            style={styles.semiAnnualReportBtn}
          />
        )}
        {onDone && (
          <AppButton title="Done" onPress={onDone} variant="outline" style={styles.doneBtn} />
        )}
      </View>
    </KeyboardAwareFormScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 4,
  },
  reportId: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 18,
    color: colors.darkGray,
    fontWeight: '500',
  },
  cardSub: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkItem: {
    flex: 1,
    fontSize: 14,
    color: colors.darkGray,
    marginRight: 12,
  },
  checkBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  checkBadgeText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  label: {
    fontSize: 14,
    color: colors.gray,
  },
  value: {
    fontSize: 16,
    color: colors.darkGray,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
  primaryBtn: {
    marginBottom: 12,
  },
  shareBtn: {
    marginBottom: 12,
  },
  semiAnnualReportBtn: {
    marginBottom: 12,
  },
  receiptBtn: {
    marginBottom: 12,
  },
  viewOnlineBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  viewOnlineText: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '500',
  },
  doneBtn: {
    marginTop: 0,
  },
  pdfHint: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 12,
  },
  pdfFrame: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pdfWebView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  pdfShareBtn: {
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 24,
  },
});
