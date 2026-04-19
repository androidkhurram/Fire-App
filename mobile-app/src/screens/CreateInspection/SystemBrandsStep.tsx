import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import {KeyboardAwareFormScroll} from '../../components/KeyboardAwareFormScroll';
import {NumericKeyboardAccessory} from '../../components/NumericKeyboardAccessory';
import {StepProgress} from '../../components/StepProgress';
import {FormInput} from '../../components/FormInput';
import {AppButton} from '../../components/AppButton';
import {colors} from '../../theme/colors';
import {MODAL_LANDSCAPE_ORIENTATIONS} from '../../constants/modalOrientation';

const STEPS = [
  {id: 1, title: 'Customer Information'},
  {id: 2, title: 'System Information'},
  {id: 3, title: 'Project Information'},
  {id: 4, title: 'Work Progress'},
  {id: 5, title: 'System Checks'},
  {id: 6, title: 'System Brands'},
  {id: 7, title: 'Comments'},
];

const BRANDS = ['Protex', 'PyroChem', 'Kidde-range Guard', 'Buckeye', 'Ansul', 'Amerex'];
const MODELS: Record<string, string[]> = {
  Protex: ['L1600', 'L3000C', 'L4600C', 'L6000C'],
  PyroChem: ['PCL-160', 'PCL-300', 'PCL-460', 'PCL-600'],
  'Kidde-range Guard': ['1.6 Gal', '3 Gal', '4.6 Gal', '6 Gal'],
  Buckeye: ['BFR-5', 'BFR-10', 'BFR-15', 'BFR-20'],
  Ansul: ['1.5 Gal', '3 Gal'],
  Amerex: ['275', '375', '475', '600'],
};

export interface SystemBrandItem {
  brand: string;
  model?: string;
  quantity?: number;
}

export interface SystemBrandsInfo {
  selectedBrands: SystemBrandItem[];
}

interface SystemBrandsStepProps {
  initialData?: Partial<SystemBrandsInfo>;
  onBack: () => void;
  onSaveAndContinue: (data: SystemBrandsInfo) => void;
}

/**
 * Step 6 - System Brands
 * From designer: system brands.jpg, system brands-1/2/3.jpg
 */
export function SystemBrandsStep({
  initialData,
  onBack,
  onSaveAndContinue,
}: SystemBrandsStepProps) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [items, setItems] = useState<SystemBrandItem[]>(
    initialData?.selectedBrands ?? [],
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [addNewVisible, setAddNewVisible] = useState(false);
  const [modalQuantity, setModalQuantity] = useState('');
  const [addCylinder, setAddCylinder] = useState('');
  const [addQuantity, setAddQuantity] = useState('');

  const models = selectedBrand ? MODELS[selectedBrand] ?? [] : [];

  const openModelModal = (model: string) => {
    setSelectedModel(model);
    const existing = items.find(
      i => i.brand === selectedBrand && i.model === model,
    );
    setModalQuantity(existing?.quantity?.toString() ?? '');
    setModalVisible(true);
  };

  const saveModelModal = () => {
    if (selectedBrand && selectedModel) {
      const newItems = items.filter(
        i => !(i.brand === selectedBrand && i.model === selectedModel),
      );
      newItems.push({
        brand: selectedBrand,
        model: selectedModel,
        quantity: parseInt(modalQuantity, 10) || 0,
      });
      setItems(newItems);
    }
    setModalVisible(false);
    setSelectedModel(null);
    setModalQuantity('');
  };

  const saveAddNew = () => {
    if (addCylinder.trim()) {
      setItems([
        ...items,
        {
          brand: addCylinder,
          quantity: parseInt(addQuantity, 10) || 0,
        },
      ]);
    }
    setAddNewVisible(false);
    setAddCylinder('');
    setAddQuantity('');
  };

  const handleSave = () => {
    onSaveAndContinue({selectedBrands: items});
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={STEPS} currentStep={5} />
      </View>
      <KeyboardAwareFormScroll style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.title}>System Brands</Text>
        <View style={styles.brandGrid}>
          {BRANDS.map(brand => (
            <TouchableOpacity
              key={brand}
              style={[
                styles.brandBtn,
                selectedBrand === brand && styles.brandBtnActive,
              ]}
              onPress={() => setSelectedBrand(selectedBrand === brand ? null : brand)}>
              <Text
                style={[
                  styles.brandText,
                  selectedBrand === brand && styles.brandTextActive,
                ]}>
                {brand}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addMoreBtn}
            onPress={() => setAddNewVisible(true)}>
            <Text style={styles.addMoreText}>Add More</Text>
          </TouchableOpacity>
        </View>
        {selectedBrand && models.length > 0 && (
          <View style={styles.modelRow}>
            {models.map(model => (
              <TouchableOpacity
                key={model}
                style={[
                  styles.modelBtn,
                  items.some(i => i.brand === selectedBrand && i.model === model) &&
                    styles.modelBtnActive,
                ]}
                onPress={() => openModelModal(model)}>
                <Text
                  style={[
                    styles.modelText,
                    items.some(i => i.brand === selectedBrand && i.model === model) &&
                      styles.modelTextActive,
                  ]}>
                  {model}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.buttons}>
          <AppButton title="Back" onPress={onBack} variant="outline" style={styles.backBtn} />
          <AppButton title="Save & Continue" onPress={handleSave} style={styles.continueBtn} />
        </View>
      </KeyboardAwareFormScroll>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        supportedOrientations={[...MODAL_LANDSCAPE_ORIENTATIONS]}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 32 : 0}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.modalContent}>
              <NumericKeyboardAccessory nativeID="brands-modal-qty" />
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedModel}</Text>
              <FormInput
                label="Quantity"
                placeholder="Enter quantity"
                value={modalQuantity}
                onChangeText={setModalQuantity}
                keyboardType="numeric"
                inputAccessoryViewID="brands-modal-qty"
                returnKeyType="done"
                blurOnSubmit
              />
              <TouchableOpacity style={styles.modalOkBtn} onPress={saveModelModal}>
                <Text style={styles.modalOkText}>OK</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={addNewVisible}
        transparent
        animationType="fade"
        supportedOrientations={[...MODAL_LANDSCAPE_ORIENTATIONS]}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 32 : 0}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.modalContent}>
              <NumericKeyboardAccessory nativeID="brands-add-qty" />
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setAddNewVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add New</Text>
              <FormInput
                label="Cylinder"
                placeholder="Enter cylinder name"
                value={addCylinder}
                onChangeText={setAddCylinder}
              />
              <FormInput
                label="Quantity"
                placeholder="Enter quantity"
                value={addQuantity}
                onChangeText={setAddQuantity}
                keyboardType="numeric"
                inputAccessoryViewID="brands-add-qty"
                returnKeyType="done"
                blurOnSubmit
              />
              <TouchableOpacity
                style={[styles.modalOkBtn, styles.modalSaveBtn]}
                onPress={saveAddNew}>
                <Text style={styles.modalOkText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  brandBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  brandBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  brandText: {
    fontSize: 16,
    color: colors.darkGray,
  },
  brandTextActive: {
    color: colors.white,
  },
  addMoreBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  addMoreText: {
    fontSize: 16,
    color: colors.darkGray,
  },
  modelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  modelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  modelBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modelText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  modelTextActive: {
    color: colors.white,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: colors.gray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 20,
  },
  modalOkBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
  },
  modalOkText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
