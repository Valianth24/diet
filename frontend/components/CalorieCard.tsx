import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

interface CalorieCardProps {
  current: number;
  goal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function CalorieCard({ current, goal, protein, carbs, fat }: CalorieCardProps) {
  const { t } = useTranslation();
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const remaining = Math.max(goal - current, 0);

  const radius = 70;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('dailyCalories')}</Text>

      <View style={styles.progressContainer}>
        <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
          {/* Background circle */}
          <Circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            stroke={Colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
          />
        </Svg>
        <View style={styles.progressText}>
          <Text style={styles.currentCalories}>{current}</Text>
          <Text style={styles.goalCalories}>/ {goal} {t('kcal')}</Text>
          <Text style={styles.remaining}>+{remaining}</Text>
        </View>
      </View>

      <View style={styles.macros}>
        <View style={styles.macroItem}>
          <Ionicons name="leaf" size={16} color={Colors.primary} />
          <Text style={styles.macroValue}>{protein}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Ionicons name="fast-food" size={16} color={Colors.orange} />
          <Text style={styles.macroValue}>{carbs}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Ionicons name="water" size={16} color={Colors.warning} />
          <Text style={styles.macroValue}>{fat}g</Text>
        </View>
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
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  progressText: {
    position: 'absolute',
    alignItems: 'center',
  },
  currentCalories: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  goalCalories: {
    fontSize: 14,
    color: Colors.lightText,
  },
  remaining: {
    fontSize: 16,
    color: Colors.primary,
    marginTop: 4,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroValue: {
    fontSize: 14,
    color: Colors.darkText,
    fontWeight: '600',
  },
});
