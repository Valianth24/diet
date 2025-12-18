import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { getUserVitamins, addVitamin, getVitaminTemplates } from '../utils/api';
import { useStore } from '../store/useStore';
import { useRouter } from 'expo-router';

interface Vitamin {
  vitamin_id: string;
  name: string;
  time: string;
  is_taken: boolean;
}

export default function VitaminCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { refreshData } = useStore();
  const [vitamins, setVitamins] = useState<Vitamin[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push('/details/vitamins')}
      activeOpacity={0.9}
    >
      <Text style={styles.title} numberOfLines={1}>{t('vitaminTracking')}</Text>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} scrollEnabled={false}>
        {vitamins.slice(0, 3).map((vitamin) => (
          <View key={vitamin.vitamin_id} style={styles.vitaminItem}>
            <Ionicons
              name={vitamin.is_taken ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={vitamin.is_taken ? Colors.success : Colors.lightText}
            />
            <View style={styles.vitaminInfo}>
              <Text style={styles.vitaminName} numberOfLines={1}>{vitamin.name}</Text>
              <Text style={styles.vitaminTime} numberOfLines={1}>{vitamin.time}</Text>
            </View>
            <Text
              style={[
                styles.status,
                { color: vitamin.is_taken ? Colors.success : Colors.lightText },
              ]}
              numberOfLines={1}
            >
              {vitamin.is_taken ? '✓' : '○'}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Detaylar için dokun</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 220,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 12,
  },
  list: {
    maxHeight: 120,
    marginBottom: 12,
  },
  vitaminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  vitaminInfo: {
    flex: 1,
  },
  vitaminName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkText,
  },
  vitaminTime: {
    fontSize: 11,
    color: Colors.lightText,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
});
