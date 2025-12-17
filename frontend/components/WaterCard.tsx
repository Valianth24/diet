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

  const glassCount = Math.floor(current / 250);
  const totalGlasses = Math.ceil(goal / 250);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push('/details/water-detail')}
      activeOpacity={0.9}
    >
      <Text style={styles.title}>{t('waterTracking')}</Text>

      <View style={styles.glassContainer}>
        {[...Array(Math.min(4, totalGlasses))].map((_, index) => (
          <Ionicons
            key={index}
            name="water"
            size={40}
            color={index < glassCount ? Colors.teal : '#E0E0E0'}
          />
        ))}
      </View>

      <Text style={styles.amount}>
        {glassCount} / {totalGlasses} Bardak
      </Text>
      <Text style={styles.amountMl}>
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
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    minHeight: 220,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  glassContainer: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 16,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 4,
  },
  amountMl: {
    fontSize: 14,
    color: Colors.lightText,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
