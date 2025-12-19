import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../store/useStore';
import { updateProfile, updateGoals } from '../../utils/api';
import { Colors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../utils/i18n';
import ThemeSelector from '../../components/ThemeSelector';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { setUser } = useStore();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    height: user?.height?.toString() || '',
    weight: user?.weight?.toString() || '',
    age: user?.age?.toString() || '',
    gender: user?.gender || 'male',
    activity_level: user?.activity_level || 'moderate',
    daily_calorie_goal: user?.daily_calorie_goal?.toString() || '',
    water_goal: user?.water_goal?.toString() || '',
    step_goal: user?.step_goal?.toString() || '',
  });

  const handleSave = async () => {
    try {
      const profileData = {
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        age: parseInt(formData.age),
        gender: formData.gender,
        activity_level: formData.activity_level,
      };

      const goalsData = {
        daily_calorie_goal: parseInt(formData.daily_calorie_goal),
        water_goal: parseInt(formData.water_goal),
        step_goal: parseInt(formData.step_goal),
      };

      const [updatedProfile, updatedGoals] = await Promise.all([
        updateProfile(profileData),
        updateGoals(goalsData),
      ]);

      setUser(updatedGoals);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState(i18n.language);

  const languageList = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  const handleLanguageChange = async (langCode: string) => {
    setSelectedLang(langCode);
    await i18n.changeLanguage(langCode);
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('app_language', langCode);
    setShowLanguageModal(false);
  };

  const getCurrentLanguageName = () => {
    const lang = languageList.find(l => l.code === i18n.language);
    return lang ? `${lang.flag} ${lang.name}` : '🇬🇧 English';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={40} color={Colors.white} />
            </View>
          )}
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('updateProfile')}</Text>
            <TouchableOpacity onPress={() => (editing ? handleSave() : setEditing(true))}>
              <Text style={styles.editButton}>{editing ? t('save') : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('height')}</Text>
                <TextInput
                  style={[styles.input, !editing && styles.inputDisabled]}
                  value={formData.height}
                  onChangeText={(text) => setFormData({ ...formData, height: text })}
                  keyboardType="numeric"
                  editable={editing}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('weight')}</Text>
                <TextInput
                  style={[styles.input, !editing && styles.inputDisabled]}
                  value={formData.weight}
                  onChangeText={(text) => setFormData({ ...formData, weight: text })}
                  keyboardType="numeric"
                  editable={editing}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('age')}</Text>
                <TextInput
                  style={[styles.input, !editing && styles.inputDisabled]}
                  value={formData.age}
                  onChangeText={(text) => setFormData({ ...formData, age: text })}
                  keyboardType="numeric"
                  editable={editing}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('gender')}</Text>
                <View style={styles.genderButtons}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      formData.gender === 'male' && styles.genderButtonActive,
                      !editing && styles.buttonDisabled,
                    ]}
                    onPress={() => editing && setFormData({ ...formData, gender: 'male' })}
                    disabled={!editing}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        formData.gender === 'male' && styles.genderButtonTextActive,
                      ]}
                    >
                      {t('male')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      formData.gender === 'female' && styles.genderButtonActive,
                      !editing && styles.buttonDisabled,
                    ]}
                    onPress={() => editing && setFormData({ ...formData, gender: 'female' })}
                    disabled={!editing}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        formData.gender === 'female' && styles.genderButtonTextActive,
                      ]}
                    >
                      {t('female')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Goals</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Calorie Goal (kcal)</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={formData.daily_calorie_goal}
                onChangeText={(text) => setFormData({ ...formData, daily_calorie_goal: text })}
                keyboardType="numeric"
                editable={editing}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Water Goal (ml)</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={formData.water_goal}
                onChangeText={(text) => setFormData({ ...formData, water_goal: text })}
                keyboardType="numeric"
                editable={editing}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Step Goal</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={formData.step_goal}
                onChangeText={(text) => setFormData({ ...formData, step_goal: text })}
                keyboardType="numeric"
                editable={editing}
              />
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingItem} onPress={() => setShowLanguageModal(true)}>
              <View style={styles.settingLeft}>
                <Ionicons name="language" size={24} color={Colors.primary} />
                <Text style={styles.settingText}>{t('selectLanguage') || 'Language'}</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{getCurrentLanguageName()}</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.lightText} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme Selector */}
        <ThemeSelector />

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color={Colors.white} />
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={28} color={Colors.darkText} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {languageList.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    i18n.language === lang.code && styles.languageItemActive
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageName,
                    i18n.language === lang.code && styles.languageNameActive
                  ]}>{lang.name}</Text>
                  {i18n.language === lang.code && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  email: {
    fontSize: 14,
    color: Colors.lightText,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  editButton: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.darkText,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
  },
  genderButtonText: {
    fontSize: 14,
    color: Colors.primary,
  },
  genderButtonTextActive: {
    color: Colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: Colors.darkText,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.lightText,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: Colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  logoutButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.background,
  },
  languageItemActive: {
    backgroundColor: Colors.primary + '15',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 16,
  },
  languageName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkText,
  },
  languageNameActive: {
    color: Colors.primary,
  },
});
