import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFoodDatabase } from '../../utils/api';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../utils/i18n';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

type FoodItem = {
  food_id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type RecentScan = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: number;
  imagePreview?: string;
};

export default function MealsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'main' | 'search' | 'recent'>('main');
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFoodDatabase();
    loadRecentScans();
  }, []);

  const loadFoodDatabase = async () => {
    try {
      const lang = i18n.language;
      const foods = await getFoodDatabase(lang);
      setFoodDatabase(foods || []);
    } catch (error) {
      console.error('Error loading food database:', error);
    }
  };

  const loadRecentScans = async () => {
    try {
      const stored = await AsyncStorage.getItem('recent_food_scans');
      if (stored) {
        setRecentScans(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent scans:', error);
    }
  };

  const addToRecentScans = async (scan: RecentScan) => {
    try {
      const updated = [scan, ...recentScans.filter(s => s.id !== scan.id)].slice(0, 20);
      setRecentScans(updated);
      await AsyncStorage.setItem('recent_food_scans', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent scan:', error);
    }
  };

  const addMealFromRecent = async (scan: RecentScan) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('session_token');
      
      const response = await fetch(`${API_BASE_URL}/api/food/add-meal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: scan.name,
          calories: scan.calories,
          protein: scan.protein,
          carbs: scan.carbs,
          fat: scan.fat,
          image_base64: scan.imagePreview || '',
          meal_type: 'snack',
        }),
      });

      if (!response.ok) {
        throw new Error('Kaydetme başarısız');
      }

      Alert.alert('Başarılı', `${scan.name} eklendi!`);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error adding meal:', error);
      Alert.alert('Hata', 'Yemek eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = foodDatabase.filter((food: FoodItem) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ana ekran - Seçenekler
  const renderMainOptions = () => (
    <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerIcon}>
          <Ionicons name="add-circle" size={48} color={Colors.primary} />
        </View>
        <Text style={styles.headerTitle}>Kalori Ekle</Text>
        <Text style={styles.headerSubtitle}>Yediğiniz yemeği kaydedin ve kalori takibi yapın</Text>
      </View>

      {/* Seçenekler */}
      <View style={styles.optionCards}>
        {/* Fotoğraf ile Hesapla */}
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => router.push('/(tabs)/camera')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.optionGradient}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="camera" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.optionTitle}>Fotoğrafla Hesapla</Text>
            <Text style={styles.optionDescription}>
              Yemeğinizin fotoğrafını çekin, AI kalorileri hesaplasın
            </Text>
            <View style={styles.optionBadge}>
              <Ionicons name="sparkles" size={14} color="#FFD700" />
              <Text style={styles.optionBadgeText}>AI Destekli</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Daha Önce Hesaplananlar */}
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => setActiveTab('recent')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#11998e', '#38ef7d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.optionGradient}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="time" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.optionTitle}>Son Hesaplananlar</Text>
            <Text style={styles.optionDescription}>
              Daha önce hesapladığınız yemeklerden seçin
            </Text>
            <View style={styles.optionBadge}>
              <Ionicons name="flash" size={14} color="#FFFFFF" />
              <Text style={styles.optionBadgeText}>{recentScans.length} Kayıt</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Manuel Seçim */}
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => setActiveTab('search')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.optionGradient}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="search" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.optionTitle}>Listeden Seç</Text>
            <Text style={styles.optionDescription}>
              Yemek veritabanından arama yapın
            </Text>
            <View style={styles.optionBadge}>
              <Ionicons name="restaurant" size={14} color="#FFFFFF" />
              <Text style={styles.optionBadgeText}>500+ Yemek</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Hızlı Ekle Butonları */}
      <View style={styles.quickAddSection}>
        <Text style={styles.quickAddTitle}>Hızlı Ekle</Text>
        <View style={styles.quickAddButtons}>
          {[
            { icon: 'water', label: 'Su', color: Colors.teal, cal: 0 },
            { icon: 'cafe', label: 'Kahve', color: '#8B4513', cal: 5 },
            { icon: 'nutrition', label: 'Elma', color: '#FF6B6B', cal: 52 },
            { icon: 'pizza', label: 'Atıştırma', color: '#FFA500', cal: 150 },
          ].map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.quickAddButton}
              onPress={() => {
                Alert.alert(
                  item.label,
                  `${item.cal} kcal eklensin mi?`,
                  [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Ekle', onPress: () => addMealFromRecent({
                      id: `quick_${Date.now()}`,
                      name: item.label,
                      calories: item.cal,
                      protein: 0,
                      carbs: 0,
                      fat: 0,
                      timestamp: Date.now(),
                    })}
                  ]
                );
              }}
            >
              <View style={[styles.quickAddIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={styles.quickAddLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // Son Hesaplananlar
  const renderRecentScans = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.backArrow} onPress={() => setActiveTab('main')}>
        <Ionicons name="arrow-back" size={24} color={Colors.darkText} />
        <Text style={styles.backText}>Geri</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Son Hesaplanan Yemekler</Text>

      {recentScans.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={Colors.lightText} />
          <Text style={styles.emptyText}>Henüz hesaplama yapılmadı</Text>
          <Text style={styles.emptySubtext}>Fotoğrafla kalori hesapladığınızda burada görünecek</Text>
        </View>
      ) : (
        <FlatList
          data={recentScans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.recentCard}
              onPress={() => addMealFromRecent(item)}
              disabled={loading}
            >
              <View style={styles.recentIcon}>
                <Ionicons name="restaurant" size={24} color={Colors.primary} />
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.recentMacros}>
                  <Text style={styles.recentCalories}>{item.calories} kcal</Text>
                  <Text style={styles.recentMacroText}>
                    P:{item.protein}g K:{item.carbs}g Y:{item.fat}g
                  </Text>
                </View>
                <Text style={styles.recentTime}>
                  {new Date(item.timestamp).toLocaleDateString('tr-TR')}
                </Text>
              </View>
              <View style={styles.addIconContainer}>
                <Ionicons name="add-circle" size={28} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  // Listeden Seçim
  const renderSearchTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.backArrow} onPress={() => {
        setActiveTab('main');
        setSearchQuery('');
      }}>
        <Ionicons name="arrow-back" size={24} color={Colors.darkText} />
        <Text style={styles.backText}>Geri</Text>
      </TouchableOpacity>
      
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.lightText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Yemek ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.lightText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Food List */}
      <FlatList
        data={filteredFoods}
        keyExtractor={(item: FoodItem) => item.food_id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.lightText} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Sonuç bulunamadı' : 'Aramak için yazın'}
            </Text>
          </View>
        }
        renderItem={({ item }: { item: FoodItem }) => (
          <TouchableOpacity
            style={styles.foodCard}
            onPress={() => router.push({
              pathname: '/details/meal-detail',
              params: {
                food_id: item.food_id,
                name: item.name,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
              },
            })}
            activeOpacity={0.7}
          >
            <View style={styles.foodIcon}>
              <Ionicons name="restaurant" size={24} color={Colors.primary} />
            </View>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.macroRow}>
                <Text style={styles.calorieText}>{item.calories} kcal</Text>
                <Text style={styles.macroText}>P:{item.protein}g K:{item.carbs}g Y:{item.fat}g</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.lightText} />
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {activeTab === 'recent' ? 'Son Hesaplananlar' : 
           activeTab === 'search' ? 'Yemek Ara' : 'Kalori Ekle'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Content */}
      {activeTab === 'main' && renderMainOptions()}
      {activeTab === 'recent' && renderRecentScans()}
      {activeTab === 'search' && renderSearchTab()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: 'center',
  },
  optionCards: {
    gap: 16,
    marginBottom: 24,
  },
  optionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  optionGradient: {
    padding: 20,
    minHeight: 130,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  optionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  optionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickAddSection: {
    marginBottom: 32,
  },
  quickAddTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 16,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAddButton: {
    alignItems: 'center',
    width: (screenWidth - 64) / 4,
  },
  quickAddIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickAddLabel: {
    fontSize: 12,
    color: Colors.darkText,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  backArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: Colors.darkText,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.lightText,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.lightText,
    marginTop: 4,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  recentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 4,
  },
  recentMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  recentMacroText: {
    fontSize: 12,
    color: Colors.lightText,
  },
  recentTime: {
    fontSize: 11,
    color: Colors.lightText,
    marginTop: 4,
  },
  addIconContainer: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  foodCard: {
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
  foodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 4,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calorieText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  macroText: {
    fontSize: 11,
    color: Colors.lightText,
  },
});
