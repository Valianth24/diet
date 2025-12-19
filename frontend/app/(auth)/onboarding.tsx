import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { updateProfile } from '../../utils/api';
import { useStore } from '../../store/useStore';
import { Colors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';
import { languageList, changeLanguage, isFirstLaunch, setFirstLaunchDone, loadSavedLanguage } from '../../utils/i18n';
import { useAuth } from '../../contexts/AuthContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setUser } = useStore();
  const { setNeedsOnboarding } = useAuth();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'language' | 'profile'>('language');
  const [selectedLang, setSelectedLang] = useState('en');
  const [checkingLang, setCheckingLang] = useState(true);
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    age: '',
    gender: 'male',
    activity_level: 'moderate',
  });

  useEffect(() => {
    checkLanguageSelection();
  }, []);

  const checkLanguageSelection = async () => {
    try {
      const savedLang = await loadSavedLanguage();
      const firstLaunch = await isFirstLaunch();
      
      if (savedLang) {
        setSelectedLang(savedLang);
        setStep('profile');
      } else if (!firstLaunch) {
        setStep('profile');
      }
    } catch (error) {
      console.error('Error checking language:', error);
    } finally {
      setCheckingLang(false);
    }
  };

  const handleLanguageSelect = async () => {
    await changeLanguage(selectedLang);
    await setFirstLaunchDone();
    setStep('profile');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const userData = await updateProfile({
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        age: parseInt(formData.age),
        gender: formData.gender,
        activity_level: formData.activity_level,
      });
      setUser(userData);
      setNeedsOnboarding(false);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingLang) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Language Selection Step
  if (step === 'language') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.langContent}>
          <View style={styles.langHeader}>
            <Text style={styles.langLogo}>🍎</Text>
            <Text style={styles.langTitle}>CalorieDiet</Text>
            <Text style={styles.langSubtitle}>{t('selectLanguage')}</Text>
          </View>

          <View style={styles.langList}>
            {languageList.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langItem,
                  selectedLang === lang.code && styles.langItemSelected
                ]}
                onPress={() => setSelectedLang(lang.code)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.langName,
                  selectedLang === lang.code && styles.langNameSelected
                ]}>{lang.name}</Text>
                {selectedLang === lang.code && (
                  <View style={styles.langCheck}>
                    <Text style={styles.langCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.langContinueBtn} onPress={handleLanguageSelect}>
            <Text style={styles.langContinueText}>{t('continue')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Profile Setup Step
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('setupProfile')}</Text>
          <Text style={styles.subtitle}>{t('healthInfo')}</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('height')}</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="170"
                placeholderTextColor={Colors.lightText}
                value={formData.height}
                onChangeText={(text) => setFormData({ ...formData, height: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('weight')}</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="70"
                placeholderTextColor={Colors.lightText}
                value={formData.weight}
                onChangeText={(text) => setFormData({ ...formData, weight: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('age')}</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="25"
                placeholderTextColor={Colors.lightText}
                value={formData.age}
                onChangeText={(text) => setFormData({ ...formData, age: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('gender')}</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.gender === 'male' && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, gender: 'male' })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      formData.gender === 'male' && styles.optionButtonTextActive,
                    ]}
                  >
                    {t('male')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.gender === 'female' && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, gender: 'female' })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      formData.gender === 'female' && styles.optionButtonTextActive,
                    ]}
                  >
                    {t('female')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('activityLevel')}</Text>
              <View style={styles.buttonGroup}>
                {['sedentary', 'light', 'moderate', 'active', 'veryActive'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.optionButton,
                      formData.activity_level === level && styles.optionButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, activity_level: level })}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        formData.activity_level === level && styles.optionButtonTextActive,
                      ]}
                    >
                      {t(level)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Kaydediliyor...' : t('save')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: Colors.lightText,
  },
  // Language styles
  langContent: {
    flexGrow: 1,
    padding: 24,
  },
  langHeader: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  langLogo: {
    fontSize: 64,
    marginBottom: 16,
  },
  langTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 8,
  },
  langSubtitle: {
    fontSize: 18,
    color: Colors.lightText,
  },
  langList: {
    marginBottom: 20,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  langItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  langFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  langName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkText,
  },
  langNameSelected: {
    color: Colors.primary,
  },
  langCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langCheckText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  langContinueBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  langContinueText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Profile styles
  content: {
    padding: 24,
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
    marginBottom: 32,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.darkText,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: Colors.primary,
  },
  optionButtonTextActive: {
    color: Colors.white,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
