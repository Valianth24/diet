import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Image, Modal, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { getDailySummary, getTodayWater, getTodaySteps, getTodayMeals, getFoodDatabase, addMeal } from '../../utils/api';
import CalorieCard from '../../components/CalorieCard';
import WaterCard from '../../components/WaterCard';
import StepCard from '../../components/StepCard';
import VitaminCard from '../../components/VitaminCard';
import FoodPhotoCard from '../../components/FoodPhotoCard';
import { Colors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import i18n from '../../utils/i18n';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, dailySummary, waterData, stepData, setDailySummary, setWaterData, setStepData, refreshData, triggerRefresh } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [recentMeals, setRecentMeals] = useState<any[]>([]);
  
  // Fast Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [foodDatabase, setFoodDatabase] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<any>(null);

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
      setRecentMeals(meals.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadFoodDatabase = async () => {
    try {
      const lang = i18n.language;
      const foods = await getFoodDatabase(lang);
      setFoodDatabase(foods);
    } catch (error) {
      console.error('Error loading food database:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshData]);

  useEffect(() => {
    if (showAddModal) {
      loadFoodDatabase();
    }
  }, [showAddModal]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleQuickAdd = async () => {
    if (!selectedFood) return;

    try {
      await addMeal({
        name: selectedFood.name,
        calories: selectedFood.calories,
        protein: selectedFood.protein,
        carbs: selectedFood.carbs,
        fat: selectedFood.fat,
        image_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        meal_type: selectedMealType,
      });
      triggerRefresh();
      setShowAddModal(false);
      setSelectedFood(null);
      setSearchQuery('');
      alert('Yemek eklendi!');
    } catch (error) {
      console.error('Error adding meal:', error);
      alert('Hata: Yemek eklenemedi.');
    }
  };

  const filteredFoods = foodDatabase.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Fast Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hızlı Ekle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            {/* Meal Type Selection */}
            <Text style={styles.sectionLabel}>Öğün Seç</Text>
            <View style={styles.mealTypeRow}>
              {[
                { key: 'breakfast', icon: 'sunny', label: 'Kahvaltı' },
                { key: 'lunch', icon: 'restaurant', label: 'Öğle' },
                { key: 'dinner', icon: 'moon', label: 'Akşam' },
                { key: 'snack', icon: 'cafe', label: 'Ara Öğün' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.mealTypeCard,
                    selectedMealType === type.key && styles.mealTypeCardActive,
                  ]}
                  onPress={() => setSelectedMealType(type.key)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={28}
                    color={selectedMealType === type.key ? Colors.white : Colors.primary}
                  />
                  <Text
                    style={[
                      styles.mealTypeLabel,
                      selectedMealType === type.key && styles.mealTypeLabelActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search */}
            <TextInput
              style={styles.searchInput}
              placeholder="Yemek ara..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Food List */}
            <FlatList
              data={filteredFoods}
              keyExtractor={(item) => item.food_id}
              style={styles.foodList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.foodItem}
                  onPress={() => {
                    setShowAddModal(false);
                    router.push({
                      pathname: '/details/meal-detail',
                      params: {
                        food_id: item.food_id,
                        name: item.name,
                        calories: item.calories,
                        protein: item.protein,
                        carbs: item.carbs,
                        fat: item.fat,
                      },
                    });
                  }}
                >
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{item.name}</Text>
                    <Text style={styles.foodMacros}>
                      {item.calories} kcal • P: {item.protein}g • K: {item.carbs}g • Y: {item.fat}g
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.lightText} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 12,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  mealTypeCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealTypeCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  mealTypeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.darkText,
    marginTop: 4,
  },
  mealTypeLabelActive: {
    color: Colors.white,
  },
  searchInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  foodList: {
    maxHeight: 300,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  foodItemSelected: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 4,
  },
  foodMacros: {
    fontSize: 12,
    color: Colors.lightText,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
