export const DefaultTheme = {
  primary: '#7C3AED',
  secondary: '#EC4899',
  background: '#F3F4F6',
  white: '#FFFFFF',
  darkText: '#1F2937',
  lightText: '#6B7280',
  cardShadow: '#000000',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  teal: '#14B8A6',
  grey: '#9CA3AF',
};

export const PinkStarTheme = {
  primary: '#FF69B4',      // Hot Pink
  secondary: '#FFB6C1',    // Light Pink
  background: '#FFF0F5',   // Lavender Blush
  white: '#FFFFFF',
  darkText: '#8B3A62',     // Deep Pink Dark
  lightText: '#DB7093',    // Pale Violet Red
  cardShadow: '#FF69B4',
  error: '#DC143C',        // Crimson
  success: '#FFB6C1',      // Light Pink
  warning: '#FFD700',      // Gold
  teal: '#FF69B4',         // Hot Pink
  grey: '#DDA0DD',         // Plum
  // Special pink theme colors
  star: '#FFD700',         // Gold for stars
  sparkle: '#FFC0CB',      // Pink sparkle
  gradient1: '#FF1493',    // Deep Pink
  gradient2: '#FFB6C1',    // Light Pink
};

export const OceanTheme = {
  primary: '#0EA5E9',      // Sky Blue
  secondary: '#06B6D4',    // Cyan
  background: '#F0F9FF',   // Light Blue
  white: '#FFFFFF',
  darkText: '#0C4A6E',     // Dark Blue
  lightText: '#0369A1',    // Blue
  cardShadow: '#0EA5E9',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  teal: '#06B6D4',
  grey: '#94A3B8',
};

export const SunsetTheme = {
  primary: '#F97316',      // Orange
  secondary: '#FBBF24',    // Amber
  background: '#FFF7ED',   // Light Orange
  white: '#FFFFFF',
  darkText: '#7C2D12',     // Dark Orange
  lightText: '#EA580C',    // Orange Red
  cardShadow: '#F97316',
  error: '#DC2626',
  success: '#10B981',
  warning: '#FBBF24',
  teal: '#14B8A6',
  grey: '#A8A29E',
};

export const themes = {
  default: DefaultTheme,
  pinkStar: PinkStarTheme,
  ocean: OceanTheme,
  sunset: SunsetTheme,
};

export type ThemeName = keyof typeof themes;

export const themeMetadata = {
  default: {
    name: 'Varsayılan',
    description: 'Klasik mor tema',
    icon: 'color-palette',
    isLocked: false,
    requiredVideos: 0,
  },
  pinkStar: {
    name: 'Pembe Yıldız ⭐',
    description: 'Işıltılı pembe tema kızlar için',
    icon: 'star',
    isLocked: true,
    requiredVideos: 3,
  },
  ocean: {
    name: 'Okyanus 🌊',
    description: 'Sakin mavi tonlar',
    icon: 'water',
    isLocked: true,
    requiredVideos: 6,
  },
  sunset: {
    name: 'Gün Batımı 🌅',
    description: 'Sıcak turuncu tonlar',
    icon: 'sunny',
    isLocked: true,
    requiredVideos: 9,
  },
};
