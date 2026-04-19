import React, {useState, useEffect, useLayoutEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Share,
  Alert,
  Image,
} from 'react-native';
import {AppButton} from '../components/AppButton';
import {KeyboardAwareFormScroll} from '../components/KeyboardAwareFormScroll';
import {colors} from '../theme/colors';
import {dataService, type Invoice, type Customer, type InvoiceLineItem} from '../services/dataService';
import {generateInvoicePdf} from '../services/invoiceService';
import {getDisplayInvoiceNumber} from '../utils/invoiceDisplay';

interface InvoicePreviewScreenProps {
  invoiceId: string;
  onDone?: () => void;
}

export function InvoicePreviewScreen({invoiceId, onDone}: InvoicePreviewScreenProps) {
  const navigation = useNavigation();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const inv = await dataService.getInvoice(invoiceId);
        if (cancelled) return;
        if (inv) {
          setInvoice(inv);
          if (inv.customer_id) {
            const [cust, items] = await Promise.all([
              dataService.getCustomer(inv.customer_id),
              dataService.getInvoiceLineItems(inv.id),
            ]);
            if (!cancelled) {
              setCustomer(cust ?? null);
              setLineItems(items ?? []);
            }
          } else {
            const items = await dataService.getInvoiceLineItems(inv.id);
            if (!cancelled) setLineItems(items ?? []);
          }
        }
      } catch {
        if (!cancelled) setInvoice(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  useLayoutEffect(() => {
    if (invoice) {
      navigation.setOptions({title: getDisplayInvoiceNumber(invoice)});
    } else {
      navigation.setOptions({title: 'Invoice'});
    }
  }, [invoice, navigation]);

  const generatePdf = async () => {
    if (!invoice) return null;
    return generateInvoicePdf(
      invoice,
      customer ?? undefined,
      lineItems.length > 0 ? lineItems : undefined,
    );
  };

  const handleGeneratePdf = async () => {
    if (!invoice) return;
    setGenerating(true);
    try {
      const result = await generatePdf();
      if (!result) {
        Alert.alert(
          'PDF Error',
          'Could not generate PDF. Ensure the app has storage permissions and try again.',
        );
        return;
      }
      Alert.alert('PDF Generated', 'Invoice PDF has been saved to your device.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not generate PDF.';
      Alert.alert('PDF Error', msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!invoice) return;
    setGenerating(true);
    try {
      const result = await generatePdf();
      if (!result) {
        Alert.alert(
          'PDF Error',
          'Could not generate PDF. Ensure the app has storage permissions and try again.',
        );
        return;
      }
      const label = getDisplayInvoiceNumber(invoice);
      const shareResult = await Share.share(
        {
          url: result.fileUri,
          title: label,
          message: label,
        },
        {
          dialogTitle: 'Share Invoice',
        },
      );
      if (shareResult.action === Share.dismissedAction) {
        // User cancelled - that's ok
      }
    } catch (e) {
      if ((e as {message?: string})?.message?.includes('User did not share')) {
        // User cancelled - that's ok
      } else {
        Alert.alert('Error', 'Could not share invoice');
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Invoice not found</Text>
        {onDone && <AppButton title="Done" onPress={onDone} style={styles.doneBtn} />}
      </View>
    );
  }

  const serviceType = invoice.service_type ?? 'inspection';
  const paymentMethod = invoice.payment_method ?? 'invoice';
  const paymentStatus = invoice.payment_status ?? 'pending';

  return (
    <KeyboardAwareFormScroll style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Invoice</Text>
      <Text style={styles.invoiceId}>{getDisplayInvoiceNumber(invoice)}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Customer</Text>
        <Text style={styles.cardValue}>{customer?.business_name ?? 'N/A'}</Text>
        {(customer?.address || customer?.suite) && (
          <Text style={styles.cardSub}>
            {[customer?.address, customer?.suite].filter(Boolean).join(', ')}
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{invoice.invoice_date}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Service</Text>
          <Text style={styles.value}>
            {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
          </Text>
        </View>
        {lineItems.length > 0 ? (
          <>
            {lineItems.map((li, idx) => (
              <View key={li.id ?? idx} style={styles.row}>
                <Text style={styles.label}>{li.description}</Text>
                <Text style={styles.value}>
                  ${(li.price * (li.quantity ?? 1)).toFixed(2)}
                  {li.tax_applied ? ' (tax)' : ''}
                </Text>
              </View>
            ))}
            <View style={styles.row}>
              <Text style={styles.label}>Subtotal</Text>
              <Text style={styles.value}>${invoice.amount.toFixed(2)}</Text>
            </View>
            {invoice.tax > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Total Tax</Text>
                <Text style={styles.value}>${invoice.tax.toFixed(2)}</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.value}>${invoice.amount.toFixed(2)}</Text>
            </View>
            {invoice.tax > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Tax</Text>
                <Text style={styles.value}>${invoice.tax.toFixed(2)}</Text>
              </View>
            )}
          </>
        )}
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${invoice.total.toFixed(2)}</Text>
        </View>
        {customer?.next_service_date && (
          <View style={styles.row}>
            <Text style={styles.label}>Next Inspection Due</Text>
            <Text style={styles.value}>{customer.next_service_date}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Payment</Text>
          <Text style={styles.value}>{paymentMethod} • {paymentStatus}</Text>
        </View>
      </View>

      {invoice.customer_signature_data_url?.startsWith('data:image') ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer signature</Text>
          <Image
            source={{uri: invoice.customer_signature_data_url}}
            style={styles.signatureImg}
            resizeMode="contain"
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          title={generating ? 'Generating...' : 'Generate PDF'}
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
        {onDone && (
          <AppButton
            title="Done"
            onPress={onDone}
            variant="outline"
            style={styles.doneBtn}
          />
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
  invoiceId: {
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
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.border,
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
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accent,
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
  doneBtn: {
    marginTop: 0,
  },
  signatureImg: {
    width: '100%',
    height: 160,
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 24,
  },
});
