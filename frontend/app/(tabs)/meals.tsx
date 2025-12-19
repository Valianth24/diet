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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFoodDatabase } from '../../utils/api';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import i18n from '../../utils/i18n';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');

export default function MealsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [foodDatabase, setFoodDatabase] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'add' | 'photo' | 'text'>('add');

  useEffect(() => {
    loadFoodDatabase();
  }, []);

  const loadFoodDatabase = async () => {
    try {
      const lang = i18n.language;
      const foods = await getFoodDatabase(lang);
      setFoodDatabase(foods);
    } catch (error) {
      console.error('Error loading food database:', error);
    }
  };

  const filteredFoods = foodDatabase.filter(food =>
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
          onPress={() => setActiveTab('photo')}
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

        {/* Metin ile Hesapla */}
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => setActiveTab('text')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#11998e', '#38ef7d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.optionGradient}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="chatbubble-ellipses" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.optionTitle}>Metin ile Hesapla</Text>
            <Text style={styles.optionDescription}>
              Yediğinizi yazın, AI besin değerlerini hesaplasın
            </Text>
            <View style={styles.optionBadge}>
              <Ionicons name="sparkles" size={14} color="#FFD700" />
              <Text style={styles.optionBadgeText}>AI Destekli</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Manuel Seçim */}
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => setActiveTab('add')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.optionGradient}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="list" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.optionTitle}>Listeden Seç</Text>
            <Text style={styles.optionDescription}>
              Yemek veritabanından seçim yapın
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
            { icon: 'water', label: 'Su', color: Colors.teal },
            { icon: 'cafe', label: 'Kahve', color: '#8B4513' },
            { icon: 'nutrition', label: 'Meyve', color: '#FF6B6B' },
            { icon: 'pizza', label: 'Atıştırma', color: '#FFA500' },
          ].map((item, index) => (
            <TouchableOpacity key={index} style={styles.quickAddButton}>
              <View style={[styles.quickAddIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={styles.quickAddLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // Fotoğraf ile Hesaplama UI
  const renderPhotoTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.backArrow} onPress={() => setActiveTab('add')}>
        <Ionicons name="arrow-back" size={24} color={Colors.darkText} />
      </TouchableOpacity>
      
      <View style={styles.photoContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.photoPlaceholder}
        >
          <Ionicons name="camera" size={64} color="#FFFFFF" />
          <Text style={styles.photoPlaceholderText}>Yemek Fotoğrafı Çek</Text>
          <Text style={styles.photoPlaceholderSubtext}>AI kalorileri otomatik hesaplayacak</Text>
        </LinearGradient>

        <View style={styles.photoActions}>
          <TouchableOpacity 
            style={styles.photoButton}
            onPress={() => router.push('/(tabs)/camera')}
          >
            <Ionicons name="camera" size={28} color={Colors.white} />
            <Text style={styles.photoButtonText}>Fotoğraf Çek</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.photoButtonOutline}>
            <Ionicons name="images" size={28} color={Colors.primary} />
            <Text style={styles.photoButtonOutlineText}>Galeriden Seç</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.photoTips}>
          <Text style={styles.photoTipsTitle}>İpuçları</Text>
          <View style={styles.photoTipItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.photoTipText}>Yemeği net bir şekilde çekin</Text>
          </View>
          <View style={styles.photoTipItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.photoTipText}>İyi aydınlatma kullanın</Text>
          </View>
          <View style={styles.photoTipItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.photoTipText}>Porsiyon boyutunu gösterin</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Metin ile Hesaplama UI
  const renderTextTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.backArrow} onPress={() => setActiveTab('add')}>
        <Ionicons name="arrow-back" size={24} color={Colors.darkText} />
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <LinearGradient
          colors={['#11998e', '#38ef7d']}
          style={styles.textHeader}
        >
          <Ionicons name="chatbubble-ellipses" size={48} color="#FFFFFF" />
          <Text style={styles.textHeaderTitle}>AI ile Kalori Hesapla</Text>
          <Text style={styles.textHeaderSubtitle}>Yediğinizi yazın, besin değerlerini öğrenin</Text>
        </LinearGradient>

        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInputMulti}
            placeholder="Örn: 1 porsiyon tavuklu makarna, yanında salata ve 1 bardak ayran içtim..."
            placeholderTextColor={Colors.lightText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <TouchableOpacity style={styles.textSubmitButton}>
            <LinearGradient
              colors={['#11998e', '#38ef7d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.textSubmitGradient}
            >
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
              <Text style={styles.textSubmitText}>Hesapla</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.textExamples}>
          <Text style={styles.textExamplesTitle}>Örnek Girişler</Text>
          {[
            '2 dilim ekmek arası peynir',
            '1 kase mercimek çorbası',
            'Izgara tavuk ve pilav',
          ].map((example, index) => (
            <TouchableOpacity key={index} style={styles.textExampleChip}>
              <Text style={styles.textExampleText}>{example}</Text>
              <Ionicons name="add-circle" size={18} color={Colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // Listeden Seçim UI
  const renderAddTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.backArrow} onPress={() => setActiveTab('add')}>
        <Ionicons name="arrow-back" size={24} color={Colors.darkText} />
      </TouchableOpacity>
      
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.lightText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Yemek ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Food List */}
      <FlatList
        data={filteredFoods}
        keyExtractor={(item) => item.food_id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
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
          {activeTab === 'photo' ? 'Fotoğrafla Hesapla' : 
           activeTab === 'text' ? 'Metin ile Hesapla' : 
           activeTab === 'add' && searchQuery ? 'Yemek Seç' : 'Kalori Ekle'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      {activeTab === 'add' && !searchQuery ? renderMainOptions() : null}
      {activeTab === 'photo' ? renderPhotoTab() : null}
      {activeTab === 'text' ? renderTextTab() : null}
      {activeTab === 'add' && searchQuery ? renderAddTab() : null}
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
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
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
    minHeight: 140,
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
    marginBottom: 16,
  },
  photoContainer: {
    flex: 1,
  },
  photoPlaceholder: {
    height: 200,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  photoPlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  photoPlaceholderSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  photoButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  photoButtonOutline: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  photoButtonOutlineText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  photoTips: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
  },
  photoTipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 12,
  },
  photoTipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  photoTipText: {
    fontSize: 14,
    color: Colors.darkText,
  },
  textContainer: {
    flex: 1,
  },
  textHeader: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  textHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  textHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  textInputContainer: {
    marginBottom: 24,
  },
  textInputMulti: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 16,
    color: Colors.darkText,
  },
  textSubmitButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  textSubmitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  textSubmitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  textExamples: {
    flex: 1,
  },
  textExamplesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 12,
  },
  textExampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  textExampleText: {
    fontSize: 14,
    color: Colors.darkText,
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
  listContent: {
    paddingBottom: 100,
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
