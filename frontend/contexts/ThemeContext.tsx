import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, ThemeName } from '../constants/Themes';
import { useStore } from '../store/useStore';

interface ThemeContextType {
  currentTheme: ThemeName;
  colors: typeof themes.default;
  setTheme: (theme: ThemeName) => Promise<void>;
  watchedAds: number;
  incrementWatchedAds: () => Promise<void>;
  unlockedThemes: ThemeName[];
  themeExpirations: { [key: string]: number };
  isThemeAvailable: (theme: ThemeName) => boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');
  const [watchedAds, setWatchedAds] = useState(0);
  const [unlockedThemes, setUnlockedThemes] = useState<ThemeName[]>(['default']);
  const [themeExpirations, setThemeExpirations] = useState<{ [key: string]: number }>({});
  const { user } = useStore();

  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      const savedAds = await AsyncStorage.getItem('watched_ads');
      const savedUnlocked = await AsyncStorage.getItem('unlocked_themes');
      const savedExpirations = await AsyncStorage.getItem('theme_expirations');

      if (savedTheme) setCurrentTheme(savedTheme as ThemeName);
      if (savedAds) setWatchedAds(parseInt(savedAds));
      if (savedUnlocked) setUnlockedThemes(JSON.parse(savedUnlocked));
      if (savedExpirations) setThemeExpirations(JSON.parse(savedExpirations));
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  const isThemeAvailable = (theme: ThemeName): boolean => {
    // Default theme always available
    if (theme === 'default') return true;
    
    // Premium users have unlimited access
    if (user?.is_premium) return true;
    
    // Check if theme is unlocked and not expired
    if (unlockedThemes.includes(theme)) {
      const expiration = themeExpirations[theme];
      if (expiration) {
        const now = Date.now();
        return now < expiration;
      }
    }
    
    return false;
  };

  const setTheme = async (theme: ThemeName) => {
    try {
      // Allow all themes for now (remove restriction)
      await AsyncStorage.setItem('app_theme', theme);
      setCurrentTheme(theme);
      console.log('Theme changed to:', theme);
    } catch (error) {
      console.error('Error setting theme:', error);
      throw error;
    }
  };

  const incrementWatchedAds = async () => {
    try {
      const newCount = watchedAds + 1;
      await AsyncStorage.setItem('watched_ads', newCount.toString());
      setWatchedAds(newCount);

      // Check if new themes should be unlocked (every 3 ads)
      const newUnlocked: ThemeName[] = ['default'];
      const newExpirations: { [key: string]: number } = { ...themeExpirations };
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      // For free users: 24 hour access
      // For premium: unlimited (handled in isThemeAvailable)
      if (newCount >= 3) {
        newUnlocked.push('pinkStar');
        if (!user?.is_premium) {
          newExpirations['pinkStar'] = now + twentyFourHours;
        }
      }
      if (newCount >= 6) {
        newUnlocked.push('ocean');
        if (!user?.is_premium) {
          newExpirations['ocean'] = now + twentyFourHours;
        }
      }
      if (newCount >= 9) {
        newUnlocked.push('sunset');
        if (!user?.is_premium) {
          newExpirations['sunset'] = now + twentyFourHours;
        }
      }

      await AsyncStorage.setItem('unlocked_themes', JSON.stringify(newUnlocked));
      await AsyncStorage.setItem('theme_expirations', JSON.stringify(newExpirations));
      setUnlockedThemes(newUnlocked);
      setThemeExpirations(newExpirations);
    } catch (error) {
      console.error('Error incrementing ads:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        colors: themes[currentTheme],
        setTheme,
        watchedAds,
        incrementWatchedAds,
        unlockedThemes,
        themeExpirations,
        isThemeAvailable,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
