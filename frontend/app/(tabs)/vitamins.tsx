import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVitaminTemplates, getUserVitamins, addVitamin, toggleVitamin } from '../../utils/api';
import { Colors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { useRouter } from 'expo-router';

interface Vitamin {
  vitamin_id: string;
  name: string;
  time: string;
  is_taken: boolean;
}

export default function VitaminsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { refreshData, user } = useStore();
  const [vitamins, setVitamins] = useState<Vitamin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVitaminName, setNewVitaminName] = useState('');
  const [newVitaminTime, setNewVitaminTime] = useState('Her Sabah');

  const loadVitamins = async () => {
    try {
      setLoading(true);
      const userVitamins = await getUserVitamins();
      
      if (userVitamins.length === 0) {
        const templates = await getVitaminTemplates();
        for (const template of templates) {
          await addVitamin(template.name, template.default_time);
        }
        const newUserVitamins = await getUserVitamins();
        setVitamins(newUserVitamins);
      } else {
        setVitamins(userVitamins);
      }
    } catch (error) {
      console.error('Error loading vitamins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVitamins();
  }, [refreshData]);

  const handleToggle = async (vitaminId: string) => {
    try {
      await toggleVitamin(vitaminId);
      await loadVitamins();
    } catch (error) {
      console.error('Error toggling vitamin:', error);
    }
  };

  const handleAddVitamin = async () => {
    if (!newVitaminName) return;
    try {
      await addVitamin(newVitaminName, newVitaminTime);
      await loadVitamins();
      setShowAddModal(false);
      setNewVitaminName('');
      setNewVitaminTime('Her Sabah');
    } catch (error) {
      console.error('Error adding vitamin:', error);
    }
  };

  const takenCount = vitamins.filter(v => v.is_taken).length;
  const totalSteps = user?.step_goal || 10000;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={Colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vitamin Takivleri</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.darkText} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Vitamin List */}
        <View style={styles.vitaminList}>
          {vitamins.map((vitamin) => (
            <TouchableOpacity
              key={vitamin.vitamin_id}
              style={styles.vitaminItem}
              onPress={() => handleToggle(vitamin.vitamin_id)}
              activeOpacity={0.7}
            >
              <View style={styles.vitaminLeft}>
                <View style={styles.vitaminIcon}>
                  <Ionicons name="medical" size={24} color={Colors.primary} />
                </View>
                <View style={styles.vitaminInfo}>
                  <Text style={styles.vitaminName}>{vitamin.name}</Text>
                  <Text style={styles.vitaminTime}>{vitamin.time}</Text>
                </View>
              </View>
              <View style={styles.vitaminRight}>
                <Ionicons
                  name={vitamin.is_taken ? 'checkmark-circle' : 'close-circle'}
                  size={32}
                  color={vitamin.is_taken ? Colors.success : Colors.error}
                />
                <Text
                  style={[
                    styles.vitaminStatus,
                    { color: vitamin.is_taken ? Colors.success : Colors.lightText },
                  ]}
                >
                  {vitamin.is_taken ? t('taken') : t('notTaken')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Stats */}
        <View style={styles.bottomCard}>
          <View style={styles.statsRow}>
            <Ionicons name="footsteps" size={20} color={Colors.lightText} />
            <Text style={styles.statsText}>
              Ortalama Ömülük: {totalSteps.toLocaleString()} Adım
            </Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreButtonText}>•••</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Vitamin Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Vitamin Ekle</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Vitamin Adı"
              value={newVitaminName}
              onChangeText={setNewVitaminName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Zaman (örn: Her Sabah)"
              value={newVitaminTime}
              onChangeText={setNewVitaminTime}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAdd]}
                onPress={handleAddVitamin}
              >
                <Text style={styles.modalButtonText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  menuButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  vitaminList: {
    gap: 12,
  },
  vitaminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vitaminLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vitaminIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitaminInfo: {
    flex: 1,
  },
  vitaminName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 4,
  },
  vitaminTime: {
    fontSize: 14,
    color: Colors.lightText,
  },
  vitaminRight: {
    alignItems: 'center',
    gap: 4,
  },
  vitaminStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsText: {
    fontSize: 14,
    color: Colors.darkText,
  },
  moreButton: {
    padding: 8,
  },
  moreButtonText: {
    fontSize: 20,
    color: Colors.lightText,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 32,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.background,
  },
  modalButtonAdd: {
    backgroundColor: Colors.primary,
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextCancel: {
    color: Colors.darkText,
    fontSize: 16,
    fontWeight: '600',
  },
});
