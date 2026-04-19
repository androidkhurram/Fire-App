import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {KeyboardAwareFormScroll} from '../../components/KeyboardAwareFormScroll';
import {NumericKeyboardAccessory} from '../../components/NumericKeyboardAccessory';
import {StepProgress, type Step} from '../../components/StepProgress';
import {FormInput} from '../../components/FormInput';
import {AppButton} from '../../components/AppButton';
import {colors} from '../../theme/colors';

const WIZARD_STEPS = [
  {id: 1, title: 'Customer Information'},
  {id: 2, title: 'System Information'},
  {id: 3, title: 'Project Information'},
  {id: 4, title: 'Permit Status'},
  {id: 5, title: 'Work Progress'},
  {id: 6, title: 'System Checks'},
  {id: 7, title: 'Inspection Setup'},
  {id: 8, title: 'Payment'},
  {id: 9, title: 'Comments'},
];

export interface PaymentInfo {
  paymentMode: 'cash' | 'credit_card';
  totalAmount: string;
  advanceAmount: string;
  balanceAmount: string;
}

interface PaymentStepProps {
  initialData?: Partial<PaymentInfo>;
  onBack: () => void;
  onSaveAndContinue: (data: PaymentInfo) => void;
  steps?: Step[];
  currentStep?: number;
  onStepSelect?: (index: number) => void;
}

/**
 * Term of Payment - Cash or Credit Card (for report purpose only, no card integration)
 */
export function PaymentStep({
  initialData,
  onBack,
  onSaveAndContinue,
  steps = WIZARD_STEPS,
  currentStep = 7,
  onStepSelect,
}: PaymentStepProps) {
  const [paymentMode, setPaymentMode] = useState<'cash' | 'credit_card'>(
    initialData?.paymentMode ?? 'cash',
  );
  const [totalAmount, setTotalAmount] = useState(initialData?.totalAmount ?? '');
  const [advanceAmount, setAdvanceAmount] = useState(initialData?.advanceAmount ?? '');
  const [balanceAmount, setBalanceAmount] = useState(initialData?.balanceAmount ?? '');

  useEffect(() => {
    const total = parseFloat(totalAmount) || 0;
    const advance = parseFloat(advanceAmount) || 0;
    setBalanceAmount((total - advance).toFixed(2));
  }, [totalAmount, advanceAmount]);

  const handleAdvanceChange = (v: string) => {
    setAdvanceAmount(v);
    const total = parseFloat(totalAmount) || 0;
    const advance = parseFloat(v) || 0;
    setBalanceAmount((total - advance).toFixed(2));
  };

  const handleTotalChange = (v: string) => {
    setTotalAmount(v);
    const total = parseFloat(v) || 0;
    const advance = parseFloat(advanceAmount) || 0;
    setBalanceAmount((total - advance).toFixed(2));
  };

  const handleSave = () => {
    onSaveAndContinue({
      paymentMode,
      totalAmount,
      advanceAmount,
      balanceAmount,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={steps} currentStep={currentStep} onStepPress={onStepSelect} />
      </View>
      <KeyboardAwareFormScroll style={styles.content} contentContainerStyle={styles.contentInner}>
        <NumericKeyboardAccessory nativeID="payment-decimal-pad" />
        <Text style={styles.title}>Term of Payment</Text>
        <Text style={styles.subtitle}>
          Payment mode is for report purpose only. Credit card does not integrate with card processing.
        </Text>

        <Text style={styles.sectionLabel}>Payment Mode</Text>
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={[styles.radioOption, paymentMode === 'cash' && styles.radioSelected]}
            onPress={() => setPaymentMode('cash')}
          >
            <View style={[styles.radioCircle, paymentMode === 'cash' && styles.radioCircleSelected]}>
              {paymentMode === 'cash' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioLabel}>Cash</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioOption, paymentMode === 'credit_card' && styles.radioSelected]}
            onPress={() => setPaymentMode('credit_card')}
          >
            <View style={[styles.radioCircle, paymentMode === 'credit_card' && styles.radioCircleSelected]}>
              {paymentMode === 'credit_card' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioLabel}>Credit Card</Text>
          </TouchableOpacity>
        </View>

        <FormInput
          label="Total Amount"
          placeholder="Enter total amount"
          value={totalAmount}
          onChangeText={handleTotalChange}
          keyboardType="decimal-pad"
          inputAccessoryViewID="payment-decimal-pad"
        />
        <FormInput
          label="Advance Amount"
          placeholder="Enter advance amount"
          value={advanceAmount}
          onChangeText={handleAdvanceChange}
          keyboardType="decimal-pad"
          inputAccessoryViewID="payment-decimal-pad"
        />
        <FormInput
          label="Balance Amount"
          placeholder="Auto-calculated"
          value={balanceAmount}
          readOnly
        />

        <View style={styles.buttons}>
          <AppButton title="Back" onPress={onBack} variant="outline" style={styles.backBtn} />
          <AppButton
            title="Save & Continue"
            onPress={handleSave}
            style={styles.continueBtn}
          />
        </View>
      </KeyboardAwareFormScroll>
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
    paddingLeft: 16,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  content: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingRight: 24,
  },
  contentInner: {
    paddingBottom: 120,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.gray,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  radioSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight + '20',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.darkGray,
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
