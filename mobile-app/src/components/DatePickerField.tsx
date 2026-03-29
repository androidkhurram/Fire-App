import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {colors} from '../theme/colors';

/** Format YYYY-MM-DD to US MM/DD/YYYY */
function formatDateUS(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${m}/${d}/${y}`;
}

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD (stored format)
  onChange: (dateStr: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select date...',
  minimumDate,
  maximumDate,
}: DatePickerFieldProps) {
  const [show, setShow] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date>(() =>
    value ? new Date(value + 'T12:00:00') : new Date(),
  );

  const handleChange = (event: {type: string}, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event?.type === 'dismissed') return;
    }
    if (selectedDate) {
      setPendingDate(selectedDate);
      onChange(selectedDate.toISOString().split('T')[0]!);
    }
  };

  const handleOpen = () => {
    setPendingDate(value ? new Date(value + 'T12:00:00') : new Date());
    setShow(true);
  };

  const handleDone = () => {
    const dateStr = pendingDate.toISOString().split('T')[0]!;
    onChange(dateStr);
    setShow(false);
  };

  const displayText = value ? formatDateUS(value) : placeholder;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={handleOpen}
        activeOpacity={0.7}>
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {displayText}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={pendingDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  inputText: {
    fontSize: 16,
    color: colors.darkGray,
  },
  placeholder: {
    color: colors.gray,
  },
  doneBtn: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.accent,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneText: {
    color: colors.white,
    fontWeight: '600',
  },
});
