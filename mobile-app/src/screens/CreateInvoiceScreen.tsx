import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Switch,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import {FormInput} from '../components/FormInput';
import {DatePickerField} from '../components/DatePickerField';
import {FormPicker} from '../components/FormPicker';
import {
  SERVICE_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '../constants/formOptions';
import {AppButton} from '../components/AppButton';
import {colors} from '../theme/colors';
import {dataService, Customer, Inspection, InvoiceItem, InvoiceLineItem} from '../services/dataService';
import {handleAsyncError, showError} from '../utils/errorHandler';
import {validateRequired} from '../utils/validation';

const TAX_RATE = 0.0825; // 8.25%

export interface InvoiceData {
  customerId: string;
  projectId: string;
  inspectionId: string;
  serviceType: 'installation' | 'inspection' | 'maintenance';
  invoiceDate: string;
  amount: string;
  tax: string;
  lineItems: Array<{
    id: string;
    invoiceItemId?: string;
    description: string;
    price: number;
    quantity: number;
    taxApplied: boolean;
  }>;
  paymentMethod: string;
  paymentStatus: string;
  pdfUri?: string;
  pdfName?: string;
}

interface CreateInvoiceScreenProps {
  preselectedCustomerId?: string;
  preselectedProjectId?: string;
  preselectedInspectionId?: string;
  onComplete?: (invoiceId: string) => void;
  onCancel?: () => void;
}

/**
 * Create Invoice screen - line items with auto-fill from catalog, editable price, 8.25% tax per item
 */
export function CreateInvoiceScreen({
  preselectedCustomerId,
  preselectedProjectId,
  preselectedInspectionId,
  onComplete,
  onCancel,
}: CreateInvoiceScreenProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showInspectionPicker, setShowInspectionPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [data, setData] = useState<InvoiceData>({
    customerId: preselectedCustomerId ?? '',
    projectId: preselectedProjectId ?? '',
    inspectionId: preselectedInspectionId ?? '',
    serviceType: 'inspection',
    invoiceDate: new Date().toISOString().split('T')[0],
    amount: '',
    tax: '',
    lineItems: [],
    paymentMethod: 'invoice',
    paymentStatus: 'pending',
  });

  useEffect(() => {
    Promise.all([
      dataService.getCustomers(),
      dataService.getInvoiceItems(),
    ]).then(([custList, itemList]) => {
      setCustomers(custList);
      setInvoiceItems(itemList);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (data.customerId) {
      dataService.getInspections(data.customerId).then(list => setInspections(list));
    } else {
      setInspections([]);
    }
  }, [data.customerId]);

  const selectedCustomer = customers.find(c => c.id === data.customerId);
  const selectedInspection = inspections.find(i => i.id === data.inspectionId);

  const addLineItem = (item?: InvoiceItem) => {
    const id = `li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (item) {
      setData(prev => ({
        ...prev,
        lineItems: [
          ...prev.lineItems,
          {
            id,
            invoiceItemId: item.id,
            description: item.name || item.description,
            price: item.price,
            quantity: 1,
            taxApplied: true,
          },
        ],
      }));
    } else {
      setData(prev => ({
        ...prev,
        lineItems: [
          ...prev.lineItems,
          {id, description: '', price: 0, quantity: 1, taxApplied: true},
        ],
      }));
    }
    setShowItemPicker(false);
  };

  const updateLineItem = (id: string, updates: Partial<InvoiceData['lineItems'][0]>) => {
    setData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(li =>
        li.id === id ? {...li, ...updates} : li,
      ),
    }));
  };

  const removeLineItem = (id: string) => {
    setData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(li => li.id !== id),
    }));
  };

  const hasLineItems = data.lineItems.some(
    li => li.description.trim() && li.price >= 0,
  );
  const subtotalFromLines = data.lineItems.reduce(
    (sum, li) => sum + li.price * li.quantity,
    0,
  );
  const totalTaxFromLines = data.lineItems.reduce((sum, li) => {
    if (!li.taxApplied) return sum;
    return sum + li.price * li.quantity * TAX_RATE;
  }, 0);

  const simpleAmount = parseFloat(data.amount) || 0;
  const simpleTax = parseFloat(data.tax) || 0;
  const updateAmountOrTax = (field: 'amount' | 'tax', value: string) => {
    setData(prev => {
      const next = {...prev, [field]: value};
      if (field === 'amount') {
        const amt = parseFloat(value) || 0;
        next.tax = (amt * TAX_RATE).toFixed(2);
      }
      return next;
    });
  };

  // Combine default amount + line items (both contribute to total)
  const subtotal = simpleAmount + subtotalFromLines;
  const totalTax = simpleTax + totalTaxFromLines;
  const total = subtotal + totalTax;

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
        copyTo: 'cachesDirectory',
      });
      const file = Array.isArray(res) ? res[0] : res;
      const uri = file?.fileCopyUri ?? file?.uri;
      if (uri) {
        setData(prev => ({
          ...prev,
          pdfUri: uri,
          pdfName: file?.name ?? 'invoice.pdf',
        }));
      }
    } catch (e) {
      if (DocumentPicker.isCancel(e)) return;
      handleAsyncError(e, 'PDF Error', 'Could not pick PDF file.');
    }
  };

  const handleSubmit = async () => {
    const custCheck = validateRequired(data.customerId ? 'x' : '', 'Customer');
    if (!custCheck.valid) {
      showError('Validation', 'Please select a customer.');
      return;
    }
    const validItems = data.lineItems.filter(
      li => li.description.trim() && li.price >= 0,
    );
    const useLineItems = validItems.length > 0;
    const useSimpleAmount = simpleAmount > 0;
    if (!useLineItems && !useSimpleAmount) {
      showError('Validation', 'Please add at least one line item, or enter an amount.');
      return;
    }
    setSubmitting(true);
    try {
      const serviceLabel = `${(data.serviceType || 'inspection').charAt(0).toUpperCase()}${(data.serviceType || 'inspection').slice(1)} Service`;
      const baseLineItem: InvoiceLineItem | null = useSimpleAmount
        ? {
            description: serviceLabel,
            price: simpleAmount,
            quantity: 1,
            tax_applied: true,
          }
        : null;
      const lineItemsFromForm = validItems.map(li => ({
        invoice_item_id: li.invoiceItemId,
        description: li.description.trim(),
        price: li.price,
        quantity: li.quantity,
        tax_applied: li.taxApplied,
      }));
      const lineItems: InvoiceLineItem[] = [
        ...(baseLineItem ? [baseLineItem] : []),
        ...lineItemsFromForm,
      ];
      const invoice = await dataService.createInvoice({
        customer_id: data.customerId,
        project_id: data.projectId || undefined,
        inspection_id: data.inspectionId || undefined,
        service_type: data.serviceType,
        invoice_date: data.invoiceDate,
        amount: subtotal,
        tax: totalTax,
        total,
        payment_method: data.paymentMethod as 'cash' | 'card' | 'invoice' | 'check' | 'other',
        payment_status: data.paymentStatus as 'paid' | 'pending' | 'overdue',
        ...(lineItems.length > 0 && {line_items: lineItems}),
      });
      if (data.pdfUri && data.pdfName) {
        const pdfUrl = await dataService.uploadInvoicePdf(invoice.id, {
          uri: data.pdfUri,
          type: 'application/pdf',
          name: data.pdfName,
        });
        if (pdfUrl) {
          await dataService.updateInvoice(invoice.id, {pdf_url: pdfUrl});
        }
      }
      onComplete?.(invoice.id);
    } catch (e) {
      handleAsyncError(e, 'Invoice Failed', 'Could not create the invoice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Invoice</Text>
      <Text style={styles.label}>Customer</Text>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setShowCustomerPicker(!showCustomerPicker)}>
        <Text style={styles.pickerText}>
          {selectedCustomer?.business_name ?? 'Select customer...'}
        </Text>
      </TouchableOpacity>
      {showCustomerPicker && (
        <View style={styles.pickerList}>
          <FlatList
            data={customers}
            keyExtractor={c => c.id}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setData({...data, customerId: item.id});
                  setShowCustomerPicker(false);
                }}>
                <Text style={styles.pickerItemText}>{item.business_name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
      {inspections.length > 0 ? (
        <>
          <Text style={styles.label}>Link to Inspection (optional)</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowInspectionPicker(!showInspectionPicker)}>
            <Text style={styles.pickerText}>
              {selectedInspection
                ? `${selectedInspection.inspection_date} - ${selectedInspection.service_type ?? 'inspection'}`
                : 'None'}
            </Text>
          </TouchableOpacity>
          {showInspectionPicker && (
            <View style={styles.pickerList}>
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setData(prev => ({...prev, inspectionId: ''}));
                  setShowInspectionPicker(false);
                }}>
                <Text style={styles.pickerItemText}>None</Text>
              </TouchableOpacity>
              {inspections.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setData(prev => ({...prev, inspectionId: item.id}));
                    setShowInspectionPicker(false);
                  }}>
                  <Text style={styles.pickerItemText}>
                    {item.inspection_date} - {item.service_type ?? 'inspection'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      ) : null}
      <FormPicker
        label="Service Type"
        value={data.serviceType}
        options={SERVICE_TYPES}
        onSelect={v => setData({...data, serviceType: v as InvoiceData['serviceType']})}
      />
      <DatePickerField
        label="Invoice Date"
        value={data.invoiceDate}
        onChange={v => setData(prev => ({...prev, invoiceDate: v}))}
      />

      <Text style={styles.simpleAmountLabel}>Default amount (optional, adds to line items)</Text>
      <FormInput
        label="Amount ($)"
        placeholder="0.00"
        value={data.amount}
        onChangeText={v => updateAmountOrTax('amount', v)}
        keyboardType="decimal-pad"
      />
      <FormInput
        label="Tax ($)"
        placeholder="8.25% of amount"
        value={data.tax}
        onChangeText={v => updateAmountOrTax('tax', v)}
        keyboardType="decimal-pad"
      />

      <View style={styles.lineItemsHeader}>
        <Text style={styles.label}>Line Items</Text>
        <TouchableOpacity
          style={styles.addItemBtn}
          onPress={() => setShowItemPicker(true)}>
          <Text style={styles.addItemBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>
      {showItemPicker && (
        <View style={styles.pickerList}>
          <TouchableOpacity
            style={styles.pickerItem}
            onPress={() => addLineItem()}>
            <Text style={styles.pickerItemText}>+ Add custom (blank)</Text>
          </TouchableOpacity>
          {invoiceItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.pickerItem}
              onPress={() => addLineItem(item)}>
              <Text style={styles.pickerItemText}>
                {(item.name || item.description)} - ${item.price.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {data.lineItems.map(li => (
        <View key={li.id} style={styles.lineItemCard}>
          <View style={styles.lineItemRow}>
            <FormInput
              label="Description"
              placeholder="Item description"
              value={li.description}
              onChangeText={v => updateLineItem(li.id, {description: v})}
              style={styles.lineItemDesc}
            />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeLineItem(li.id)}>
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.lineItemRow2}>
            <FormInput
              label="Price ($)"
              placeholder="0.00"
              value={li.price > 0 ? String(li.price) : ''}
              onChangeText={v =>
                updateLineItem(li.id, {price: parseFloat(v) || 0})
              }
              keyboardType="decimal-pad"
              style={styles.lineItemPrice}
            />
            <FormInput
              label="Qty"
              placeholder="1"
              value={String(li.quantity)}
              onChangeText={v =>
                updateLineItem(li.id, {quantity: parseInt(v, 10) || 1})
              }
              keyboardType="number-pad"
              style={styles.lineItemQty}
            />
          </View>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Apply 8.25% tax</Text>
            <Switch
              value={li.taxApplied}
              onValueChange={v => updateLineItem(li.id, {taxApplied: v})}
              trackColor={{false: colors.border, true: colors.accent}}
              thumbColor="#fff"
            />
          </View>
        </View>
      ))}

      <View style={styles.totalsCard}>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>{hasLineItems ? 'Subtotal' : 'Amount'}</Text>
          <Text style={styles.totalsValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>{hasLineItems ? 'Total Tax (8.25%)' : 'Tax'}</Text>
          <Text style={styles.totalsValue}>${totalTax.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalsRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
      </View>

      <FormPicker
        label="Payment Method"
        value={data.paymentMethod}
        options={PAYMENT_METHODS}
        onSelect={v => setData({...data, paymentMethod: v})}
      />
      <FormPicker
        label="Payment Status"
        value={data.paymentStatus}
        options={PAYMENT_STATUSES}
        onSelect={v => setData({...data, paymentStatus: v})}
      />
      <Text style={styles.label}>Attach PDF (optional)</Text>
      <TouchableOpacity style={styles.picker} onPress={pickPdf}>
        <Text style={styles.pickerText}>
          {data.pdfName ?? 'Select PDF file...'}
        </Text>
      </TouchableOpacity>
      <View style={styles.buttons}>
        {onCancel ? (
          <AppButton title="Cancel" onPress={onCancel} variant="outline" style={styles.btn} />
        ) : null}
        <AppButton
          title="Create Invoice"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.btn}
        />
      </View>
    </ScrollView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  pickerText: {
    fontSize: 16,
    color: colors.darkGray,
  },
  pickerList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 16,
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.darkGray,
  },
  lineItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  addItemBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.accent,
    borderRadius: 8,
  },
  addItemBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  lineItemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  lineItemDesc: {
    flex: 1,
  },
  removeBtn: {
    paddingVertical: 8,
  },
  removeBtnText: {
    color: colors.accent,
    fontSize: 14,
  },
  lineItemRow2: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  lineItemPrice: {
    flex: 1,
  },
  lineItemQty: {
    width: 80,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  taxLabel: {
    fontSize: 14,
    color: colors.darkGray,
  },
  totalsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalsLabel: {
    fontSize: 14,
    color: colors.darkGray,
  },
  totalsValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkGray,
  },
  simpleAmountLabel: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 16,
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.darkGray,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkGray,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  btn: {
    flex: 1,
  },
});
