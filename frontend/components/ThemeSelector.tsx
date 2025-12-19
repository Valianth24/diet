import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { themes, themeMetadata, ThemeName } from '../constants/Themes';
import VideoRewardModal from './VideoRewardModal';

export default function ThemeSelector() {
  const { currentTheme, setTheme, watchedAds, unlockedThemes, isThemeAvailable } = useTheme();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedLockedTheme, setSelectedLockedTheme] = useState<ThemeName | null>(null);

  const handleThemePress = async (themeName: ThemeName) => {
    const available = isThemeAvailable(themeName);
    
    if (available) {
      try {
        await setTheme(themeName);
        // Güzel bir feedback
        if (themeName === 'pinkStar') {
          alert('✨💕 Pembe Yıldız teması aktif! Çok şirin görünüyor! 💕✨');
        } else if (themeName === 'default') {
          alert('🎨 Varsayılan tema aktif!');
        } else {
          alert(`🎨 ${themeMetadata[themeName].name} teması aktif!`);
        }
      } catch (error) {
        console.error('Theme change error:', error);
        alert('Tema değiştirilemedi. Lütfen tekrar deneyin.');
      }
    } else {
      setSelectedLockedTheme(themeName);
      setShowVideoModal(true);
    }
  };

  const getThemePreview = (themeName: ThemeName) => {
    const theme = themes[themeName];
    return (
      <View style={styles.previewContainer}>
        <View style={[styles.previewDot, { backgroundColor: theme.primary }]} />
        <View style={[styles.previewDot, { backgroundColor: theme.secondary }]} />
        <View style={[styles.previewDot, { backgroundColor: theme.background }]} />
      </View>
    );
  };

  const renderThemeCard = (themeName: ThemeName) => {
    const metadata = themeMetadata[themeName];
    const isUnlocked = isThemeAvailable(themeName);
    const isActive = currentTheme === themeName;
    const theme = themes[themeName];
    const videosNeeded = metadata.requiredVideos - watchedAds;

    if (themeName === 'pinkStar' && isUnlocked) {
      // Pembe tema için özel kart
      return (
        <TouchableOpacity
          key={themeName}
          style={[styles.themeCard, isActive && styles.themeCardActive]}
          onPress={() => handleThemePress(themeName)}
        >
          <LinearGradient
            colors={['#FF1493', '#FFB6C1', '#FFC0CB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pinkGradient}
          >
            <View style={styles.starDecoration}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Ionicons name="star" size={16} color="#FFD700" style={{ marginLeft: -8 }} />
              <Ionicons name="star" size={12} color="#FFD700" style={{ marginLeft: -6 }} />
            </View>
            
            <Ionicons name={metadata.icon as any} size={48} color="#FFFFFF" />
            
            <View style={styles.sparkles}>
              <Text style={styles.sparkle}>✨</Text>
              <Text style={styles.sparkle}>💕</Text>
              <Text style={styles.sparkle}>⭐</Text>
            </View>

            <Text style={styles.pinkThemeName}>{metadata.name}</Text>
            <Text style={styles.pinkThemeDesc}>{metadata.description}</Text>

            {isActive && (
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                <Text style={styles.activeBadgeText}>Aktif</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={themeName}
        style={[
          styles.themeCard,
          isActive && styles.themeCardActive,
          !isUnlocked && styles.themeCardLocked,
        ]}
        onPress={() => handleThemePress(themeName)}
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name={metadata.icon as any} size={32} color={theme.primary} />
        </View>

        {!isUnlocked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={24} color="#666" />
          </View>
        )}

        <Text style={styles.themeName}>{metadata.name}</Text>
        <Text style={styles.themeDesc}>{metadata.description}</Text>

        {getThemePreview(themeName)}

        {!isUnlocked && (
          <View style={styles.lockInfo}>
            <Text style={styles.lockText}>
              {videosNeeded > 0 ? `${videosNeeded} video daha` : 'Video izle'}
            </Text>
          </View>
        )}

        {isActive && (
          <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="color-palette" size={24} color="#7C3AED" />
        <Text style={styles.headerTitle}>Temalar</Text>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Ionicons name="trophy" size={20} color="#F59E0B" />
          <Text style={styles.progressTitle}>İzlenen Reklamlar</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(watchedAds / 9) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{watchedAds} / 9 reklam</Text>
        <Text style={styles.progressSubtext}>Her 3 reklamda yeni tema aç! 🎉</Text>
      </View>

      <View style={styles.themesGrid}>
        {(Object.keys(themeMetadata) as ThemeName[]).map(renderThemeCard)}
      </View>

      {showVideoModal && selectedLockedTheme && (
        <VideoRewardModal
          visible={showVideoModal}
          onClose={() => {
            setShowVideoModal(false);
            setSelectedLockedTheme(null);
          }}
          targetTheme={selectedLockedTheme}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  progressSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  themeCardActive: {
    borderWidth: 3,
    borderColor: '#7C3AED',
  },
  themeCardLocked: {
    opacity: 0.6,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  themeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  themeDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  previewContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  previewDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  lockInfo: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lockText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Pembe tema özel stiller
  pinkGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  starDecoration: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkles: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  sparkle: {
    fontSize: 16,
  },
  pinkThemeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pinkThemeDesc: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
