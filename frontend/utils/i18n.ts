import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  en: {
    translation: {
      // Navigation
      home: 'Home',
      camera: 'Camera',
      nutrition: 'Nutrition',
      tracking: 'Tracking',
      profile: 'Profile',
      
      // Dashboard
      hello: 'Hello',
      howAreYouToday: 'How are you today?',
      dailyCalories: 'Daily Calories',
      waterTracking: 'Water Tracking',
      stepCounter: 'Step Counter',
      vitaminTracking: 'Vitamin Tracking',
      takePhotoOfYourMeal: 'Take a Photo of Your Meal',
      toCalculateCalories: 'To calculate calories, take a photo.',
      takePhoto: 'Take Photo',
      kcal: 'kcal',
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      remaining: 'remaining',
      steps: 'steps',
      taken: 'Taken',
      notTaken: 'Not Taken',
      reminders: 'Reminders',
      
      // Food Analysis
      foodAnalysis: 'Food Analysis',
      analyzing: 'Analyzing...',
      addToMeal: 'Add to Meal',
      retake: 'Retake',
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
      
      // Profile
      updateProfile: 'Update Profile',
      height: 'Height (cm)',
      weight: 'Weight (kg)',
      age: 'Age',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      activityLevel: 'Activity Level',
      sedentary: 'Sedentary',
      light: 'Light',
      moderate: 'Moderate',
      active: 'Active',
      veryActive: 'Very Active',
      save: 'Save',
      logout: 'Logout',
      
      // Water
      addWater: '+250 ml',
      dailyGoal: 'Daily Goal',
      weeklyAverage: 'Weekly Average',
      
      // Auth
      welcome: 'Welcome to CalorieDiet',
      loginWithGoogle: 'Login with Google',
      setupProfile: 'Setup Your Profile',
    }
  },
  tr: {
    translation: {
      // Navigation
      home: 'Ana Sayfa',
      camera: 'Kamera',
      nutrition: 'Beslenme',
      tracking: 'Takip',
      profile: 'Profil',
      
      // Dashboard
      hello: 'Merhaba',
      howAreYouToday: 'Bugün nasılsın?',
      dailyCalories: 'Günlük Kalori',
      waterTracking: 'Su Takibi',
      stepCounter: 'Adım Sayacı',
      vitaminTracking: 'Vitamin Takibi',
      takePhotoOfYourMeal: 'Yemeğinin Fotoğrafını Çek',
      toCalculateCalories: 'Kalorini hesaplamak için fotoğraf çek.',
      takePhoto: 'Fotoğraf Çek',
      kcal: 'kcal',
      protein: 'Protein',
      carbs: 'Karbonhidrat',
      fat: 'Yağ',
      remaining: 'kalan',
      steps: 'adım',
      taken: 'Alındı',
      notTaken: 'Alınmadı',
      reminders: 'Hatırlatıcılar',
      
      // Food Analysis
      foodAnalysis: 'AI Yemek Analizi',
      analyzing: 'Analiz ediliyor...',
      addToMeal: 'Öğüne Ekle',
      retake: 'Yeniden Çek',
      breakfast: 'Kahvaltı',
      lunch: 'Öğle Yemeği',
      dinner: 'Akşam Yemeği',
      snack: 'Ara Öğün',
      
      // Profile
      updateProfile: 'Profili Güncelle',
      height: 'Boy (cm)',
      weight: 'Kilo (kg)',
      age: 'Yaş',
      gender: 'Cinsiyet',
      male: 'Erkek',
      female: 'Kadın',
      activityLevel: 'Aktivite Seviyesi',
      sedentary: 'Hareketsiz',
      light: 'Hafif',
      moderate: 'Orta',
      active: 'Aktif',
      veryActive: 'Çok Aktif',
      save: 'Kaydet',
      logout: 'Çıkış Yap',
      
      // Water
      addWater: '+250 ml',
      dailyGoal: 'Günlük Hedef',
      weeklyAverage: 'Haftalık Ortalama',
      
      // Auth
      welcome: 'CalorieDiet Uygulamasına Hoş Geldiniz',
      loginWithGoogle: 'Google ile Giriş Yap',
      setupProfile: 'Profilini Oluştur',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()[0]?.languageCode || 'tr',
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
