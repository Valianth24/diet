import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

interface StepCardProps {
  current: number;
  goal: number;
}

export default function StepCard({ current, goal }: StepCardProps) {
  const { t } = useTranslation();
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('stepCounter')}</Text>

      <View style={styles.content}>
        <Ionicons name="footsteps" size={40} color={Colors.primary} />
        <Text style={styles.steps}>
          {current.toLocaleString()} / {goal.toLocaleString()} {t('steps')}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>

      <View style={styles.source}>
        <Ionicons name="logo-google" size={16} color={Colors.primary} />
        <Text style={styles.sourceText}>Google Fit</Text>
      </View>
    </View>
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
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  steps: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
    flex: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: 12,
    color: Colors.lightText,
  },
});
