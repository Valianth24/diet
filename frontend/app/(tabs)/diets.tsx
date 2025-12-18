import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function DietsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customDietName, setCustomDietName] = useState('');
  const [customDietDesc, setCustomDietDesc] = useState('');

  const premiumDiets = [
    {
      id: '1',
      name: 'Keto Diyeti',
      description: 'Düşük karbonhidrat, yüksek yağ',
      duration: '30 gün',
      calories: 1800,
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400',
      isPremium: true,
      category: 'Kilo Verme'
    },
    {
      id: '2',
      name: 'Akdeniz Diyeti',
      description: 'Dengeli ve sağlıklı beslenme',
      duration: '30 gün',
      calories: 2000,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      isPremium: true,
      category: 'Dengeli'
    },
    {
      id: '3',
      name: 'Kas Yapma Diyeti',
      description: 'Yüksek protein, orta karbonhidrat',
      duration: '60 gün',
      calories: 2500,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      isPremium: true,
      category: 'Kas Yapma'
    },
    {
      id: '4',
      name: 'Vejetaryen Diyeti',
      description: 'Bitkisel protein kaynakları',
      duration: '30 gün',
      calories: 1900,
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
      isPremium: true,
      category: 'Vejetaryen'
    },
  ];

  const handleCreateCustomDiet = () => {
    if (customDietName.trim()) {
      // Burada custom diet oluşturma işlemi yapılacak
      setShowCustomModal(false);
      setCustomDietName('');
      setCustomDietDesc('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Diyetler</Text>
          <Text style={styles.subtitle}>Size özel beslenme planları</Text>
        </View>

        {/* Premium Diets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={24} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Hazır Diyetler</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Uzman diyetisyenler tarafından hazırlanmış</Text>
          
          <View style={styles.dietGrid}>
            {premiumDiets.map((diet) => (
              <TouchableOpacity
                key={diet.id}
                style={styles.dietCard}
                onPress={() => {
                  // Navigate to diet detail
                  router.push({
                    pathname: '/details/diet-detail',
                    params: { dietId: diet.id }
                  });
                }}
              >
                <Image
                  source={{ uri: diet.image }}
                  style={styles.dietImage}
                />
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={12} color={Colors.white} />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
                <View style={styles.dietInfo}>
                  <Text style={styles.dietName}>{diet.name}</Text>
                  <Text style={styles.dietDescription} numberOfLines={2}>
                    {diet.description}
                  </Text>
                  <View style={styles.dietMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.lightText} />
                      <Text style={styles.metaText}>{diet.duration}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="flame-outline" size={14} color={Colors.lightText} />
                      <Text style={styles.metaText}>{diet.calories} kcal</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Diet Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Kişisel Diyet Oluştur</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Kendi beslenme planınızı oluşturun</Text>
          
          <TouchableOpacity
            style={styles.customDietCard}
            onPress={() => setShowCustomModal(true)}
          >
            <View style={styles.customDietContent}>
              <View style={styles.iconCircle}>
                <Ionicons name="add" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.customDietTitle}>Yeni Diyet Planı</Text>
              <Text style={styles.customDietSubtitle}>
                Kendi öğünlerinizi ve hedeflerinizi belirleyin
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Diet Modal */}
      <Modal visible={showCustomModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Diyet Oluştur</Text>
              <TouchableOpacity onPress={() => setShowCustomModal(false)}>
                <Ionicons name="close" size={28} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Diyet Adı"
              value={customDietName}
              onChangeText={setCustomDietName}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Açıklama (opsiyonel)"
              value={customDietDesc}
              onChangeText={setCustomDietDesc}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateCustomDiet}
            >
              <Text style={styles.createButtonText}>Oluştur</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightText,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.lightText,
    marginBottom: 16,
  },
  dietGrid: {
    gap: 16,
  },
  dietCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dietImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.warning,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  dietInfo: {
    padding: 16,
  },
  dietName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 4,
  },
  dietDescription: {
    fontSize: 14,
    color: Colors.lightText,
    marginBottom: 12,
  },
  dietMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.lightText,
  },
  customDietCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  customDietContent: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  customDietTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 4,
  },
  customDietSubtitle: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: 'center',
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
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
