import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../store/useStore';
import { Colors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

type DetectedItem = {
  label: string;
  aliases: string[];
  portion: {
    estimate_g: number;
    range_g: number[];
    basis: string;
  };
  confidence: number;
  food_id: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type VisionResult = {
  items: DetectedItem[];
  notes: string[];
  needs_user_confirmation: boolean;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
};

export default function CameraScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { triggerRefresh } = useStore();
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [editedItems, setEditedItems] = useState<DetectedItem[]>([]);
  const [saving, setSaving] = useState(false);

  const resizeImage = async (base64: string): Promise<string> => {
    // Frontend preprocessing - just return as is for now
    // In production: resize to max 1280px, compress to ~70% quality
    return base64;
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('error'), t('error'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // Cost optimization: lower quality
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64 = result.assets[0].base64;
      setImage(`data:image/jpeg;base64,${base64}`);
      setImageBase64(base64);
      setResult(null);
      setEditedItems([]);
      analyzeImage(base64);
    }
  };

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('error'), t('error'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64 = result.assets[0].base64;
      setImage(`data:image/jpeg;base64,${base64}`);
      setImageBase64(base64);
      setResult(null);
      setEditedItems([]);
      analyzeImage(base64);
    }
  };

  const analyzeImage = async (base64: string) => {
    try {
      setAnalyzing(true);
      const token = await AsyncStorage.getItem('session_token');
      
      // Use new Vision API
      const response = await fetch(`${API_BASE_URL}/api/meal/vision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          image_base64: base64,
          locale: 'tr-TR',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vision API error:', errorText);
        throw new Error(t('error'));
      }

      const data: VisionResult = await response.json();
      setResult(data);
      setEditedItems(data.items);
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert(t('error'), t('aiNotAvailable'));
    } finally {
      setAnalyzing(false);
    }
  };

  const updateItemGrams = (index: number, grams: number) => {
    const newItems = [...editedItems];
    const item = newItems[index];
    const originalItem = result?.items[index];
    if (!originalItem) return;

    const scale = grams / originalItem.portion.estimate_g;
    
    newItems[index] = {
      ...item,
      portion: { ...item.portion, estimate_g: grams },
      calories: Math.round(originalItem.calories * scale),
      protein: Math.round(originalItem.protein * scale * 10) / 10,
      carbs: Math.round(originalItem.carbs * scale * 10) / 10,
      fat: Math.round(originalItem.fat * scale * 10) / 10,
    };
    
    setEditedItems(newItems);
  };

  const getTotals = () => {
    return editedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  // Son hesaplananlara kaydet
  const saveToRecentScans = async (name: string, totals: any) => {
    try {
      const stored = await AsyncStorage.getItem('recent_food_scans');
      const existing = stored ? JSON.parse(stored) : [];
      
      const newScan = {
        id: `scan_${Date.now()}`,
        name: name,
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        timestamp: Date.now(),
        imagePreview: imageBase64?.substring(0, 100), // Sadece küçük önizleme
      };
      
      const updated = [newScan, ...existing].slice(0, 20);
      await AsyncStorage.setItem('recent_food_scans', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving to recent:', error);
    }
  };

  const handleAddMeal = async () => {
    if (!result || !imageBase64 || editedItems.length === 0) return;

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('session_token');
      const totals = getTotals();
      
      const mealName = editedItems.map(item => item.label).join(', ');
      
      const response = await fetch(`${API_BASE_URL}/api/food/add-meal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: mealName,
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          image_base64: imageBase64,
          meal_type: 'snack',
        }),
      });

      if (!response.ok) {
        throw new Error('Kaydetme başarısız');
      }

      // Son hesaplananlara kaydet
      await saveToRecentScans(mealName, totals);

      triggerRefresh();
      Alert.alert('Başarılı', 'Yemek kaydedildi!', [
        { text: 'Tamam', onPress: () => {
          router.replace('/(tabs)');
          setImage(null);
          setImageBase64(null);
          setResult(null);
          setEditedItems([]);
        }},
      ]);
    } catch (error) {
      console.error('Error adding meal:', error);
      Alert.alert('Hata', 'Yemek eklenemedi. Tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  const resetScreen = () => {
    setImage(null);
    setImageBase64(null);
    setResult(null);
    setEditedItems([]);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return Colors.success;
    if (confidence >= 0.6) return '#FFA500';
    return Colors.error;
  };

  const totals = getTotals();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fotoğraf ile Analiz</Text>
        {image && (
          <TouchableOpacity onPress={resetScreen} style={styles.headerButton}>
            <Ionicons name="refresh" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
        {!image && <View style={{ width: 40 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!image ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.emptyGradient}
            >
              <Ionicons name="camera" size={64} color="#FFF" />
              <Text style={styles.emptyTitle}>Yemek Fotoğrafı</Text>
              <Text style={styles.emptySubtitle}>AI kalorileri otomatik hesaplasın</Text>
            </LinearGradient>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={pickImage}>
                <Ionicons name="camera" size={24} color="#FFF" />
                <Text style={styles.primaryButtonText}>Fotoğraf Çek</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
                <Ionicons name="images" size={24} color={Colors.primary} />
                <Text style={styles.secondaryButtonText}>Galeriden Seç</Text>
              </TouchableOpacity>
            </View>

            {/* Tips */}
            <View style={styles.tips}>
              <Text style={styles.tipsTitle}>İpuçları</Text>
              {[
                'Yemeği üstten ve net çekin',
                'İyi aydınlatma kullanın',
                'Porsiyonu tam gösterin',
              ].map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          /* Result State */
          <View>
            {/* Image Preview */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
              <View style={styles.aiLabel}>
                <Ionicons name="sparkles" size={14} color="#FFD700" />
                <Text style={styles.aiLabelText}>AI Tahmini</Text>
              </View>
            </View>

            {analyzing ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Yemek analiz ediliyor...</Text>
                <Text style={styles.loadingSubtext}>AI görüntüyü inceliyor</Text>
              </View>
            ) : result && editedItems.length > 0 ? (
              <>
                {/* Detected Items */}
                <Text style={styles.sectionTitle}>Tespit Edilen Yemekler</Text>
                {editedItems.map((item, index) => (
                  <View key={index} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemNameRow}>
                        <Ionicons name="restaurant" size={20} color={Colors.primary} />
                        <Text style={styles.itemName}>{item.label}</Text>
                      </View>
                      <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(item.confidence) + '20' }]}>
                        <Text style={[styles.confidenceText, { color: getConfidenceColor(item.confidence) }]}>
                          %{Math.round(item.confidence * 100)}
                        </Text>
                      </View>
                    </View>

                    {/* Gram Input */}
                    <View style={styles.gramRow}>
                      <Text style={styles.gramLabel}>Porsiyon:</Text>
                      <View style={styles.gramInputContainer}>
                        <TouchableOpacity 
                          style={styles.gramButton}
                          onPress={() => updateItemGrams(index, Math.max(10, item.portion.estimate_g - 10))}
                        >
                          <Ionicons name="remove" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.gramInput}
                          value={String(item.portion.estimate_g)}
                          onChangeText={(text) => {
                            const num = parseInt(text) || 0;
                            updateItemGrams(index, num);
                          }}
                          keyboardType="numeric"
                        />
                        <Text style={styles.gramUnit}>g</Text>
                        <TouchableOpacity 
                          style={styles.gramButton}
                          onPress={() => updateItemGrams(index, item.portion.estimate_g + 10)}
                        >
                          <Ionicons name="add" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Nutrition Row */}
                    <View style={styles.nutritionRow}>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{item.calories}</Text>
                        <Text style={styles.nutritionLabel}>kcal</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{item.protein}g</Text>
                        <Text style={styles.nutritionLabel}>Protein</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{item.carbs}g</Text>
                        <Text style={styles.nutritionLabel}>Karb</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{item.fat}g</Text>
                        <Text style={styles.nutritionLabel}>Yağ</Text>
                      </View>
                    </View>

                    {!item.food_id && (
                      <View style={styles.warningBanner}>
                        <Ionicons name="warning" size={14} color="#996600" />
                        <Text style={styles.warningText}>Tahmini değerler</Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* Totals */}
                <View style={styles.totalsCard}>
                  <Text style={styles.totalsTitle}>Toplam</Text>
                  <View style={styles.totalsRow}>
                    <View style={styles.totalItem}>
                      <Text style={styles.totalValue}>{totals.calories}</Text>
                      <Text style={styles.totalLabel}>kcal</Text>
                    </View>
                    <View style={styles.totalItem}>
                      <Text style={styles.totalValue}>{totals.protein.toFixed(1)}g</Text>
                      <Text style={styles.totalLabel}>Protein</Text>
                    </View>
                    <View style={styles.totalItem}>
                      <Text style={styles.totalValue}>{totals.carbs.toFixed(1)}g</Text>
                      <Text style={styles.totalLabel}>Karb</Text>
                    </View>
                    <View style={styles.totalItem}>
                      <Text style={styles.totalValue}>{totals.fat.toFixed(1)}g</Text>
                      <Text style={styles.totalLabel}>Yağ</Text>
                    </View>
                  </View>
                </View>

                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                  <Ionicons name="information-circle" size={16} color={Colors.lightText} />
                  <Text style={styles.disclaimerText}>
                    AI tahminidir. Gram değerlerini düzenleyebilirsiniz.
                  </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleAddMeal}
                  disabled={saving}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveGradient}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                        <Text style={styles.saveButtonText}>Yemeği Kaydet</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : result && editedItems.length === 0 ? (
              <View style={styles.noResultCard}>
                <Ionicons name="alert-circle" size={48} color={Colors.lightText} />
                <Text style={styles.noResultText}>Yemek tespit edilemedi</Text>
                <Text style={styles.noResultSubtext}>Farklı bir açıdan tekrar deneyin</Text>
                <TouchableOpacity style={styles.retryButton} onPress={resetScreen}>
                  <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyGradient: {
    width: '100%',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  secondaryButton: {
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
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  tips: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.darkText,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 16,
  },
  aiLabel: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  aiLabelText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.lightText,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 12,
  },
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.darkText,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  gramLabel: {
    fontSize: 14,
    color: Colors.darkText,
    fontWeight: '500',
  },
  gramInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  gramButton: {
    padding: 8,
  },
  gramInput: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
  },
  gramUnit: {
    fontSize: 14,
    color: Colors.lightText,
    marginRight: 4,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  nutritionLabel: {
    fontSize: 11,
    color: Colors.lightText,
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA50015',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  warningText: {
    fontSize: 12,
    color: '#996600',
  },
  totalsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  totalsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 12,
    textAlign: 'center',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  totalLabel: {
    fontSize: 11,
    color: Colors.lightText,
    marginTop: 2,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.lightText,
    flex: 1,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  noResultCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  noResultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginTop: 16,
  },
  noResultSubtext: {
    fontSize: 14,
    color: Colors.lightText,
    marginTop: 4,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
