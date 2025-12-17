import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { addWater } from '../utils/api';
import { useStore } from '../store/useStore';
import { useRouter } from 'expo-router';

interface WaterCardProps {
  current: number;
  goal: number;
}

export default function WaterCard({ current, goal }: WaterCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { triggerRefresh } = useStore();
  const [loading, setLoading] = React.useState(false);

  const handleAddWater = async () => {
    try {
      setLoading(true);
      await addWater(250);
      triggerRefresh();
    } catch (error) {
      console.error('Error adding water:', error);
    } finally {
      setLoading(false);
    }
  };

  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push('/(tabs)/water-detail')}
      activeOpacity={0.9}
    >
      <Text style={styles.title}>{t('waterTracking')}</Text>

      <View style={styles.bottleContainer}>
        <View style={[styles.waterFill, { height: `${percentage}%` }]} />
        <Ionicons name="water" size={80} color={Colors.teal} style={styles.waterIcon} />
      </View>

      <Text style={styles.amount}>
        {(current / 1000).toFixed(1)} / {(goal / 1000).toFixed(1)} L
      </Text>

      <TouchableOpacity
        style={[styles.addButton, loading && styles.addButtonDisabled]}
        onPress={(e) => {
          e.stopPropagation();
          handleAddWater();
        }}
        disabled={loading}
      >
        <Text style={styles.addButtonText}>{t('addWater')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  bottleContainer: {
    position: 'relative',
    width: 80,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderRadius: 40,
  },
  waterFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.teal,
    opacity: 0.3,
  },
  waterIcon: {
    zIndex: 10,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
