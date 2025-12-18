import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { themeMetadata, ThemeName } from '../constants/Themes';

interface VideoRewardModalProps {
  visible: boolean;
  onClose: () => void;
  targetTheme: ThemeName;
}

export default function VideoRewardModal({ visible, onClose, targetTheme }: VideoRewardModalProps) {
  const { incrementWatchedVideos, watchedVideos, unlockedThemes } = useTheme();
  const [isWatching, setIsWatching] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<ThemeName | null>(null);
  
  const scaleAnim = new Animated.Value(0);
  const rotateAnim = new Animated.Value(0);

  const metadata = themeMetadata[targetTheme];
  const videosNeeded = metadata.requiredVideos - watchedVideos;

  const startVideo = () => {
    setIsWatching(true);
    setWatchProgress(0);

    // Mock video progress (5 saniye)
    const interval = setInterval(() => {
      setWatchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          completeVideo();
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const completeVideo = async () => {
    await incrementWatchedVideos();
    
    // Check if theme is now unlocked
    const newWatched = watchedVideos + 1;
    let unlocked: ThemeName | null = null;
    
    if (newWatched >= 3 && !unlockedThemes.includes('pinkStar')) {
      unlocked = 'pinkStar';
    } else if (newWatched >= 6 && !unlockedThemes.includes('ocean')) {
      unlocked = 'ocean';
    } else if (newWatched >= 9 && !unlockedThemes.includes('sunset')) {
      unlocked = 'sunset';
    }

    if (unlocked) {
      setNewlyUnlocked(unlocked);
      setShowReward(true);
      animateReward();
    } else {
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const animateReward = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ),
    ]).start();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (showReward && newlyUnlocked) {
    const isPinkTheme = newlyUnlocked === 'pinkStar';
    
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.rewardOverlay}>
          {isPinkTheme ? (
            <LinearGradient
              colors={['#FF1493', '#FFB6C1', '#FFC0CB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rewardContainer}
            >
              <View style={styles.sparkleContainer}>
                <Text style={styles.bigSparkle}>✨</Text>
                <Text style={styles.bigSparkle}>💕</Text>
                <Text style={styles.bigSparkle}>⭐</Text>
              </View>
              
              <Animated.View style={[styles.rewardIcon, { transform: [{ scale: scaleAnim }, { rotate: spin }] }]}>
                <Ionicons name="star" size={80} color="#FFD700" />
              </Animated.View>

              <Text style={styles.pinkRewardTitle}>Tebrikler! 🎉</Text>
              <Text style={styles.pinkRewardMessage}>
                {themeMetadata[newlyUnlocked].name} Teması Açıldı!
              </Text>
              <Text style={styles.pinkRewardSubtext}>
                Çok şirin görünüyor! Hemen kullanmak ister misin? 💕
              </Text>

              <TouchableOpacity style={styles.pinkClaimButton} onPress={onClose}>
                <Text style={styles.pinkClaimText}>Harika! 🌟</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <View style={styles.rewardContainer}>
              <Animated.View style={[styles.rewardIcon, { transform: [{ scale: scaleAnim }] }]}>
                <Ionicons name={themeMetadata[newlyUnlocked].icon as any} size={80} color="#7C3AED" />
              </Animated.View>

              <Text style={styles.rewardTitle}>Tebrikler! 🎉</Text>
              <Text style={styles.rewardMessage}>
                {themeMetadata[newlyUnlocked].name} Teması Açıldı!
              </Text>

              <TouchableOpacity style={styles.claimButton} onPress={onClose}>
                <Text style={styles.claimText}>Harika!</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Video İzle & Ödül Kazan</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name={metadata.icon as any} size={48} color="#7C3AED" />
            <Text style={styles.infoTitle}>{metadata.name}</Text>
            <Text style={styles.infoDesc}>{metadata.description}</Text>
            
            <View style={styles.requirementCard}>
              <Ionicons name="videocam" size={24} color="#F59E0B" />
              <Text style={styles.requirementText}>
                {videosNeeded > 1 ? `${videosNeeded} video daha izle` : 'Son 1 video!'}
              </Text>
            </View>
          </View>

          {!isWatching ? (
            <TouchableOpacity style={styles.watchButton} onPress={startVideo}>
              <Ionicons name="play-circle" size={32} color="#FFFFFF" />
              <Text style={styles.watchButtonText}>Video İzle</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.videoContainer}>
              <View style={styles.mockVideo}>
                <Ionicons name="videocam" size={64} color="#FFFFFF" />
                <Text style={styles.mockVideoText}>Reklam oynatılıyor...</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${watchProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(watchProgress)}%</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  infoCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  infoDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  requirementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  requirementText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  watchButton: {
    flexDirection: 'row',
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  watchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  videoContainer: {
    alignItems: 'center',
  },
  mockVideo: {
    width: '100%',
    height: 200,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mockVideoText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  // Reward styles
  rewardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rewardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 20,
    flexDirection: 'row',
    gap: 16,
  },
  bigSparkle: {
    fontSize: 32,
  },
  rewardIcon: {
    marginBottom: 24,
  },
  rewardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  rewardMessage: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  claimButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  claimText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Pink theme reward
  pinkRewardTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pinkRewardMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  pinkRewardSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  pinkClaimButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pinkClaimText: {
    color: '#FF1493',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
