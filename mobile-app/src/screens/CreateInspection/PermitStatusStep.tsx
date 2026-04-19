import React, {useState} from 'react';
import {View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {KeyboardAwareFormScroll} from '../../components/KeyboardAwareFormScroll';
import DocumentPicker from 'react-native-document-picker';
import {StepProgress, type Step} from '../../components/StepProgress';
import {FormInput} from '../../components/FormInput';
import {DatePickerField} from '../../components/DatePickerField';
import {FormPicker} from '../../components/FormPicker';
import {PERMIT_STATUSES} from '../../constants/formOptions';
import {AppButton} from '../../components/AppButton';
import {colors} from '../../theme/colors';
import {dataService} from '../../services/dataService';
import {handleAsyncError} from '../../utils/errorHandler';

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

export interface PermitStatusInfo {
  permitApplied: boolean;
  permitApplicationDate: string;
  permitStatus: 'pending' | 'approved' | 'rejected';
  permitApprovalDate: string;
  permitNotes: string;
  permitDocumentUrl: string;
}

interface PermitStatusStepProps {
  initialData?: Partial<PermitStatusInfo>;
  onBack: () => void;
  onSaveAndContinue: (data: PermitStatusInfo) => void;
  steps?: Step[];
  currentStep?: number;
  onStepSelect?: (index: number) => void;
}

/**
 * Step 4 - Permit Status
 */
export function PermitStatusStep({
  initialData,
  onBack,
  onSaveAndContinue,
  steps = WIZARD_STEPS,
  currentStep = 3,
  onStepSelect,
}: PermitStatusStepProps) {
  const [data, setData] = useState<PermitStatusInfo>({
    permitApplied: initialData?.permitApplied ?? false,
    permitApplicationDate: initialData?.permitApplicationDate ?? '',
    permitStatus: initialData?.permitStatus ?? 'pending',
    permitApprovalDate: initialData?.permitApprovalDate ?? '',
    permitNotes: initialData?.permitNotes ?? '',
    permitDocumentUrl: initialData?.permitDocumentUrl ?? '',
  });
  const [uploading, setUploading] = useState(false);

  const uploadPermitAsset = async (uri: string, mimeType: string, fileName: string) => {
    setUploading(true);
    try {
      const path = `permit-${Date.now()}-${fileName}`;
      const url = await dataService.uploadFile('permit-documents', path, {
        uri,
        type: mimeType,
        name: fileName,
      });
      if (url) setData(prev => ({...prev, permitDocumentUrl: url}));
    } finally {
      setUploading(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });
      const file = Array.isArray(res) ? res[0] : res;
      if (!file?.fileCopyUri) return;
      await uploadPermitAsset(
        file.fileCopyUri,
        file.type ?? 'application/pdf',
        file.name ?? 'document',
      );
    } catch (e) {
      if (DocumentPicker.isCancel(e)) return;
      console.error(e);
    }
  };

  const pickImage = async (fromCamera: boolean) => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      saveToPhotos: false,
    };
    try {
      const result = fromCamera ? await launchCamera(options) : await launchImageLibrary(options);
      if (result.didCancel) return;
      const asset = result.assets?.[0];
      const assetUri = asset?.uri;
      if (!assetUri) return;
      await uploadPermitAsset(
        assetUri,
        asset.type ?? 'image/jpeg',
        asset.fileName ?? 'permit-photo.jpg',
      );
    } catch (e) {
      handleAsyncError(e, 'Photo Error', 'Could not open camera or gallery.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={steps} currentStep={currentStep} onStepPress={onStepSelect} />
      </View>
      <KeyboardAwareFormScroll style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.title}>Permit Status</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Permit Applied</Text>
          <Switch
            value={data.permitApplied}
            onValueChange={v => setData({...data, permitApplied: v})}
            trackColor={{false: colors.lightGray, true: colors.accentLight}}
            thumbColor={data.permitApplied ? colors.accent : colors.gray}
          />
        </View>
        <DatePickerField
          label="Permit Application Date"
          value={data.permitApplicationDate}
          onChange={v => setData({...data, permitApplicationDate: v})}
        />
        <FormPicker
          label="Permit Status"
          value={data.permitStatus}
          options={PERMIT_STATUSES}
          onSelect={v =>
            setData({
              ...data,
              permitStatus: v as 'pending' | 'approved' | 'rejected',
            })
          }
        />
        <DatePickerField
          label="Permit Approval Date"
          value={data.permitApprovalDate}
          onChange={v => setData({...data, permitApprovalDate: v})}
        />
        <FormInput
          label="Permit Notes"
          placeholder="Enter notes"
          value={data.permitNotes}
          onChangeText={v => setData({...data, permitNotes: v})}
        />
        <View style={styles.uploadSection}>
          <Text style={styles.uploadLabel}>Upload Permit Document</Text>
          {uploading ? (
            <View style={styles.uploadingWrap}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.uploadingText}>Uploading…</Text>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => pickImage(true)}
                disabled={uploading}>
                <Text style={styles.actionIcon}>📷</Text>
                <Text style={styles.actionText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => pickImage(false)}
                disabled={uploading}>
                <Text style={styles.actionIcon}>🖼️</Text>
                <Text style={styles.actionText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
          {!uploading ? (
            <TouchableOpacity
              style={styles.chooseFileBtn}
              onPress={handlePickDocument}
              disabled={uploading}>
              <Text style={styles.chooseFileText}>
                {data.permitDocumentUrl ? 'Replace with PDF or file…' : 'Choose file (PDF or image)'}
              </Text>
            </TouchableOpacity>
          ) : null}
          {data.permitDocumentUrl ? (
            <Text style={styles.uploadHint} numberOfLines={1}>
              {data.permitDocumentUrl}
            </Text>
          ) : null}
        </View>
        <View style={styles.buttons}>
          <AppButton title="Back" onPress={onBack} variant="outline" style={styles.backBtn} />
          <AppButton
            title="Save & Continue"
            onPress={() => onSaveAndContinue(data)}
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.darkGray,
  },
  uploadSection: {
    marginBottom: 16,
  },
  uploadLabel: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.accentLight,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  chooseFileBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  chooseFileText: {
    color: colors.accent,
    fontSize: 16,
  },
  uploadingWrap: {
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.gray,
  },
  uploadHint: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 8,
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
