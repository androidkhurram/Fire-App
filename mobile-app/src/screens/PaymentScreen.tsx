import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {StepProgress} from '../components/StepProgress';
import {FormInput} from '../components/FormInput';
import {AppButton} from '../components/AppButton';
import {colors} from '../theme/colors';

const STEPS = [
  {id: 1, title: 'Customer Information'},
  {id: 2, title: 'System Information'},
  {id: 3, title: 'Payment'},
  {id: 4, title: 'Add Template'},
  {id: 5, title: 'Receipt'},
];

type PaymentMethod = 'cash' | 'card' | 'invoice';

export interface PaymentInfo {
  paymentMethod: PaymentMethod;
  totalAmount: string;
  advanceAmount: string;
  balanceAmount: string;
}

interface PaymentScreenProps {
  initialData?: Partial<PaymentInfo>;
  onBack: () => void;
  onSaveAndContinue: (data: PaymentInfo) => void;
}

/**
 * Payment / Term of Payment
 * From designer: payment.jpg
 * Spec: cash, card, invoice - designer has Cash/Credit Card, adding Invoice
 */
export function PaymentScreen({
  initialData,
  onBack,
  onSaveAndContinue,
}: PaymentScreenProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (initialData?.paymentMethod as PaymentMethod) ?? 'cash',
  );
  const [totalAmount, setTotalAmount] = useState(initialData?.totalAmount ?? '');
  const [advanceAmount, setAdvanceAmount] = useState(
    initialData?.advanceAmount ?? '',
  );
  const [balanceAmount, setBalanceAmount] = useState(
    initialData?.balanceAmount ?? '',
  );

  const handleSave = () => {
    onSaveAndContinue({
      paymentMethod,
      totalAmount,
      advanceAmount,
      balanceAmount,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={STEPS} currentStep={2} />
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.title}>Term of Payment</Text>
        <Text style={styles.sectionLabel}>Payment Mode</Text>
        <View style={styles.radioRow}>
          {[
            {value: 'cash' as const, label: 'Cash'},
            {value: 'card' as const, label: 'Credit Card'},
            {value: 'invoice' as const, label: 'Invoice'},
          ].map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={styles.radioItem}
              onPress={() => setPaymentMethod(opt.value)}>
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === opt.value && styles.radioCircleActive,
                ]}>
                {paymentMethod === opt.value && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text style={styles.radioLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <FormInput
          label="Total Amount"
          placeholder="Enter total amount"
          value={totalAmount}
          onChangeText={setTotalAmount}
          keyboardType="decimal-pad"
        />
        <View style={styles.row}>
          <FormInput
            label="Advance Amount"
            placeholder="Enter advance amount"
            value={advanceAmount}
            onChangeText={setAdvanceAmount}
            keyboardType="decimal-pad"
            halfWidth
          />
          <FormInput
            label="Balance Amount"
            placeholder="Enter balance amount"
            value={balanceAmount}
            onChangeText={setBalanceAmount}
            keyboardType="decimal-pad"
            halfWidth
          />
        </View>
        <View style={styles.buttons}>
          <AppButton title="Back" onPress={onBack} variant="outline" style={styles.backBtn} />
          <AppButton title="Save & Continue" onPress={handleSave} style={styles.continueBtn} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  sidebar: {
    paddingLeft: 24,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  contentInner: {
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 12,
    fontWeight: '500',
  },
  radioRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.darkGray,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  backBtn: {
    flex: 1,
  },
  continueBtn: {
    flex: 1,
  },
});
