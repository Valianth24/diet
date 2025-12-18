import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, ThemeName } from '../constants/Themes';

interface ThemeContextType {
  currentTheme: ThemeName;
  colors: typeof themes.default;
  setTheme: (theme: ThemeName) => Promise<void>;
  watchedVideos: number;
  incrementWatchedVideos: () => Promise<void>;
  unlockedThemes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');
  const [watchedVideos, setWatchedVideos] = useState(0);
  const [unlockedThemes, setUnlockedThemes] = useState<ThemeName[]>(['default']);

  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      const savedVideos = await AsyncStorage.getItem('watched_videos');
      const savedUnlocked = await AsyncStorage.getItem('unlocked_themes');

      if (savedTheme) setCurrentTheme(savedTheme as ThemeName);
      if (savedVideos) setWatchedVideos(parseInt(savedVideos));
      if (savedUnlocked) setUnlockedThemes(JSON.parse(savedUnlocked));
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  const setTheme = async (theme: ThemeName) => {
    try {
      await AsyncStorage.setItem('app_theme', theme);
      setCurrentTheme(theme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  const incrementWatchedVideos = async () => {
    try {
      const newCount = watchedVideos + 1;
      await AsyncStorage.setItem('watched_videos', newCount.toString());
      setWatchedVideos(newCount);

      // Check if new themes should be unlocked
      const newUnlocked: ThemeName[] = ['default'];
      if (newCount >= 3) newUnlocked.push('pinkStar');
      if (newCount >= 6) newUnlocked.push('ocean');
      if (newCount >= 9) newUnlocked.push('sunset');

      await AsyncStorage.setItem('unlocked_themes', JSON.stringify(newUnlocked));
      setUnlockedThemes(newUnlocked);
    } catch (error) {
      console.error('Error incrementing videos:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        colors: themes[currentTheme],
        setTheme,
        watchedVideos,
        incrementWatchedVideos,
        unlockedThemes,
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
