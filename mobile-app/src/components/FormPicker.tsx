import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import {colors} from '../theme/colors';
import {MODAL_LANDSCAPE_ORIENTATIONS} from '../constants/modalOrientation';

export interface PickerOption {
  value: string;
  label: string;
}

interface FormPickerProps {
  label: string;
  value: string;
  options: readonly PickerOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  halfWidth?: boolean;
  error?: string;
}

export function FormPicker({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select...',
  halfWidth,
  error,
}: FormPickerProps) {
  const [visible, setVisible] = useState(false);

  const selectedLabel = (options.find(o => o.value === value)?.label ?? value) || placeholder;

  return (
    <View style={[styles.container, halfWidth && styles.halfWidth]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.picker, error ? styles.pickerError : undefined]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}>
        <Text style={[styles.pickerText, !value && styles.placeholder]}>{selectedLabel}</Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        supportedOrientations={[...MODAL_LANDSCAPE_ORIENTATIONS]}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={[...options]}
              keyExtractor={item => item.value}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[styles.option, value === item.value && styles.optionSelected]}
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}>
                  <Text
                    style={[
                      styles.optionText,
                      value === item.value && styles.optionTextSelected,
                    ]}>
                    {item.label}
                  </Text>
                  {value === item.value && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    minWidth: 0,
    alignSelf: 'stretch',
    width: '100%',
  },
  halfWidth: {
    flex: 0,
    width: '48%',
    maxWidth: '48%',
  },
  label: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 6,
    fontWeight: '500',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.white,
  },
  pickerError: {
    borderColor: colors.primary,
  },
  pickerText: {
    fontSize: 16,
    color: colors.darkGray,
    flex: 1,
  },
  placeholder: {
    color: colors.gray,
  },
  chevron: {
    fontSize: 10,
    color: colors.gray,
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGray,
  },
  modalClose: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.accentLight,
  },
  optionText: {
    fontSize: 16,
    color: colors.darkGray,
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: 'bold',
  },
});
