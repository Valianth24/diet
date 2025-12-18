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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { analyzeFood, addMeal } from '../../utils/api';
import { useStore } from '../../store/useStore';
import { Colors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CameraScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { triggerRefresh } = useStore();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState('lunch');

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Kamera izni gerekli!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImage(base64Image);
      setResult(null);
      analyzeImage(base64Image);
    }
  };

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Galeri izni gerekli!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImage(base64Image);
      setResult(null);
      analyzeImage(base64Image);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    try {
      setAnalyzing(true);
      const analysis = await analyzeFood(base64Image);
      setResult(analysis);
      setMealName(analysis.description);
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('AI analiz şu an kullanılamıyor. Ana sayfadan manuel ekleme yapabilirsiniz.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddMeal = async () => {
    if (!result || !image) return;

    try {
      await addMeal({
        name: mealName,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        image_base64: image,
        meal_type: mealType,
      });
      triggerRefresh();
      alert('Yemek eklendi!');
      router.push('/(tabs)');
      setImage(null);
      setResult(null);
      setMealName('');
    } catch (error) {
      console.error('Error adding meal:', error);
      alert('Hata: Yemek eklenemedi.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Fotoğraf ile Ekle</Text>
        <Text style={styles.subtitle}>Yemeğinizin fotoğrafını çekin veya galeriden seçin</Text>

        {!image ? (
          <View style={styles.emptyState}>
            <Ionicons name="camera" size={80} color={Colors.lightText} />
            <Text style={styles.emptyText}>Fotoğraf çek veya galeriden seç</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={pickImage}>
                <Ionicons name="camera" size={24} color={Colors.white} />
                <Text style={styles.buttonText}>Fotoğraf Çek</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={pickFromGallery}>
                <Ionicons name="images" size={24} color={Colors.primary} />
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Galeri</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Image source={{ uri: image }} style={styles.image} />
            {analyzing ? (
              <View style={styles.analyzing}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.analyzingText}>Analiz ediliyor...</Text>
              </View>
            ) : result ? (
              <View style={styles.result}>
                <View style={styles.resultCard}>
                  <Text style={styles.calories}>{result.calories} kcal</Text>
                  <View style={styles.macros}>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>Protein</Text>
                      <Text style={styles.macroValue}>{result.protein}g</Text>
                    </View>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>Karb</Text>
                      <Text style={styles.macroValue}>{result.carbs}g</Text>
                    </View>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>Yağ</Text>
                      <Text style={styles.macroValue}>{result.fat}g</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.form}>
                  <TextInput
                    style={styles.input}
                    value={mealName}
                    onChangeText={setMealName}
                    placeholder="Yemek adı"
                  />

                  <View style={styles.mealTypes}>
                    {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.mealTypeButton,
                          mealType === type && styles.mealTypeButtonActive,
                        ]}
                        onPress={() => setMealType(type)}
                      >
                        <Text
                          style={[
                            styles.mealTypeText,
                            mealType === type && styles.mealTypeTextActive,
                          ]}
                        >
                          {t(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.addButton} onPress={handleAddMeal}>
                    <Text style={styles.addButtonText}>Öğüne Ekle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.retakeButton} onPress={() => setImage(null)}>
                    <Text style={styles.retakeButtonText}>Yeniden Çek</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightText,
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.lightText,
    marginTop: 16,
    marginBottom: 32,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    gap: 12,
  },
  buttonSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: Colors.primary,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    marginBottom: 20,
  },
  analyzing: {
    alignItems: 'center',
    padding: 40,
  },
  analyzingText: {
    fontSize: 16,
    color: Colors.lightText,
    marginTop: 16,
  },
  result: {
    gap: 20,
  },
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  calories: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 20,
  },
  macros: {
    flexDirection: 'row',
    gap: 32,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: Colors.lightText,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkText,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  mealTypes: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  mealTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  mealTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  mealTypeText: {
    fontSize: 14,
    color: Colors.primary,
  },
  mealTypeTextActive: {
    color: Colors.white,
  },
  actions: {
    gap: 12,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  retakeButton: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retakeButtonText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
});
