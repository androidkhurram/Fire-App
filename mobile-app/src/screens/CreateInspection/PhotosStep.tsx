import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {StepProgress, type Step} from '../../components/StepProgress';
import {AppButton} from '../../components/AppButton';
import {colors} from '../../theme/colors';
import {handleAsyncError} from '../../utils/errorHandler';

export interface PhotoItem {
  uri: string;
  type?: string;
  name?: string;
}

interface PhotosStepProps {
  initialData?: PhotoItem[];
  onBack: () => void;
  onSaveAndContinue: (photos: PhotoItem[]) => void;
  steps?: Step[];
  currentStep?: number;
  onStepSelect?: (index: number) => void;
}

export function PhotosStep({
  initialData = [],
  onBack,
  onSaveAndContinue,
  steps = [],
  currentStep = 0,
  onStepSelect,
}: PhotosStepProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initialData);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      saveToPhotos: false,
    };
    try {
      const result = fromCamera
        ? await launchCamera(options)
        : await launchImageLibrary(options);
      if (result.didCancel) return;
      const asset = result.assets?.[0];
      const assetUri = asset?.uri;
      if (!assetUri) return;
      setPhotos(prev => [
        ...prev,
        {
          uri: assetUri,
          type: asset.type ?? 'image/jpeg',
          name: asset.fileName ?? 'photo.jpg',
        },
      ]);
    } catch (e) {
      handleAsyncError(e, 'Photo Error', 'Could not open camera or gallery.');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={steps} currentStep={currentStep} onStepPress={onStepSelect} />
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.title}>Photos</Text>
        <Text style={styles.subtitle}>
          Capture photos during the inspection to document the system condition
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => pickImage(true)}
            disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <>
                <Text style={styles.actionIcon}>📷</Text>
                <Text style={styles.actionText}>Take Photo</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => pickImage(false)}
            disabled={uploading}>
            <Text style={styles.actionIcon}>🖼️</Text>
            <Text style={styles.actionText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
        {photos.length > 0 ? (
          <ScrollView
            horizontal
            style={styles.photoList}
            contentContainerStyle={styles.photoListContent}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image
                  source={{uri: photo.uri}}
                  style={styles.photo}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removePhoto(index)}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No photos added yet</Text>
            <Text style={styles.emptyHint}>
              Tap "Take Photo" or "Choose from Gallery" to add inspection photos
            </Text>
          </View>
        )}
        <View style={styles.buttons}>
          <AppButton title="Back" onPress={onBack} variant="outline" style={styles.backBtn} />
          <AppButton
            title="Save & Continue"
            onPress={() => onSaveAndContinue(photos)}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.accentLight,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  photoList: {
    flexGrow: 0,
    marginBottom: 24,
  },
  photoListContent: {
    gap: 12,
    paddingVertical: 8,
  },
  photoItem: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: colors.white,
    fontSize: 14,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
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
