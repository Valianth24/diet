import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { getDailySummary, getTodayWater, getTodaySteps, getTodayMeals } from '../../utils/api';
import CalorieCard from '../../components/CalorieCard';
import WaterCard from '../../components/WaterCard';
import StepCard from '../../components/StepCard';
import VitaminCard from '../../components/VitaminCard';
import FoodPhotoCard from '../../components/FoodPhotoCard';
import { Colors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user, dailySummary, waterData, stepData, setDailySummary, setWaterData, setStepData, refreshData } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [recentMeals, setRecentMeals] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [summary, water, steps, meals] = await Promise.all([
        getDailySummary(),
        getTodayWater(),
        getTodaySteps(),
        getTodayMeals(),
      ]);
      setDailySummary(summary);
      setWaterData(water);
      setStepData(steps);
      setRecentMeals(meals.slice(0, 3)); // Son 3 yemek
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={24} color={Colors.white} />
              </View>
            )}
            <View>
              <Text style={styles.greeting}>
                {t('hello')} {user?.name?.split(' ')[0]} 👋
              </Text>
              <Text style={styles.question}>{t('howAreYouToday')}</Text>
            </View>
          </View>
          <Ionicons name="notifications-outline" size={28} color={Colors.darkText} />
        </View>

        {/* Summary Bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Ionicons name="flame" size={20} color={Colors.primary} />
            <Text style={styles.summaryValue}>{dailySummary?.total_calories || 0} {t('kcal')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="water" size={20} color={Colors.teal} />
            <Text style={styles.summaryValue}>{((waterData?.total_amount || 0) / 1000).toFixed(1)} L</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="footsteps" size={20} color={Colors.primary} />
            <Text style={styles.summaryValue}>{(stepData?.steps || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* Recent Meals */}
        {recentMeals.length > 0 && (
          <View style={styles.recentMealsSection}>
            <Text style={styles.sectionTitle}>Son Yemekler</Text>
            {recentMeals.map((meal) => (
              <View key={meal.meal_id} style={styles.mealCard}>
                <Image source={{ uri: meal.image_base64 }} style={styles.mealImage} />
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                  <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              </View>
            ))}
          </View>
        )}

        {/* Cards Grid */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <View style={styles.gridItemHalf}>
              <CalorieCard
                current={dailySummary?.total_calories || 0}
                goal={user?.daily_calorie_goal || 2000}
                protein={dailySummary?.total_protein || 0}
                carbs={dailySummary?.total_carbs || 0}
                fat={dailySummary?.total_fat || 0}
              />
            </View>
            <View style={styles.gridItemHalf}>
              <WaterCard
                current={waterData?.total_amount || 0}
                goal={user?.water_goal || 2500}
              />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridItemHalf}>
              <StepCard
                current={stepData?.steps || 0}
                goal={user?.step_goal || 10000}
              />
            </View>
            <View style={styles.gridItemHalf}>
              <VitaminCard />
            </View>
          </View>

          <View style={styles.gridItemFull}>
            <FoodPhotoCard />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  question: {
    fontSize: 14,
    color: Colors.lightText,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    justifyContent: 'space-around',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
  },
  recentMealsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 12,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mealImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
  },
  mealCalories: {
    fontSize: 12,
    color: Colors.lightText,
    marginTop: 2,
  },
  grid: {
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  gridItemHalf: {
    flex: 1,
  },
  gridItemFull: {
    width: '100%',
  },
});
