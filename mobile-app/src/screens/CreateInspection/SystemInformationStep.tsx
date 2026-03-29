import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import {StepProgress, type Step} from '../../components/StepProgress';
import {FormInput} from '../../components/FormInput';
import {DatePickerField} from '../../components/DatePickerField';
import {FormPicker} from '../../components/FormPicker';
import {
  SYSTEM_TYPES,
  YES_NO_OPTIONS,
  CYLINDER_SIZES,
  CYLINDER_LOCATIONS,
  FUEL_SHUT_OFF_TYPES,
} from '../../constants/formOptions';
import {AppButton} from '../../components/AppButton';
import {colors} from '../../theme/colors';
import {dataService, type SystemFieldTemplate} from '../../services/dataService';

const WIZARD_STEPS = [
  {id: 1, title: 'Customer Information'},
  {id: 2, title: 'System Information'},
  {id: 3, title: 'Project Information'},
  {id: 4, title: 'Permit Status'},
  {id: 5, title: 'Work Progress'},
  {id: 6, title: 'System Checks'},
  {id: 7, title: 'Inspection Setup'},
  {id: 8, title: 'Comments'},
];

/** Quantity per temperature for Fusible Links (165°, 212°, etc.) and Thermal Heat Detector (135°, 190°, etc.) */
export type TemperatureQuantities = Record<string, number>;

export interface SystemBrandItem {
  brand: string;
  model?: string;
  quantity?: number;
  dateOfManufacture?: string;
}

export interface SystemInfo {
  systemNameModal: string;
  systemType: string;
  systemBrand: string | string[];
  systemBrandItems?: SystemBrandItem[];
  systemModel: string;
  serialNumber: string;
  ul300Requirement: string;
  cylinderSize: string;
  cylinderLocation: string;
  fuelShutOffType: string;
  fuelShutOffSize1: string;
  fuelShutOffSize2: string;
  fuelShutOffSerial1: string;
  fuelShutOffSerial2: string;
  lastHydrostaticTestDate: string;
  lastRechargeDate: string;
  fusibleLinks: TemperatureQuantities;
  thermalHeatDetector: TemperatureQuantities;
}

const FUSIBLE_LINK_TEMPS = ['165', '212', '280', '360', '450', '500'] as const;
const THERMAL_HEAT_DETECTOR_TEMPS = ['135', '190', '225', '325', '450', '600'] as const;

const defaultQuantities = (temps: readonly string[]): TemperatureQuantities =>
  Object.fromEntries(temps.map(t => [t, 0]));

interface SystemInformationStepProps {
  initialData?: Partial<SystemInfo>;
  initialDynamicValues?: Record<string, string>;
  onBack: () => void;
  onSaveAndContinue: (data: SystemInfo, dynamicFieldValues?: Record<string, string>) => void;
  steps?: Step[];
  currentStep?: number;
  onStepSelect?: (index: number) => void;
}

/**
 * Row with checkbox + quantity stepper for temperature-based quantities
 */
function TemperatureQuantityRow({
  label,
  quantity,
  onQuantityChange,
}: {
  label: string;
  quantity: number;
  onQuantityChange: (qty: number) => void;
}) {
  const checked = quantity > 0;
  return (
    <View style={styles.tempRow}>
      <TouchableOpacity
        style={styles.tempCheckbox}
        onPress={() => onQuantityChange(checked ? 0 : 1)}
        activeOpacity={0.7}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Text style={styles.checkboxText}>✓</Text>}
        </View>
      </TouchableOpacity>
      <Text style={styles.tempLabel}>{label}°</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={[styles.stepperBtn, quantity <= 0 && styles.stepperBtnDisabled]}
          onPress={() => quantity > 0 && onQuantityChange(quantity - 1)}
          disabled={quantity <= 0}
          activeOpacity={0.7}>
          <Text style={styles.stepperBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{quantity}</Text>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => onQuantityChange(quantity + 1)}
          activeOpacity={0.7}>
          <Text style={styles.stepperBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Step 2 - System Information
 * From designer: system information.jpg
 */
function renderDynamicField(
  template: SystemFieldTemplate,
  value: string,
  onChange: (v: string) => void,
) {
  const label = template.required ? `${template.label} *` : template.label;
  switch (template.field_type) {
    case 'checkbox':
      return (
        <View key={template.id} style={styles.dynamicField}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{template.label}</Text>
            <Switch
              value={value === 'true'}
              onValueChange={v => onChange(v ? 'true' : 'false')}
              trackColor={{false: colors.lightGray, true: colors.accentLight}}
              thumbColor={value === 'true' ? colors.accent : colors.gray}
            />
          </View>
        </View>
      );
    case 'number':
      return (
        <FormInput
          key={template.id}
          label={label}
          placeholder="Enter number"
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
        />
      );
    case 'date':
      return (
        <DatePickerField
          key={template.id}
          label={label}
          value={value}
          onChange={onChange}
        />
      );
    default:
      return (
        <FormInput
          key={template.id}
          label={label}
          placeholder={`Enter ${template.label.toLowerCase()}`}
          value={value}
          onChangeText={onChange}
        />
      );
  }
}

export function SystemInformationStep({
  initialData,
  initialDynamicValues,
  onBack,
  onSaveAndContinue,
  steps = WIZARD_STEPS,
  currentStep = 1,
  onStepSelect,
}: SystemInformationStepProps) {
  const [templates, setTemplates] = useState<SystemFieldTemplate[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>(
    initialDynamicValues ?? {},
  );
  const [brands, setBrands] = useState<string[]>([]);
  const [customBrands, setCustomBrands] = useState<string[]>([]);
  const [addBrandModalVisible, setAddBrandModalVisible] = useState(false);
  const [addBrandInput, setAddBrandInput] = useState('');
  const [selectedBrandForModels, setSelectedBrandForModels] = useState<string | null>(null);
  const [brandModels, setBrandModels] = useState<Record<string, string[]>>({});
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [modelModalBrand, setModelModalBrand] = useState<string | null>(null);
  const [modelModalModel, setModelModalModel] = useState<string | null>(null);
  const [modelModalQuantity, setModelModalQuantity] = useState('');
  const [modelModalDate, setModelModalDate] = useState('');
  const [addModelModalVisible, setAddModelModalVisible] = useState(false);
  const [addModelInput, setAddModelInput] = useState('');
  const [addModelQuantity, setAddModelQuantity] = useState('');
  const [addModelDate, setAddModelDate] = useState('');

  useEffect(() => {
    dataService.getSystemFieldTemplates().then(setTemplates);
  }, []);

  useEffect(() => {
    dataService.getSystemBrands().then(setBrands);
  }, []);

  useEffect(() => {
    if (!selectedBrandForModels) return;
    if (brandModels[selectedBrandForModels]) return;
    dataService.getSystemBrandModels(selectedBrandForModels).then(models => {
      setBrandModels(prev => ({...prev, [selectedBrandForModels]: models}));
    });
  }, [selectedBrandForModels]);

  const [data, setData] = useState<SystemInfo>({
    systemNameModal: initialData?.systemNameModal ?? '',
    systemType: initialData?.systemType ?? 'Wet Chemical',
    systemBrand: Array.isArray(initialData?.systemBrand)
      ? initialData.systemBrand
      : initialData?.systemBrand
        ? [initialData.systemBrand]
        : [],
    systemBrandItems: initialData?.systemBrandItems ?? [],
    systemModel: initialData?.systemModel ?? '',
    serialNumber: initialData?.serialNumber ?? '',
    ul300Requirement: initialData?.ul300Requirement ?? 'Yes',
    cylinderSize: initialData?.cylinderSize ?? 'Master',
    cylinderLocation: initialData?.cylinderLocation ?? 'Right',
    fuelShutOffType: initialData?.fuelShutOffType ?? 'Electric',
    fuelShutOffSize1: initialData?.fuelShutOffSize1 ?? '',
    fuelShutOffSize2: initialData?.fuelShutOffSize2 ?? '',
    fuelShutOffSerial1: initialData?.fuelShutOffSerial1 ?? '',
    fuelShutOffSerial2: initialData?.fuelShutOffSerial2 ?? '',
    lastHydrostaticTestDate: initialData?.lastHydrostaticTestDate ?? '',
    lastRechargeDate: initialData?.lastRechargeDate ?? '',
    fusibleLinks: initialData?.fusibleLinks ?? defaultQuantities(FUSIBLE_LINK_TEMPS),
    thermalHeatDetector: initialData?.thermalHeatDetector ?? defaultQuantities(THERMAL_HEAT_DETECTOR_TEMPS),
  });

  const selectedBrands = Array.isArray(data?.systemBrand) ? data.systemBrand : data?.systemBrand ? [data.systemBrand] : [];
  const baseBrands = [...brands, ...customBrands.filter(b => !brands.includes(b))];
  const allBrands = [
    ...baseBrands,
    ...selectedBrands.filter(b => !baseBrands.includes(b)),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={steps} currentStep={currentStep} onStepPress={onStepSelect} />
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.title}>System Information</Text>
        <FormInput
          label="System Name/Modal"
          placeholder="Enter system name or modal"
          value={data.systemNameModal}
          onChangeText={v => setData({...data, systemNameModal: v})}
        />
        <FormPicker
          label="System Type"
          value={data.systemType}
          options={SYSTEM_TYPES}
          onSelect={v => setData({...data, systemType: v})}
        />
        <View style={styles.brandSection}>
          <Text style={styles.sectionTitle}>System Brand</Text>
          <View style={styles.brandGrid}>
            {allBrands.map(brand => {
              const isSelected = selectedBrands.includes(brand);
              return (
                <TouchableOpacity
                  key={brand}
                  style={[
                    styles.brandBtn,
                    isSelected && styles.brandBtnActive,
                  ]}
                  onPress={() => {
                    const next = isSelected
                      ? selectedBrands.filter(b => b !== brand)
                      : [...selectedBrands, brand];
                    setData({...data, systemBrand: next});
                    if (!isSelected) setSelectedBrandForModels(brand);
                    else if (selectedBrandForModels === brand) setSelectedBrandForModels(null);
                  }}>
                  <Text
                    style={[
                      styles.brandText,
                      isSelected && styles.brandTextActive,
                    ]}>
                    {brand}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => setAddBrandModalVisible(true)}>
              <Text style={styles.addMoreText}>Add More</Text>
            </TouchableOpacity>
          </View>
          {selectedBrandForModels && selectedBrands.includes(selectedBrandForModels) && (
            <View style={styles.modelSection}>
              <Text style={styles.modelSectionTitle}>{selectedBrandForModels} – Models</Text>
              <View style={styles.modelRow}>
                {(brandModels[selectedBrandForModels] ?? []).map(model => {
                  const item = data.systemBrandItems?.find(
                    i => i.brand === selectedBrandForModels && i.model === model,
                  );
                  const isConfigured = !!item;
                  return (
                    <TouchableOpacity
                      key={model}
                      style={[styles.modelBtn, isConfigured && styles.modelBtnActive]}
                      onPress={() => {
                        setModelModalBrand(selectedBrandForModels);
                        setModelModalModel(model);
                        setModelModalQuantity(item?.quantity?.toString() ?? '');
                        setModelModalDate(item?.dateOfManufacture ?? '');
                        setModelModalVisible(true);
                      }}>
                      <Text style={[styles.modelText, isConfigured && styles.modelTextActive]}>
                        {model}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.addModelBtn}
                  onPress={() => {
                    setModelModalBrand(selectedBrandForModels);
                    setAddModelInput('');
                    setAddModelQuantity('');
                    setAddModelDate('');
                    setAddModelModalVisible(true);
                  }}>
                  <Text style={styles.addMoreText}>Add More</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        <FormInput
          label="System Model"
          placeholder="Enter model"
          value={data.systemModel}
          onChangeText={v => setData({...data, systemModel: v})}
        />
        <FormInput
          label="Serial Number"
          placeholder="Enter serial number"
          value={data.serialNumber}
          onChangeText={v => setData({...data, serialNumber: v})}
        />
        <FormPicker
          label="System Meets UL 300 Requirement"
          value={data.ul300Requirement}
          options={YES_NO_OPTIONS}
          onSelect={v => setData({...data, ul300Requirement: v})}
        />
        <FormPicker
          label="Cylinder Size(s)"
          value={data.cylinderSize}
          options={CYLINDER_SIZES}
          onSelect={v => setData({...data, cylinderSize: v})}
        />
        <FormPicker
          label="Cylinder Location(s)"
          value={data.cylinderLocation}
          options={CYLINDER_LOCATIONS}
          onSelect={v => setData({...data, cylinderLocation: v})}
        />
        <View style={styles.quantitySection}>
          <Text style={styles.sectionTitle}>Fusible Links (Quantity of Each)</Text>
          {FUSIBLE_LINK_TEMPS.map(temp => (
            <TemperatureQuantityRow
              key={temp}
              label={temp}
              quantity={data.fusibleLinks[temp] ?? 0}
              onQuantityChange={qty =>
                setData(prev => ({
                  ...prev,
                  fusibleLinks: {...prev.fusibleLinks, [temp]: qty},
                }))
              }
            />
          ))}
        </View>
        <View style={styles.quantitySection}>
          <Text style={styles.sectionTitle}>Thermal Heat Detector (Quantity of Each)</Text>
          {THERMAL_HEAT_DETECTOR_TEMPS.map(temp => (
            <TemperatureQuantityRow
              key={temp}
              label={temp}
              quantity={data.thermalHeatDetector[temp] ?? 0}
              onQuantityChange={qty =>
                setData(prev => ({
                  ...prev,
                  thermalHeatDetector: {...prev.thermalHeatDetector, [temp]: qty},
                }))
              }
            />
          ))}
        </View>
        <FormPicker
          label="Fuel Shut Off Type"
          value={data.fuelShutOffType}
          options={FUEL_SHUT_OFF_TYPES}
          onSelect={v => setData({...data, fuelShutOffType: v})}
        />
        <View style={styles.row}>
          <FormInput
            label="Fuel Shut Off (1)"
            placeholder="Enter size"
            value={data.fuelShutOffSize1}
            onChangeText={v => setData({...data, fuelShutOffSize1: v})}
            halfWidth
          />
          <FormInput
            label="Fuel Shut Off (2)"
            placeholder="Enter size"
            value={data.fuelShutOffSize2}
            onChangeText={v => setData({...data, fuelShutOffSize2: v})}
            halfWidth
          />
        </View>
        <View style={styles.row}>
          <FormInput
            label="Fuel Shut Off Serial (1)"
            placeholder="Enter serial no"
            value={data.fuelShutOffSerial1}
            onChangeText={v => setData({...data, fuelShutOffSerial1: v})}
            halfWidth
          />
          <FormInput
            label="Fuel Shut Off Serial (2)"
            placeholder="Enter serial no"
            value={data.fuelShutOffSerial2}
            onChangeText={v => setData({...data, fuelShutOffSerial2: v})}
            halfWidth
          />
        </View>
        <DatePickerField
          label="Last Hydrostatic Test Date"
          value={data.lastHydrostaticTestDate}
          onChange={v => setData({...data, lastHydrostaticTestDate: v})}
        />
        <DatePickerField
          label="Last Recharge Date"
          value={data.lastRechargeDate}
          onChange={v => setData({...data, lastRechargeDate: v})}
        />
        <Modal visible={modelModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => {
                  setModelModalVisible(false);
                  setModelModalBrand(null);
                  setModelModalModel(null);
                }}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{modelModalModel}</Text>
              <Text style={styles.modalLabel}>Quantity</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter quantity"
                placeholderTextColor={colors.gray}
                value={modelModalQuantity}
                onChangeText={setModelModalQuantity}
                keyboardType="numeric"
              />
              <DatePickerField
                label="Date of Manufacture"
                value={modelModalDate}
                onChange={setModelModalDate}
              />
              <TouchableOpacity
                style={styles.modalOkBtn}
                onPress={() => {
                  if (modelModalBrand && modelModalModel) {
                    const items = data.systemBrandItems ?? [];
                    const filtered = items.filter(
                      i => !(i.brand === modelModalBrand && i.model === modelModalModel),
                    );
                    filtered.push({
                      brand: modelModalBrand,
                      model: modelModalModel,
                      quantity: parseInt(modelModalQuantity, 10) || 0,
                      dateOfManufacture: modelModalDate.trim() || undefined,
                    });
                    setData(prev => ({...prev, systemBrandItems: filtered}));
                  }
                  setModelModalVisible(false);
                  setModelModalBrand(null);
                  setModelModalModel(null);
                  setModelModalQuantity('');
                  setModelModalDate('');
                }}>
                <Text style={styles.modalOkText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={addModelModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => {
                  setAddModelModalVisible(false);
                  setModelModalBrand(null);
                }}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add New</Text>
              <Text style={styles.modalLabel}>Cylinder / Model</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter cylinder or model name"
                placeholderTextColor={colors.gray}
                value={addModelInput}
                onChangeText={setAddModelInput}
              />
              <Text style={styles.modalLabel}>Quantity</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter quantity"
                placeholderTextColor={colors.gray}
                value={addModelQuantity}
                onChangeText={setAddModelQuantity}
                keyboardType="numeric"
              />
              <DatePickerField
                label="Date of Manufacture"
                value={addModelDate}
                onChange={setAddModelDate}
              />
              <TouchableOpacity
                style={styles.modalOkBtn}
                onPress={() => {
                  const name = addModelInput.trim();
                  if (name && modelModalBrand) {
                    const items = data.systemBrandItems ?? [];
                    const filtered = items.filter(
                      i => !(i.brand === modelModalBrand && i.model === name),
                    );
                    filtered.push({
                      brand: modelModalBrand,
                      model: name,
                      quantity: parseInt(addModelQuantity, 10) || 0,
                      dateOfManufacture: addModelDate.trim() || undefined,
                    });
                    setData(prev => ({...prev, systemBrandItems: filtered}));
                    setBrandModels(prev => ({
                      ...prev,
                      [modelModalBrand]: [...(prev[modelModalBrand] ?? []), name],
                    }));
                  }
                  setAddModelModalVisible(false);
                  setModelModalBrand(null);
                  setAddModelInput('');
                  setAddModelQuantity('');
                  setAddModelDate('');
                }}>
                <Text style={styles.modalOkText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={addBrandModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => {
                  setAddBrandModalVisible(false);
                  setAddBrandInput('');
                }}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Brand</Text>
              <Text style={styles.modalLabel}>Brand name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter brand name"
                placeholderTextColor={colors.gray}
                value={addBrandInput}
                onChangeText={setAddBrandInput}
              />
              <TouchableOpacity
                style={styles.modalOkBtn}
                onPress={() => {
                  const name = addBrandInput.trim();
                  if (name && !allBrands.includes(name)) {
                    setCustomBrands(prev => [...prev, name]);
                    setData(prev => ({
                      ...prev,
                      systemBrand: [...selectedBrands, name],
                    }));
                    setSelectedBrandForModels(name);
                  }
                  setAddBrandModalVisible(false);
                  setAddBrandInput('');
                }}>
                <Text style={styles.modalOkText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {templates.length > 0 && (
          <View style={styles.dynamicSection}>
            <Text style={styles.dynamicSectionTitle}>Custom Fields</Text>
            {templates.map(t =>
              renderDynamicField(
                t,
                dynamicValues[t.id] ?? '',
                v => setDynamicValues(prev => ({...prev, [t.id]: v})),
              )
            )}
          </View>
        )}
        <View style={styles.buttons}>
          <AppButton title="Back" onPress={onBack} variant="outline" style={styles.backBtn} />
          <AppButton
            title="Save & Continue"
            onPress={() => {
              const dyn = Object.fromEntries(
                Object.entries(dynamicValues).filter(entry => entry[1] != null && entry[1] !== ''),
              );
              onSaveAndContinue(data, dyn);
            }}
            style={styles.continueBtn}
          />
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  brandSection: {
    marginBottom: 24,
  },
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  brandText: {
    fontSize: 16,
    color: colors.darkGray,
  },
  brandTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  addMoreBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.lightGray,
  },
  addMoreText: {
    fontSize: 16,
    color: colors.darkGray,
  },
  modelSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modelSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 12,
  },
  modelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
  addModelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  quantitySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 12,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tempCheckbox: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  checkboxText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tempLabel: {
    fontSize: 16,
    color: colors.darkGray,
    width: 48,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 8,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  stepperBtnDisabled: {
    opacity: 0.5,
  },
  stepperBtnText: {
    fontSize: 18,
    color: colors.darkGray,
    fontWeight: '600',
  },
  stepperValue: {
    fontSize: 16,
    color: colors.darkGray,
    minWidth: 32,
    textAlign: 'center',
  },
  dynamicSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dynamicSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 16,
  },
  dynamicField: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
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
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 16,
  },
  modalOkBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalOkText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
