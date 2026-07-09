import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import {
  Certificate,
  generateCertificateSVG,
  getStreakAchievementText,
  downloadCertificateAsImage,
} from '../utils/certificateGenerator';
import { Spacing, FontSize, BorderRadius } from '../utils/theme';

interface CertificateModalProps {
  certificate: Certificate | null;
  visible: boolean;
  onClose: () => void;
}

export default function CertificateModal({
  certificate,
  visible,
  onClose,
}: CertificateModalProps) {
  const { colors } = useApp();
  const [downloading, setDownloading] = useState(false);

  if (!certificate) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const filename = `certificate_${certificate.habitName.replace(/\s+/g, '_')}_${certificate.streakLength}day`;
      await downloadCertificateAsImage(certificate, filename);
      Alert.alert('Downloaded!', 'Certificate saved to your downloads.');
    } catch (error) {
      Alert.alert(
        'Download Failed',
        'Unable to download certificate. Try saving the image manually.'
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    // In a real app, use Share API
    const shareText = `🏆 I just earned a ${certificate.streakLength}-day recovery certificate for "${certificate.habitName}" on Ascend! Join me on this journey of growth. #AscendApp`;

    if (navigator.share) {
      navigator.share({
        title: 'My Recovery Certificate',
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        Alert.alert('Copied!', 'Share text copied to clipboard.');
      });
    }
  };

  const svgDataUri = generateCertificateSVG(certificate);
  const achievementText = getStreakAchievementText(certificate.streakLength);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
        ]}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: colors.text },
              ]}
            >
              🎉 Certificate Earned!
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[{ color: colors.textSecondary }, { fontSize: 24 }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Achievement Text */}
          <Text
            style={[
              styles.achievementText,
              { color: colors.accent },
            ]}
          >
            {achievementText}
          </Text>

          {/* Certificate Image */}
          <View style={[styles.certificateFrame, { borderColor: colors.border }]}>
            <Image
              source={{ uri: svgDataUri }}
              style={styles.certificateImage}
              resizeMode="contain"
            />
          </View>

          {/* Certification Details */}
          <View style={[styles.details, { backgroundColor: colors.background }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Habit
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {certificate.habitName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Streak Length
              </Text>
              <Text style={[styles.detailValue, { color: colors.accent }]}>
                {certificate.streakLength} days
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Awarded
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Date(certificate.awardedDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={handleShare}
              style={[
                styles.button,
                styles.shareButton,
                { borderColor: colors.accent },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: colors.accent },
                ]}
              >
                📤 Share
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDownload}
              disabled={downloading}
              style={[
                styles.button,
                styles.downloadButton,
                { backgroundColor: colors.accent },
              ]}
            >
              {downloading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFF' }]}>
                  💾 Download
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButtonLarge, { borderColor: colors.border }]}
          >
            <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>
              Got it!
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 500,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  closeButton: {
    padding: Spacing.sm,
  },
  achievementText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  certificateFrame: {
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  certificateImage: {
    width: '100%',
    height: '100%',
  },
  details: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  button: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    borderWidth: 1.5,
  },
  downloadButton: {
    flex: 1.2,
  },
  buttonText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  closeButtonLarge: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
