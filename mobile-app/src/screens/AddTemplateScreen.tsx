import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {StepProgress} from '../components/StepProgress';
import {AppButton} from '../components/AppButton';
import {colors} from '../theme/colors';

const STEPS = [
  {id: 1, title: 'Customer Information'},
  {id: 2, title: 'System Information'},
  {id: 3, title: 'Payment'},
  {id: 4, title: 'Add Template'},
  {id: 5, title: 'Receipt'},
];

interface AddTemplateScreenProps {
  onBack: () => void;
  onSaveAndContinue: () => void;
}

/**
 * Add Template - File upload
 * From designer: upload picture.jpg
 */
export function AddTemplateScreen({
  onBack,
  onSaveAndContinue,
}: AddTemplateScreenProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSelectFile = () => {
    // TODO: Integrate with document picker (react-native-document-picker)
    setUploading(true);
    setFileName('design_principles.pdf');
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  const handleCancel = () => {
    setUploading(false);
    setFileName(null);
    setUploadProgress(0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={STEPS} currentStep={3} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Add Template</Text>
        <TouchableOpacity
          style={styles.uploadZone}
          onPress={handleSelectFile}
          disabled={uploading}>
          <Text style={styles.uploadIcon}>↑</Text>
          <Text style={styles.uploadText}>Drag a file here to upload.</Text>
          <Text style={styles.uploadHint}>
            Alternatively, you can select file by{' '}
            <Text style={styles.uploadLink}>Clicking here</Text>
          </Text>
        </TouchableOpacity>
        {fileName && (
          <View style={styles.uploadProgress}>
            <Text style={styles.fileName}>📄 {fileName}</Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, {width: `${uploadProgress}%`}]}
              />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
            <View style={styles.progressActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                disabled={!uploading}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={handleSelectFile}
                disabled={uploading}>
                <Text style={styles.uploadBtnText}>Upload File</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={styles.buttons}>
          <AppButton title="Back" onPress={onBack} variant="outline" style={styles.backBtn} />
          <AppButton
            title="Save & Continue"
            onPress={onSaveAndContinue}
            style={styles.continueBtn}
          />
        </View>
      </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 24,
  },
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 8,
    padding: 48,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadIcon: {
    fontSize: 48,
    color: colors.gray,
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 14,
    color: colors.gray,
  },
  uploadLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  uploadProgress: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  fileName: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 12,
  },
  progressActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  uploadBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
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
