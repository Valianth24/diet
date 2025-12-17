import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { getVitaminTemplates, getUserVitamins, addVitamin, toggleVitamin } from '../utils/api';
import { useStore } from '../store/useStore';

interface Vitamin {
  vitamin_id: string;
  name: string;
  time: string;
  is_taken: boolean;
}

export default function VitaminCard() {
  const { t } = useTranslation();
  const { refreshData } = useStore();
  const [vitamins, setVitamins] = useState<Vitamin[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVitamins = async () => {
    try {
      setLoading(true);
      const userVitamins = await getUserVitamins();
      
      // If no user vitamins, create default ones
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('vitaminTracking')}</Text>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {vitamins.slice(0, 3).map((vitamin) => (
          <TouchableOpacity
            key={vitamin.vitamin_id}
            style={styles.vitaminItem}
            onPress={() => handleToggle(vitamin.vitamin_id)}
          >
            <Ionicons
              name={vitamin.is_taken ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={vitamin.is_taken ? Colors.success : Colors.error}
            />
            <View style={styles.vitaminInfo}>
              <Text style={styles.vitaminName}>{vitamin.name}</Text>
              <Text style={styles.vitaminTime}>{vitamin.time}</Text>
            </View>
            <Text
              style={[
                styles.status,
                { color: vitamin.is_taken ? Colors.success : Colors.lightText },
              ]}
            >
              {vitamin.is_taken ? t('taken') : t('notTaken')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.remindersButton}>
        <Ionicons name="notifications" size={20} color={Colors.white} />
        <Text style={styles.remindersButtonText}>{t('reminders')}</Text>
      </TouchableOpacity>
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
  list: {
    maxHeight: 150,
    marginBottom: 12,
  },
  vitaminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  vitaminInfo: {
    flex: 1,
  },
  vitaminName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
  },
  vitaminTime: {
    fontSize: 12,
    color: Colors.lightText,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  remindersButton: {
    backgroundColor: Colors.lightGreen,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  remindersButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
