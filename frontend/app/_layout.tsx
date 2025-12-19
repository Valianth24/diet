import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { languageList, changeLanguage, isFirstLaunch, setFirstLaunchDone, loadSavedLanguage } from '../utils/i18n';
import '../utils/i18n';

function LanguageSelector({ visible, onSelect }: { visible: boolean; onSelect: () => void }) {
  const { t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState('en');

  const handleSelect = async (langCode: string) => {
    setSelectedLang(langCode);
  };

  const handleContinue = async () => {
    await changeLanguage(selectedLang);
    await setFirstLaunchDone();
    onSelect();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.langContainer}>
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
              onPress={() => handleSelect(lang.code)}
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

        <TouchableOpacity style={styles.langContinueBtn} onPress={handleContinue}>
          <Text style={styles.langContinueText}>{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [checkingFirstLaunch, setCheckingFirstLaunch] = useState(true);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      // Önce kayıtlı dili yükle
      const savedLang = await loadSavedLanguage();
      
      // İlk giriş mi kontrol et
      const firstLaunch = await isFirstLaunch();
      
      if (firstLaunch && !savedLang) {
        setShowLanguageSelector(true);
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
    } finally {
      setCheckingFirstLaunch(false);
    }
  };

  useEffect(() => {
    if (isLoading || checkingFirstLaunch || showLanguageSelector) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inDetailsGroup = segments[0] === 'details';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && needsOnboarding && segments[1] !== 'onboarding') {
      router.replace('/(auth)/onboarding');
    } else if (isAuthenticated && !needsOnboarding && !inTabsGroup && !inDetailsGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, needsOnboarding, segments, checkingFirstLaunch, showLanguageSelector]);

  return (
    <>
      <LanguageSelector 
        visible={showLanguageSelector} 
        onSelect={() => setShowLanguageSelector(false)} 
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="details" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  langContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  langHeader: {
    alignItems: 'center',
    marginBottom: 40,
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
    flex: 1,
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
    marginBottom: 40,
  },
  langContinueText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
