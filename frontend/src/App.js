import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import * as api from './api';

// ==================== CONTEXTS ====================
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

const ThemeContext = createContext(null);
const useTheme = () => useContext(ThemeContext);

// Theme definitions
const themes = {
  default: { primary: '#4CAF50', secondary: '#26C6DA', background: '#F5F5F5', cardBg: '#FFFFFF', text: '#212121', textLight: '#757575', name: 'Varsayılan', icon: '🎨' },
  pinkStar: { primary: '#FF69B4', secondary: '#FFB6C1', background: '#FFF0F5', cardBg: '#FFFFFF', text: '#831843', textLight: '#BE185D', name: 'Pembe Yıldız', icon: '💕' },
  ocean: { primary: '#0EA5E9', secondary: '#06B6D4', background: '#F0F9FF', cardBg: '#FFFFFF', text: '#0C4A6E', textLight: '#0369A1', name: 'Okyanus', icon: '🌊' },
  sunset: { primary: '#F97316', secondary: '#FBBF24', background: '#FFFBEB', cardBg: '#FFFFFF', text: '#7C2D12', textLight: '#C2410C', name: 'Gün Batımı', icon: '🌅' },
};

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const init = async () => {
      const url = window.location.href;
      if (url.includes('session_id=')) {
        await handleAuthRedirect();
      } else {
        await checkExistingSession();
      }
    };
    init();
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = api.getStoredToken();
      if (token) {
        api.setAuthToken(token);
        try {
          const userData = await api.getMe();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (err) {
          api.setAuthToken(null);
        }
      }
    } catch (error) {
      api.setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthRedirect = async () => {
    const url = window.location.href;
    let sessionId = null;
    if (url.includes('#session_id=')) sessionId = url.split('#session_id=')[1].split('&')[0];
    else if (url.includes('?session_id=')) sessionId = url.split('?session_id=')[1].split('&')[0];

    if (sessionId) {
      try {
        setIsLoading(true);
        const response = await api.exchangeSession(sessionId);
        api.setAuthToken(response.session_token);
        const userData = await api.getMe();
        setUser(userData);
        setIsAuthenticated(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Auth redirect error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const login = () => {
    const redirectUrl = window.location.origin;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    try { await api.logout(); } catch (error) {}
    api.setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (error) {}
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Theme Provider - Günlük sistem (her gün 3 video ile 24 saat açık)
const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [todayWatchedAds, setTodayWatchedAds] = useState(0);
  const [unlockedThemes, setUnlockedThemes] = useState(['default']);
  const [unlockExpiry, setUnlockExpiry] = useState({});

  useEffect(() => {
    loadThemeData();
  }, []);

  const loadThemeData = () => {
    try {
      const saved = localStorage.getItem('theme_data_v2');
      if (saved) {
        const data = JSON.parse(saved);
        const today = new Date().toDateString();
        
        if (data.lastWatchDate === today) {
          setTodayWatchedAds(data.todayWatchedAds || 0);
        } else {
          setTodayWatchedAds(0);
        }
        
        const now = Date.now();
        const validThemes = ['default'];
        const newExpiry = {};
        
        if (data.unlockExpiry) {
          Object.entries(data.unlockExpiry).forEach(([theme, expiry]) => {
            if (expiry > now) {
              validThemes.push(theme);
              newExpiry[theme] = expiry;
            }
          });
        }
        
        setUnlockedThemes(validThemes);
        setUnlockExpiry(newExpiry);
        
        if (data.currentTheme && validThemes.includes(data.currentTheme)) {
          setCurrentTheme(data.currentTheme);
        } else {
          setCurrentTheme('default');
        }
      }
    } catch (e) {
      console.error('Theme load error:', e);
    }
  };

  const saveThemeData = (theme, ads, unlocked, expiry) => {
    try {
      localStorage.setItem('theme_data_v2', JSON.stringify({ 
        currentTheme: theme, 
        todayWatchedAds: ads, 
        unlockedThemes: unlocked,
        unlockExpiry: expiry,
        lastWatchDate: new Date().toDateString()
      }));
    } catch (e) {
      console.error('Theme save error:', e);
    }
  };

  const setTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      saveThemeData(themeName, todayWatchedAds, unlockedThemes, unlockExpiry);
    }
  };

  const incrementWatchedAds = async (targetTheme) => {
    const newCount = todayWatchedAds + 1;
    setTodayWatchedAds(newCount);
    
    let newUnlocked = [...unlockedThemes];
    let newExpiry = { ...unlockExpiry };
    let themeJustUnlocked = null;

    if (newCount >= 3 && targetTheme && themes[targetTheme]) {
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
      if (!newUnlocked.includes(targetTheme)) {
        newUnlocked.push(targetTheme);
      }
      newExpiry[targetTheme] = expiryTime;
      themeJustUnlocked = targetTheme;
    }

    setUnlockedThemes(newUnlocked);
    setUnlockExpiry(newExpiry);
    saveThemeData(currentTheme, newCount, newUnlocked, newExpiry);

    try { await api.watchAd(1); } catch (error) {}
    
    return themeJustUnlocked;
  };

  const isThemeAvailable = (themeName, isPremium = false) => {
    if (themeName === 'default') return true;
    if (isPremium) return true;
    const expiry = unlockExpiry[themeName];
    return expiry && expiry > Date.now();
  };

  const getTimeRemaining = (themeName) => {
    const expiry = unlockExpiry[themeName];
    if (!expiry) return null;
    const remaining = expiry - Date.now();
    if (remaining <= 0) return null;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}s ${minutes}dk`;
  };

  const getVideosNeeded = () => Math.max(0, 3 - todayWatchedAds);

  const colors = themes[currentTheme] || themes.default;

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, colors, setTheme, todayWatchedAds, incrementWatchedAds, 
      unlockedThemes, isThemeAvailable, getTimeRemaining, getVideosNeeded, themes 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ==================== LANGUAGE CONFIG ====================
const languageList = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

// ==================== COMPONENTS ====================
const ProgressRing = ({ progress, size = 80, strokeWidth = 8, color = '#4CAF50' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle stroke="#e5e7eb" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
      <circle stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" r={radius} cx={size / 2} cy={size / 2}
        style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease' }} />
    </svg>
  );
};

// Premium Paywall Modal
const PremiumPaywall = ({ visible, onClose, onSubscribe }) => {
  const { colors } = useTheme();
  if (!visible) return null;

  const features = [
    { icon: '🍽️', text: 'Tüm premium diyetlere erişim' },
    { icon: '✏️', text: 'Sınırsız kişisel diyet oluşturma' },
    { icon: '📊', text: 'Detaylı beslenme analizi' },
    { icon: '🎨', text: 'Tüm temalara sınırsız erişim' },
    { icon: '💬', text: 'Öncelikli destek' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-md w-full relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.primary + '20' }}>
            <span className="text-4xl">💎</span>
          </div>
          <h2 className="text-3xl font-bold" style={{ color: colors.text }}>Premium'a Geç</h2>
          <p style={{ color: colors.textLight }}>Tüm özelliklerin kilidini aç</p>
        </div>

        <div className="space-y-3 mb-6">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-2xl">{f.icon}</span>
              <span style={{ color: colors.text }}>{f.text}</span>
            </div>
          ))}
        </div>

        <button onClick={onSubscribe} className="w-full text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all" style={{ backgroundColor: colors.primary }}>
          🚀 🎉 ÜCRETSİZ ABONE OL
        </button>
      </div>
    </div>
  );
};

// Video Reward Modal
const VideoRewardModal = ({ visible, onClose, targetTheme, onReward }) => {
  const { todayWatchedAds, incrementWatchedAds, getVideosNeeded, themes, colors } = useTheme();
  const { user } = useAuth();
  const [isWatching, setIsWatching] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);

  if (!visible || !targetTheme || !themes[targetTheme]) return null;

  const theme = themes[targetTheme];
  const videosNeeded = getVideosNeeded();

  const handleWatchAd = async () => {
    setIsWatching(true);
    setWatchProgress(0);
    
    const interval = setInterval(() => {
      setWatchProgress(prev => Math.min(prev + 4, 100));
    }, 100);

    setTimeout(async () => {
      clearInterval(interval);
      setWatchProgress(100);
      const unlockedTheme = await incrementWatchedAds(targetTheme);
      setIsWatching(false);
      if (unlockedTheme) {
        setShowReward(true);
      }
    }, 3000);
  };

  if (showReward) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="rounded-3xl p-8 max-w-md w-full text-center" style={{ backgroundColor: theme.primary }}>
          <div className="text-6xl mb-4 animate-bounce">{theme.icon}</div>
          <h2 className="text-3xl font-bold mb-2 text-white">Tebrikler! 🎉</h2>
          <p className="text-xl mb-2 text-white">{theme.name} Teması Açıldı!</p>
          <div className="bg-white/20 rounded-xl p-3 mb-4">
            <p className="text-white/90">⏰ 24 saat süreyle kullanabilirsin!</p>
          </div>
          <button onClick={() => { setShowReward(false); onReward && onReward(); onClose(); }} className="px-8 py-3 rounded-xl font-bold bg-white shadow-lg" style={{ color: theme.primary }}>
            Temayı Uygula! 🌟
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text }}>Reklam İzle & Tema Aç</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl">✕</button>
        </div>

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{theme.icon}</div>
          <h3 className="text-2xl font-bold" style={{ color: colors.text }}>{theme.name}</h3>
          
          <div className="rounded-2xl p-4 mt-4" style={{ backgroundColor: colors.primary + '15' }}>
            <p className="text-sm font-medium mb-2" style={{ color: colors.primary }}>Bugünkü İlerleme</p>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: todayWatchedAds >= i ? colors.primary : '#E5E7EB', color: todayWatchedAds >= i ? 'white' : '#9CA3AF' }}>
                  {todayWatchedAds >= i ? '✓' : '📹'}
                </div>
              ))}
            </div>
            <p style={{ color: colors.text }}>{todayWatchedAds}/3 video izlendi</p>
            {videosNeeded > 0 && <p className="text-sm font-medium" style={{ color: colors.primary }}>{videosNeeded} video daha!</p>}
          </div>
        </div>

        {isWatching ? (
          <div className="space-y-3">
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <p className="text-gray-600 mb-2">🎬 Reklam izleniyor...</p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-100" style={{ width: `${watchProgress}%`, backgroundColor: colors.primary }}></div>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={handleWatchAd} className="w-full text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all" style={{ backgroundColor: colors.primary }}>
            ▶️ Video İzle ({todayWatchedAds + 1}/3)
          </button>
        )}
      </div>
    </div>
  );
};

// Theme Selector Component
const ThemeSelector = () => {
  const { currentTheme, setTheme, todayWatchedAds, isThemeAvailable, getTimeRemaining, getVideosNeeded, themes, colors } = useTheme();
  const { user } = useAuth();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);

  const handleThemeClick = (themeName) => {
    if (isThemeAvailable(themeName, user?.is_premium)) {
      setTheme(themeName);
    } else {
      setSelectedTheme(themeName);
      setShowVideoModal(true);
    }
  };

  const videosNeeded = getVideosNeeded();

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎨</span>
        <h3 className="text-xl font-bold" style={{ color: colors.text }}>Temalar</h3>
      </div>

      <div className="rounded-2xl p-4 mb-4 text-white" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">📹</span>
          <span className="font-semibold">Bugünkü Reklamlar</span>
        </div>
        <div className="h-3 bg-white/30 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-white transition-all" style={{ width: `${(todayWatchedAds / 3) * 100}%` }}></div>
        </div>
        <p className="font-bold">{todayWatchedAds} / 3 video izlendi</p>
        <p className="text-sm text-white/80">⏰ 3 video = 24 saat tema</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(themes).map(([key, theme]) => {
          const isUnlocked = isThemeAvailable(key, user?.is_premium);
          const isActive = currentTheme === key;
          const timeRemaining = getTimeRemaining(key);
          
          return (
            <button
              key={key}
              onClick={() => handleThemeClick(key)}
              className={`p-4 rounded-2xl text-center transition-all relative shadow-sm ${isActive ? 'ring-2' : ''}`}
              style={{ 
                backgroundColor: isUnlocked ? theme.primary : '#F3F4F6',
                ringColor: colors.primary
              }}
            >
              {isActive && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: colors.primary }}>✓</div>
              )}
              {!isUnlocked && <div className="absolute top-2 right-2">🔒</div>}
              
              <div className="text-4xl mb-2">{theme.icon}</div>
              <p className={`font-bold ${isUnlocked ? 'text-white' : 'text-gray-800'}`}>{theme.name}</p>
              
              {isUnlocked && key !== 'default' && !user?.is_premium && timeRemaining && (
                <p className="text-xs bg-white/30 px-2 py-1 rounded-lg mt-2 text-white">⏳ {timeRemaining}</p>
              )}
              {user?.is_premium && key !== 'default' && (
                <p className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-lg mt-2">♾️ Sınırsız</p>
              )}
              {!isUnlocked && (
                <p className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-lg mt-2">
                  {videosNeeded > 0 ? `${videosNeeded} video izle` : 'Tıkla ve aç'}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <VideoRewardModal visible={showVideoModal} targetTheme={selectedTheme} onClose={() => setShowVideoModal(false)} onReward={() => selectedTheme && setTheme(selectedTheme)} />
    </div>
  );
};

// ==================== PAGES ====================

// Login Page
const LoginPage = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  // İlk giriş için dil seçimi kontrolü
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [langChecked, setLangChecked] = useState(false);

  useEffect(() => {
    const hasLaunched = localStorage.getItem('has_launched');
    const savedLang = localStorage.getItem('app_language');
    if (!hasLaunched && !savedLang) {
      setShowLanguageSelector(true);
    }
    if (savedLang) setSelectedLang(savedLang);
    setLangChecked(true);
  }, []);

  const handleLanguageSelect = () => {
    localStorage.setItem('app_language', selectedLang);
    localStorage.setItem('has_launched', 'true');
    setShowLanguageSelector(false);
  };

  if (isAuthenticated) return null;

  // Dil seçim ekranı
  if (showLanguageSelector) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.background }}>
        <div className="max-w-md mx-auto pt-12">
          <div className="text-center mb-8">
            <span className="text-6xl mb-4 block">🍎</span>
            <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>CalorieDiet</h1>
            <p className="text-lg" style={{ color: colors.textLight }}>Select Language / Dil Seçin</p>
          </div>

          <div className="space-y-3 mb-8">
            {languageList.map(lang => (
              <button key={lang.code} onClick={() => setSelectedLang(lang.code)} className="w-full p-4 rounded-2xl flex items-center gap-4 transition-all" style={{ backgroundColor: selectedLang === lang.code ? colors.primary + '15' : 'white', borderWidth: 2, borderColor: selectedLang === lang.code ? colors.primary : 'transparent' }}>
                <span className="text-3xl">{lang.flag}</span>
                <span className="font-semibold text-lg" style={{ color: selectedLang === lang.code ? colors.primary : colors.text }}>{lang.name}</span>
                {selectedLang === lang.code && <span className="ml-auto w-6 h-6 rounded-full flex items-center justify-center text-white text-sm" style={{ backgroundColor: colors.primary }}>✓</span>}
              </button>
            ))}
          </div>

          <button onClick={handleLanguageSelect} className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all hover:shadow-lg" style={{ backgroundColor: colors.primary }}>
            Continue / Devam Et
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: colors.primary }}>
          <span className="text-4xl">💚</span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>CalorieDiet</h1>
        <p className="mb-8" style={{ color: colors.textLight }}>Sağlıklı Yaşam için Diyet Takibi</p>
        
        <button onClick={login} className="w-full bg-white border-2 border-gray-200 py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all" style={{ color: colors.text }}>
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google ile Giriş Yap
        </button>
      </div>
    </div>
  );
};

// Onboarding Page
const OnboardingPage = () => {
  const { refreshUser } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ height: '', weight: '', age: '', gender: 'male', activity_level: 'moderate' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile({ height: parseFloat(formData.height), weight: parseFloat(formData.weight), age: parseInt(formData.age), gender: formData.gender, activity_level: formData.activity_level });
      await refreshUser();
      navigate('/');
    } catch (error) {
      alert('Profil güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: colors.background }}>
      <div className="max-w-md mx-auto pt-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>Profilini Oluştur</h1>
        <p className="mb-6" style={{ color: colors.textLight }}>Kalori hedefinizi hesaplayabilmemiz için bilgilerinizi girin.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Boy (cm)</label>
            <input type="number" className="input-field" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} required style={{ borderColor: colors.primary + '50' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Kilo (kg)</label>
            <input type="number" className="input-field" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} required style={{ borderColor: colors.primary + '50' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Yaş</label>
            <input type="number" className="input-field" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} required style={{ borderColor: colors.primary + '50' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Cinsiyet</label>
            <div className="flex gap-4">
              <button type="button" className="flex-1 py-3 rounded-xl font-medium transition-all" style={{ backgroundColor: formData.gender === 'male' ? colors.primary : '#F3F4F6', color: formData.gender === 'male' ? 'white' : colors.text }} onClick={() => setFormData({...formData, gender: 'male'})}>Erkek</button>
              <button type="button" className="flex-1 py-3 rounded-xl font-medium transition-all" style={{ backgroundColor: formData.gender === 'female' ? colors.primary : '#F3F4F6', color: formData.gender === 'female' ? 'white' : colors.text }} onClick={() => setFormData({...formData, gender: 'female'})}>Kadın</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Aktivite Seviyesi</label>
            <select className="input-field" value={formData.activity_level} onChange={(e) => setFormData({...formData, activity_level: e.target.value})} style={{ borderColor: colors.primary + '50' }}>
              <option value="sedentary">Hareketsiz</option>
              <option value="light">Hafif Aktif</option>
              <option value="moderate">Orta Aktif</option>
              <option value="active">Aktif</option>
              <option value="very_active">Çok Aktif</option>
            </select>
          </div>
          <button type="submit" className="w-full py-4 rounded-xl font-bold text-white mt-6" style={{ backgroundColor: colors.primary }} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet ve Başla'}</button>
        </form>
      </div>
    </div>
  );
};

// Dashboard Page
const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [dailySummary, setDailySummary] = useState({ total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 });
  const [waterData, setWaterData] = useState({ total_amount: 0 });
  const [stepData, setStepData] = useState({ steps: 0 });
  const [vitamins, setVitamins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showGramModal, setShowGramModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [gramAmount, setGramAmount] = useState('100');
  const [foodDatabase, setFoodDatabase] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('lunch');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [summary, water, steps, vitaminData] = await Promise.all([
        api.getDailySummary(), api.getTodayWater(), api.getTodaySteps(), api.getTodayVitamins().catch(() => [])
      ]);
      setDailySummary(summary);
      setWaterData(water);
      setStepData(steps);
      setVitamins(vitaminData);
    } catch (error) {} finally { setLoading(false); }
  };

  const loadFoodDatabase = async () => {
    try { const foods = await api.getFoodDatabase('tr'); setFoodDatabase(foods); } catch (error) {}
  };

  const handleAddWater = async () => {
    try { await api.addWater(250); setWaterData(prev => ({ ...prev, total_amount: prev.total_amount + 250 })); } catch (error) {}
  };

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setGramAmount('100');
    setShowAddMealModal(false);
    setShowGramModal(true);
  };

  const handleAddMealWithGram = async () => {
    if (!selectedFood || !gramAmount) return;
    const grams = parseFloat(gramAmount) || 100;
    const multiplier = grams / 100;
    
    try {
      await api.addMeal({ 
        name: `${selectedFood.name} (${grams}g)`, 
        calories: Math.round(selectedFood.calories * multiplier), 
        protein: Math.round(selectedFood.protein * multiplier * 10) / 10, 
        carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10, 
        fat: Math.round(selectedFood.fat * multiplier * 10) / 10, 
        image_base64: '', 
        meal_type: selectedMealType 
      });
      setShowGramModal(false);
      setSelectedFood(null);
      loadData();
    } catch (error) { alert('Yemek eklenemedi.'); }
  };

  const handleToggleVitamin = async (vitaminId) => {
    try { await api.toggleVitamin(vitaminId); setVitamins(prev => prev.map(v => v.vitamin_id === vitaminId ? { ...v, is_taken: !v.is_taken } : v)); } catch (error) {}
  };

  const handlePremiumSubscribe = async () => {
    try { await api.activatePremium(); alert('🎉 Premium aktif!'); setShowPremiumModal(false); refreshUser(); } catch (error) { alert('Hata oluştu.'); }
  };

  const calorieGoal = user?.daily_calorie_goal || 2000;
  const waterGoal = user?.water_goal || 2500;
  const stepGoal = user?.step_goal || 10000;

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}></div></div>;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div className="p-4 shadow-sm" style={{ backgroundColor: colors.cardBg }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: colors.primary }}>{user?.name?.[0]}</div>
            <div>
              <h1 className="font-bold" style={{ color: colors.text }}>Merhaba {user?.name?.split(' ')[0]} 👋</h1>
              <p className="text-sm" style={{ color: colors.textLight }}>Bugün nasılsın?</p>
            </div>
          </div>
          <button onClick={() => setShowPremiumModal(true)} className="px-3 py-2 rounded-full text-sm font-bold flex items-center gap-1 text-white" style={{ backgroundColor: colors.secondary }}>💎 Premium</button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Bar */}
        <div className="rounded-2xl p-4 flex justify-around shadow-sm" style={{ backgroundColor: colors.cardBg }}>
          <div className="flex items-center gap-2"><span className="text-xl">🔥</span><span className="font-semibold" style={{ color: colors.text }}>{dailySummary.total_calories} kcal</span></div>
          <div className="flex items-center gap-2"><span className="text-xl">💧</span><span className="font-semibold" style={{ color: colors.text }}>{(waterData.total_amount / 1000).toFixed(1)} L</span></div>
          <div className="flex items-center gap-2"><span className="text-xl">👣</span><span className="font-semibold" style={{ color: colors.text }}>{stepData.steps.toLocaleString()}</span></div>
        </div>

        {/* Kalori ve Vitamin - Yan Yana */}
        <div className="grid grid-cols-2 gap-4">
          {/* Calorie Card */}
          <div className="rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all" style={{ backgroundColor: colors.cardBg }} onClick={() => navigate('/meals')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><span className="text-xl">🔥</span><h3 className="font-bold" style={{ color: colors.text }}>Kalori</h3></div>
              <span className="text-xs" style={{ color: colors.textLight }}>{calorieGoal - dailySummary.total_calories} kalan</span>
            </div>
            <div className="relative mb-3 flex justify-center">
              <ProgressRing progress={Math.min((dailySummary.total_calories / calorieGoal) * 100, 100)} size={80} strokeWidth={8} color={colors.primary} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold" style={{ color: colors.text }}>{Math.round((dailySummary.total_calories / calorieGoal) * 100)}%</span>
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span style={{ color: colors.textLight }}>Protein</span><span className="font-medium" style={{ color: colors.text }}>{dailySummary.total_protein.toFixed(1)}g</span></div>
              <div className="flex justify-between"><span style={{ color: colors.textLight }}>Karb</span><span className="font-medium" style={{ color: colors.text }}>{dailySummary.total_carbs.toFixed(1)}g</span></div>
              <div className="flex justify-between"><span style={{ color: colors.textLight }}>Yağ</span><span className="font-medium" style={{ color: colors.text }}>{dailySummary.total_fat.toFixed(1)}g</span></div>
            </div>
            <p className="text-center text-xs mt-2 font-medium" style={{ color: colors.primary }}>Yemekleri Gör →</p>
          </div>

          {/* Vitamin Card */}
          <div className="rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all" style={{ backgroundColor: colors.cardBg }} onClick={() => navigate('/vitamins')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><span className="text-xl">💊</span><h3 className="font-bold" style={{ color: colors.text }}>Vitamin</h3></div>
              <span className="text-xs" style={{ color: colors.textLight }}>{vitamins.filter(v => v.is_taken).length}/{vitamins.length}</span>
            </div>
            <div className="space-y-2 max-h-28 overflow-hidden">
              {vitamins.slice(0, 3).map(vitamin => (
                <div key={vitamin.vitamin_id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: vitamin.is_taken ? colors.primary + '15' : '#F3F4F6' }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: colors.text }}>{vitamin.name}</p>
                    <p className="text-xs truncate" style={{ color: colors.textLight }}>{vitamin.time}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleToggleVitamin(vitamin.vitamin_id); }} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 ml-2" style={{ backgroundColor: vitamin.is_taken ? colors.primary : '#D1D5DB' }}>
                    {vitamin.is_taken && '✓'}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-xs mt-2 font-medium" style={{ color: colors.primary }}>Detaylar →</p>
          </div>
        </div>

        {/* Su ve Adım - Yan Yana */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all" style={{ backgroundColor: colors.cardBg }} onClick={() => navigate('/water')}>
            <div className="flex items-center gap-2 mb-3"><span className="text-xl">💧</span><h3 className="font-bold" style={{ color: colors.text }}>Su</h3></div>
            <div className="relative mb-3 flex justify-center">
              <ProgressRing progress={Math.min((waterData.total_amount / waterGoal) * 100, 100)} size={80} color={colors.secondary} />
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-bold" style={{ color: colors.text }}>{Math.round((waterData.total_amount / waterGoal) * 100)}%</span></div>
            </div>
            <p className="text-center text-sm mb-2" style={{ color: colors.textLight }}>{waterData.total_amount} / {waterGoal} ml</p>
            <button onClick={(e) => { e.stopPropagation(); handleAddWater(); }} className="w-full py-2 rounded-xl font-medium transition-all" style={{ backgroundColor: colors.secondary + '20', color: colors.secondary }}>+250 ml</button>
          </div>

          <div className="rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all" style={{ backgroundColor: colors.cardBg }} onClick={() => navigate('/tracking')}>
            <div className="flex items-center gap-2 mb-3"><span className="text-xl">👣</span><h3 className="font-bold" style={{ color: colors.text }}>Adım</h3></div>
            <div className="relative mb-3 flex justify-center">
              <ProgressRing progress={Math.min((stepData.steps / stepGoal) * 100, 100)} size={80} color="#FF9800" />
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-bold" style={{ color: colors.text }}>{Math.round((stepData.steps / stepGoal) * 100)}%</span></div>
            </div>
            <p className="text-center text-sm mb-2" style={{ color: colors.textLight }}>{stepData.steps.toLocaleString()} / {stepGoal.toLocaleString()}</p>
            <button className="w-full py-2 rounded-xl font-medium bg-orange-50 text-orange-600">Detaylar</button>
          </div>
        </div>

        {/* Add Meal Card */}
        <div onClick={() => { setShowAddMealModal(true); loadFoodDatabase(); }} className="rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all text-white" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center"><span className="text-3xl">➕</span></div>
            <div><h3 className="font-bold text-lg">Yemek Ekle</h3><p className="text-white/80 text-sm">Günlük öğünlerini kaydet</p></div>
          </div>
        </div>

        {/* Diets Link */}
        <div onClick={() => navigate('/diets')} className="rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-dashed" style={{ backgroundColor: colors.cardBg, borderColor: colors.secondary }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.secondary + '20' }}><span className="text-3xl">📋</span></div>
            <div><h3 className="font-bold text-lg" style={{ color: colors.text }}>Diyetler</h3><p className="text-sm" style={{ color: colors.textLight }}>Premium diyet planları</p></div>
            <span className="text-2xl ml-auto" style={{ color: colors.textLight }}>→</span>
          </div>
        </div>
      </div>

      {/* Add Meal Modal */}
      {showAddMealModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowAddMealModal(false)}>
          <div className="rounded-t-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.cardBg }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: colors.text }}>Hızlı Ekle</h2>
              <button onClick={() => setShowAddMealModal(false)} style={{ color: colors.textLight }}>✕</button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[{k:'breakfast',i:'🌅',l:'Kahvaltı'},{k:'lunch',i:'🌞',l:'Öğle'},{k:'dinner',i:'🌙',l:'Akşam'},{k:'snack',i:'☕',l:'Ara Öğün'}].map(t => (
                <button key={t.k} onClick={() => setSelectedMealType(t.k)} className="p-3 rounded-xl text-center transition-all" style={{ backgroundColor: selectedMealType === t.k ? colors.primary : '#F3F4F6', color: selectedMealType === t.k ? 'white' : colors.text }}>
                  <span className="text-xl">{t.i}</span><p className="text-xs mt-1">{t.l}</p>
                </button>
              ))}
            </div>
            <input type="text" className="input-field mb-4" placeholder="Yemek ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ borderColor: colors.primary + '50' }} />
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {foodDatabase.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(food => (
                <div key={food.food_id} onClick={() => handleSelectFood(food)} className="p-3 rounded-xl cursor-pointer hover:shadow-sm transition-all flex items-center justify-between" style={{ backgroundColor: colors.background }}>
                  <div>
                    <p className="font-medium" style={{ color: colors.text }}>{food.name}</p>
                    <p className="text-sm" style={{ color: colors.textLight }}>{food.calories} kcal • P: {food.protein}g • K: {food.carbs}g • Y: {food.fat}g</p>
                    <p className="text-xs" style={{ color: colors.textLight }}>100g başına</p>
                  </div>
                  <span style={{ color: colors.textLight }}>→</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gram Input Modal */}
      {showGramModal && selectedFood && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGramModal(false)}>
          <div className="rounded-3xl p-6 w-full max-w-md" style={{ backgroundColor: colors.cardBg }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: colors.text }}>Miktar Gir</h2>
              <button onClick={() => setShowGramModal(false)} className="text-2xl" style={{ color: colors.textLight }}>✕</button>
            </div>

            <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: colors.background }}>
              <h3 className="font-bold text-lg" style={{ color: colors.text }}>{selectedFood.name}</h3>
              <p className="text-sm" style={{ color: colors.textLight }}>100g başına değerler</p>
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="text-center p-2 rounded-xl" style={{ backgroundColor: colors.cardBg }}><p className="text-xs" style={{ color: colors.textLight }}>Kalori</p><p className="font-bold text-orange-500">{selectedFood.calories}</p></div>
                <div className="text-center p-2 rounded-xl" style={{ backgroundColor: colors.cardBg }}><p className="text-xs" style={{ color: colors.textLight }}>Protein</p><p className="font-bold text-red-500">{selectedFood.protein}g</p></div>
                <div className="text-center p-2 rounded-xl" style={{ backgroundColor: colors.cardBg }}><p className="text-xs" style={{ color: colors.textLight }}>Karb</p><p className="font-bold text-blue-500">{selectedFood.carbs}g</p></div>
                <div className="text-center p-2 rounded-xl" style={{ backgroundColor: colors.cardBg }}><p className="text-xs" style={{ color: colors.textLight }}>Yağ</p><p className="font-bold text-yellow-500">{selectedFood.fat}g</p></div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Miktar (gram)</label>
              <div className="flex items-center gap-2">
                <input type="number" className="input-field text-center text-2xl font-bold flex-1" value={gramAmount} onChange={e => setGramAmount(e.target.value)} min="1" autoFocus style={{ borderColor: colors.primary }} />
                <span className="text-xl" style={{ color: colors.textLight }}>g</span>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              {['50', '100', '150', '200', '250'].map(g => (
                <button key={g} onClick={() => setGramAmount(g)} className="flex-1 py-2 rounded-xl text-sm font-medium transition-all" style={{ backgroundColor: gramAmount === g ? colors.primary : '#F3F4F6', color: gramAmount === g ? 'white' : colors.text }}>{g}g</button>
              ))}
            </div>

            <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: colors.primary + '15' }}>
              <p className="text-sm font-medium mb-2" style={{ color: colors.primary }}>Hesaplanan Değerler ({gramAmount || 0}g için):</p>
              <div className="flex justify-between text-sm" style={{ color: colors.text }}>
                <span>🔥 {Math.round(selectedFood.calories * (parseFloat(gramAmount) || 0) / 100)} kcal</span>
                <span>🥩 {Math.round(selectedFood.protein * (parseFloat(gramAmount) || 0) / 100 * 10) / 10}g protein</span>
              </div>
            </div>

            <button onClick={handleAddMealWithGram} className="w-full py-4 rounded-2xl font-bold text-white text-lg" style={{ backgroundColor: colors.primary }}>✓ {selectedFood.name} Ekle</button>
          </div>
        </div>
      )}

      <PremiumPaywall visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} onSubscribe={handlePremiumSubscribe} />
      <BottomNav />
    </div>
  );
};

// Diets Page
const DietsPage = () => {
  const { user, refreshUser } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const isPremium = user?.is_premium;

  const premiumDiets = [
    { id: '1', name: 'Keto Diyeti', desc: 'Düşük karbonhidrat, yüksek yağ', duration: '30 gün', calories: 1800, img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400' },
    { id: '2', name: 'Akdeniz Diyeti', desc: 'Dengeli ve sağlıklı beslenme', duration: '30 gün', calories: 2000, img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400' },
    { id: '3', name: 'Kas Yapma Diyeti', desc: 'Yüksek protein, orta karbonhidrat', duration: '60 gün', calories: 2500, img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' },
    { id: '4', name: 'Vejetaryen Diyeti', desc: 'Bitkisel protein kaynakları', duration: '30 gün', calories: 1900, img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400' },
  ];

  const handleDietClick = (diet) => { if (!isPremium) setShowPremiumModal(true); else alert(`${diet.name} diyetine başladınız!`); };
  const handlePremiumSubscribe = async () => { try { await api.activatePremium(); alert('🎉 Premium aktif!'); setShowPremiumModal(false); refreshUser(); } catch (error) { alert('Hata.'); } };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: colors.background }}>
      <div className="p-4 shadow-sm flex items-center justify-between" style={{ backgroundColor: colors.cardBg }}>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="p-2" style={{ color: colors.text }}>←</button>
          <h1 className="text-xl font-bold" style={{ color: colors.text }}>Diyetler</h1>
        </div>
        <button onClick={() => setShowPremiumModal(true)} className="px-4 py-2 rounded-full text-sm font-bold text-white" style={{ backgroundColor: colors.secondary }}>💎 Premium</button>
      </div>

      <div className="p-4">
        {isPremium && (
          <div className="p-4 rounded-2xl mb-4 flex items-center gap-3" style={{ backgroundColor: colors.primary + '20' }}>
            <span className="text-2xl">✅</span>
            <p className="font-medium" style={{ color: colors.primary }}>Premium üyesiniz!</p>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">⭐</span>
          <h2 className="text-xl font-bold" style={{ color: colors.text }}>Premium Diyetler</h2>
        </div>

        <div className="space-y-4">
          {premiumDiets.map(diet => (
            <div key={diet.id} onClick={() => handleDietClick(diet)} className={`rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-lg transition-all ${!isPremium && 'opacity-70'}`} style={{ backgroundColor: colors.cardBg }}>
              <div className="relative h-40">
                <img src={diet.img} alt={diet.name} className="w-full h-full object-cover" />
                {!isPremium && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-4xl">🔒</span></div>}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg" style={{ color: colors.text }}>{diet.name}</h3>
                <p className="text-sm mb-2" style={{ color: colors.textLight }}>{diet.desc}</p>
                <div className="flex gap-4 text-sm" style={{ color: colors.textLight }}><span>📅 {diet.duration}</span><span>🔥 {diet.calories} kcal</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PremiumPaywall visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} onSubscribe={handlePremiumSubscribe} />
      <BottomNav />
    </div>
  );
};

// Profile Page
const ProfilePage = () => {
  const { user, logout, refreshUser } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ height: user?.height || '', weight: user?.weight || '', age: user?.age || '', water_goal: user?.water_goal || 2500, step_goal: user?.step_goal || 10000 });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.updateProfile({ height: parseFloat(formData.height), weight: parseFloat(formData.weight), age: parseInt(formData.age), gender: user?.gender || 'male', activity_level: user?.activity_level || 'moderate' });
      await api.updateGoals({ water_goal: parseInt(formData.water_goal), step_goal: parseInt(formData.step_goal) });
      await refreshUser();
      setEditing(false);
    } catch (error) { alert('Kaydedilemedi.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: colors.background }}>
      <div className="text-white p-6 pb-20 rounded-b-3xl" style={{ backgroundColor: colors.primary }}>
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate('/')} className="p-2">←</button>
          <h1 className="text-xl font-bold">Profil</h1>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white">
            <span className="text-4xl font-bold">{user?.name?.[0]}</span>
          </div>
          <h2 className="text-xl font-bold mt-4">{user?.name}</h2>
          <p className="text-white/80">{user?.email}</p>
          {user?.is_premium && <span className="mt-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">💎 Premium</span>}
        </div>
      </div>

      <div className="px-4 -mt-12">
        <div className="rounded-2xl p-4 shadow-sm mb-4" style={{ backgroundColor: colors.cardBg }}>
          <ThemeSelector />
        </div>

        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: colors.cardBg }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold" style={{ color: colors.text }}>Kişisel Bilgiler</h3>
            {!editing ? <button onClick={() => setEditing(true)} style={{ color: colors.primary }}>Düzenle</button> : <button onClick={() => setEditing(false)} style={{ color: colors.textLight }}>İptal</button>}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm" style={{ color: colors.textLight }}>Boy (cm)</label><input type="number" className="input-field" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} /></div>
                <div><label className="text-sm" style={{ color: colors.textLight }}>Kilo (kg)</label><input type="number" className="input-field" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} /></div>
              </div>
              <div><label className="text-sm" style={{ color: colors.textLight }}>Yaş</label><input type="number" className="input-field" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm" style={{ color: colors.textLight }}>Su Hedefi (ml)</label><input type="number" className="input-field" value={formData.water_goal} onChange={e => setFormData({...formData, water_goal: e.target.value})} /></div>
                <div><label className="text-sm" style={{ color: colors.textLight }}>Adım Hedefi</label><input type="number" className="input-field" value={formData.step_goal} onChange={e => setFormData({...formData, step_goal: e.target.value})} /></div>
              </div>
              <button onClick={handleSave} className="w-full py-3 rounded-xl font-bold text-white" style={{ backgroundColor: colors.primary }} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b"><span style={{ color: colors.textLight }}>Boy</span><span className="font-medium" style={{ color: colors.text }}>{user?.height || '-'} cm</span></div>
              <div className="flex justify-between py-2 border-b"><span style={{ color: colors.textLight }}>Kilo</span><span className="font-medium" style={{ color: colors.text }}>{user?.weight || '-'} kg</span></div>
              <div className="flex justify-between py-2 border-b"><span style={{ color: colors.textLight }}>Yaş</span><span className="font-medium" style={{ color: colors.text }}>{user?.age || '-'}</span></div>
              <div className="flex justify-between py-2 border-b"><span style={{ color: colors.textLight }}>Kalori Hedefi</span><span className="font-medium" style={{ color: colors.text }}>{user?.daily_calorie_goal || '-'} kcal</span></div>
              <div className="flex justify-between py-2"><span style={{ color: colors.textLight }}>Su Hedefi</span><span className="font-medium" style={{ color: colors.text }}>{user?.water_goal || '-'} ml</span></div>
            </div>
          )}
        </div>

        <button onClick={logout} className="w-full mt-4 p-4 bg-red-50 text-red-600 rounded-2xl font-medium hover:bg-red-100">Çıkış Yap</button>
      </div>

      <BottomNav />
    </div>
  );
};

// Vitamins Page
const VitaminsPage = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [vitamins, setVitamins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [newVitaminName, setNewVitaminName] = useState('');
  const [newVitaminTime, setNewVitaminTime] = useState('Her Sabah');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTimes, setReminderTimes] = useState(['09:00', '21:00']);
  const [alarmStyle, setAlarmStyle] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('');

  useEffect(() => { loadVitamins(); loadReminderSettings(); }, []);

  const loadVitamins = async () => {
    try { const data = await api.getTodayVitamins(); setVitamins(data); } catch (error) {} finally { setLoading(false); }
  };

  const loadReminderSettings = () => {
    try {
      const enabled = localStorage.getItem('vitamin_reminder_enabled');
      const times = localStorage.getItem('vitamin_reminder_times');
      const alarm = localStorage.getItem('vitamin_alarm_style');
      if (enabled) setReminderEnabled(enabled === 'true');
      if (times) setReminderTimes(JSON.parse(times));
      if (alarm) setAlarmStyle(alarm === 'true');
    } catch (e) {}
  };

  const handleToggle = async (vitaminId) => {
    try { await api.toggleVitamin(vitaminId); setVitamins(prev => prev.map(v => v.vitamin_id === vitaminId ? { ...v, is_taken: !v.is_taken } : v)); } catch (error) {}
  };

  const handleAddVitamin = async () => {
    if (!newVitaminName) return;
    try { await api.addVitamin(newVitaminName, newVitaminTime); await loadVitamins(); setShowAddModal(false); setNewVitaminName(''); } catch (error) {}
  };

  const handleDeleteVitamin = async (vitaminId) => {
    if (window.confirm('Bu vitamini silmek istediğinize emin misiniz?')) {
      try { await api.deleteVitamin(vitaminId); await loadVitamins(); } catch (error) { alert('Silinemedi.'); }
    }
  };

  const saveReminderSettings = () => {
    try {
      localStorage.setItem('vitamin_reminder_enabled', String(reminderEnabled));
      localStorage.setItem('vitamin_reminder_times', JSON.stringify(reminderTimes));
      localStorage.setItem('vitamin_alarm_style', String(alarmStyle));
      alert(reminderEnabled ? 'Hatırlatıcı ayarları kaydedildi!' : 'Hatırlatıcılar kapatıldı.');
      setShowReminderModal(false);
    } catch (e) {}
  };

  const addReminderTime = () => {
    if (newReminderTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newReminderTime) && !reminderTimes.includes(newReminderTime)) {
      setReminderTimes([...reminderTimes, newReminderTime].sort());
      setNewReminderTime('');
    }
  };

  const takenCount = vitamins.filter(v => v.is_taken).length;

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}></div></div>;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: colors.background }}>
      <div className="p-4 shadow-sm flex items-center justify-between" style={{ backgroundColor: colors.cardBg }}>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="p-2" style={{ color: colors.text }}>←</button>
          <h1 className="text-xl font-bold" style={{ color: colors.text }}>Vitamin Takibi</h1>
        </div>
        <button onClick={() => setShowReminderModal(true)} className="p-2 rounded-full" style={{ backgroundColor: colors.primary + '20' }}>
          <span className="text-xl">🔔</span>
          {reminderEnabled && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }}></span>}
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl p-4 text-center shadow-sm" style={{ backgroundColor: colors.cardBg }}>
          <p className="text-2xl font-bold" style={{ color: colors.text }}>{takenCount} / {vitamins.length}</p>
          <p style={{ color: colors.textLight }}>Vitamin Alındı</p>
        </div>

        <div className="space-y-3">
          {vitamins.map(vitamin => (
            <div key={vitamin.vitamin_id} className="rounded-2xl p-4 shadow-sm flex items-center justify-between" style={{ backgroundColor: colors.cardBg }}>
              <div className="flex items-center gap-3 flex-1" onClick={() => handleToggle(vitamin.vitamin_id)}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                  <span className="text-2xl">💊</span>
                </div>
                <div>
                  <p className="font-bold" style={{ color: colors.text }}>{vitamin.name}</p>
                  <p className="text-sm" style={{ color: colors.textLight }}>{vitamin.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(vitamin.vitamin_id)} className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: vitamin.is_taken ? colors.primary : '#D1D5DB' }}>
                  {vitamin.is_taken && '✓'}
                </button>
                <button onClick={() => handleDeleteVitamin(vitamin.vitamin_id)} className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-500">🗑</button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setShowReminderModal(true)} className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 text-white font-bold" style={{ backgroundColor: colors.primary }}>
          <span>🔔</span> Hatırlatıcıları Ayarla
        </button>
      </div>

      <button onClick={() => setShowAddModal(true)} className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl shadow-lg" style={{ backgroundColor: colors.primary }}>+</button>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="rounded-3xl p-6 w-full max-w-md" style={{ backgroundColor: colors.cardBg }} onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.text }}>Yeni Vitamin Ekle</h2>
            <input className="input-field mb-4 w-full" placeholder="Vitamin Adı" value={newVitaminName} onChange={e => setNewVitaminName(e.target.value)} />
            <input className="input-field mb-4 w-full" placeholder="Zaman (örn: Her Sabah)" value={newVitaminTime} onChange={e => setNewVitaminTime(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl font-bold" style={{ backgroundColor: colors.background, color: colors.text }}>İptal</button>
              <button onClick={handleAddVitamin} className="flex-1 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: colors.primary }}>Ekle</button>
            </div>
          </div>
        </div>
      )}

      {showReminderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReminderModal(false)}>
          <div className="rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" style={{ backgroundColor: colors.cardBg }} onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.text }}>Hatırlatıcı Ayarları</h2>
            
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: colors.text }}>Hatırlatıcıları Aç</span>
              <button onClick={() => setReminderEnabled(!reminderEnabled)} className={`w-12 h-6 rounded-full transition-all ${reminderEnabled ? '' : 'bg-gray-300'}`} style={{ backgroundColor: reminderEnabled ? colors.primary : undefined }}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${reminderEnabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </div>

            {reminderEnabled && (
              <>
                <p className="font-medium mb-2" style={{ color: colors.text }}>Hatırlatma Saatleri</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {reminderTimes.map(time => (
                    <div key={time} className="px-3 py-2 rounded-full flex items-center gap-2" style={{ backgroundColor: colors.primary + '20' }}>
                      <span style={{ color: colors.primary }}>{time}</span>
                      <button onClick={() => setReminderTimes(reminderTimes.filter(t => t !== time))} style={{ color: colors.primary }}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  <input className="input-field flex-1" placeholder="HH:MM" value={newReminderTime} onChange={e => setNewReminderTime(e.target.value)} />
                  <button onClick={addReminderTime} className="px-4 py-2 rounded-xl text-white" style={{ backgroundColor: colors.primary }}>Ekle</button>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p style={{ color: colors.text }}>Alarm Tarzı Bildirim</p>
                    <p className="text-sm" style={{ color: colors.textLight }}>Maksimum ses ve titreşim</p>
                  </div>
                  <button onClick={() => setAlarmStyle(!alarmStyle)} className={`w-12 h-6 rounded-full transition-all ${alarmStyle ? '' : 'bg-gray-300'}`} style={{ backgroundColor: alarmStyle ? colors.primary : undefined }}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${alarmStyle ? 'translate-x-6' : 'translate-x-1'}`}></div>
                  </button>
                </div>
              </>
            )}

            <button onClick={saveReminderSettings} className="w-full py-3 rounded-xl font-bold text-white" style={{ backgroundColor: colors.primary }}>Kaydet</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

// Water Detail Page
const WaterDetailPage = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [weeklyWater, setWeeklyWater] = useState([]);
  const [todayWater, setTodayWater] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTimes, setReminderTimes] = useState(['09:00', '12:00', '15:00', '18:00', '21:00']);
  const [newReminderTime, setNewReminderTime] = useState('');

  useEffect(() => { loadData(); loadReminderSettings(); }, []);

  const loadData = async () => {
    try {
      const [weekly, today] = await Promise.all([api.getWeeklyWater(), api.getTodayWater()]);
      setWeeklyWater(weekly);
      setTodayWater(today.total_amount || 0);
    } catch (error) {} finally { setLoading(false); }
  };

  const loadReminderSettings = () => {
    try {
      const enabled = localStorage.getItem('water_reminder_enabled');
      const times = localStorage.getItem('water_reminder_times');
      if (enabled) setReminderEnabled(enabled === 'true');
      if (times) setReminderTimes(JSON.parse(times));
    } catch (e) {}
  };

  const handleAddWater = async (amount) => {
    try { await api.addWater(amount); setTodayWater(prev => prev + amount); } catch (error) {}
  };

  const saveReminderSettings = () => {
    try {
      localStorage.setItem('water_reminder_enabled', String(reminderEnabled));
      localStorage.setItem('water_reminder_times', JSON.stringify(reminderTimes));
      alert(reminderEnabled ? 'Hatırlatıcı ayarları kaydedildi!' : 'Hatırlatıcılar kapatıldı.');
      setShowReminderModal(false);
    } catch (e) {}
  };

  const addReminderTime = () => {
    if (newReminderTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newReminderTime) && !reminderTimes.includes(newReminderTime)) {
      setReminderTimes([...reminderTimes, newReminderTime].sort());
      setNewReminderTime('');
    }
  };

  const waterGoal = user?.water_goal || 2500;
  const glassCount = Math.floor(todayWater / 250);
  const totalGlasses = Math.ceil(waterGoal / 250);
  const avgWater = weeklyWater.length > 0 ? weeklyWater.reduce((sum, d) => sum + d.amount, 0) / weeklyWater.length / 1000 : 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: colors.secondary, borderTopColor: 'transparent' }}></div></div>;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: colors.background }}>
      <div className="p-4 shadow-sm flex items-center justify-between" style={{ backgroundColor: colors.cardBg }}>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="p-2" style={{ color: colors.text }}>←</button>
          <h1 className="text-xl font-bold" style={{ color: colors.text }}>Su Takibi</h1>
        </div>
        <button onClick={() => setShowReminderModal(true)} className="p-2 rounded-full" style={{ backgroundColor: colors.secondary + '20' }}>
          <span className="text-xl">🔔</span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl p-6 text-center shadow-sm" style={{ backgroundColor: colors.cardBg }}>
          <p style={{ color: colors.textLight }}>Bugünkü Hedefiniz</p>
          <div className="my-4 flex justify-center">
            <div className="relative">
              <ProgressRing progress={Math.min((todayWater / waterGoal) * 100, 100)} size={150} strokeWidth={12} color={colors.secondary} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl">💧</span>
                <span className="text-2xl font-bold" style={{ color: colors.text }}>{(todayWater / 1000).toFixed(1)}L</span>
                <span className="text-sm" style={{ color: colors.textLight }}>/ {(waterGoal / 1000).toFixed(1)}L</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: colors.cardBg }}>
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {[...Array(Math.min(8, totalGlasses))].map((_, i) => (
              <span key={i} className="text-3xl">{i < glassCount ? '💧' : '⚪'}</span>
            ))}
          </div>
          <p className="text-center" style={{ color: colors.textLight }}>{glassCount} / {totalGlasses} Bardak</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[250, 500, 1000].map(amount => (
            <button key={amount} onClick={() => handleAddWater(amount)} className="rounded-2xl p-4 text-center font-bold text-white shadow-sm" style={{ backgroundColor: colors.secondary }}>
              +{amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`}
            </button>
          ))}
        </div>

        <div className="rounded-2xl p-4 text-center shadow-sm" style={{ backgroundColor: colors.cardBg }}>
          <p style={{ color: colors.textLight }}>Haftalık Ortalama</p>
          <p className="text-2xl font-bold" style={{ color: colors.text }}>{avgWater.toFixed(1)}L</p>
        </div>

        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: colors.cardBg }}>
          <h3 className="font-bold mb-4" style={{ color: colors.text }}>Haftalık Su Tüketimi</h3>
          <div className="flex items-end justify-between h-40 gap-2">
            {weeklyWater.map((day) => {
              const maxAmount = Math.max(...weeklyWater.map(d => d.amount), 1);
              const height = (day.amount / maxAmount) * 100;
              const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
              const dayIndex = new Date(day.date).getDay();
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg" style={{ height: `${Math.max(height, 5)}%`, backgroundColor: colors.secondary }}></div>
                  <span className="text-xs" style={{ color: colors.textLight }}>{dayNames[dayIndex === 0 ? 6 : dayIndex - 1]}</span>
                  <span className="text-xs font-medium" style={{ color: colors.text }}>{(day.amount / 1000).toFixed(1)}L</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showReminderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReminderModal(false)}>
          <div className="rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" style={{ backgroundColor: colors.cardBg }} onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.text }}>Su Hatırlatıcısı</h2>
            
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: colors.text }}>Hatırlatıcıyı Aç</span>
              <button onClick={() => setReminderEnabled(!reminderEnabled)} className={`w-12 h-6 rounded-full transition-all ${reminderEnabled ? '' : 'bg-gray-300'}`} style={{ backgroundColor: reminderEnabled ? colors.secondary : undefined }}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${reminderEnabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </div>

            {reminderEnabled && (
              <>
                <p className="font-medium mb-2" style={{ color: colors.text }}>Hatırlatma Saatleri</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {reminderTimes.map(time => (
                    <div key={time} className="px-3 py-2 rounded-full flex items-center gap-2" style={{ backgroundColor: colors.secondary + '20' }}>
                      <span style={{ color: colors.secondary }}>{time}</span>
                      <button onClick={() => setReminderTimes(reminderTimes.filter(t => t !== time))} style={{ color: colors.secondary }}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  <input className="input-field flex-1" placeholder="HH:MM (örn: 14:30)" value={newReminderTime} onChange={e => setNewReminderTime(e.target.value)} />
                  <button onClick={addReminderTime} className="px-4 py-2 rounded-xl text-white" style={{ backgroundColor: colors.secondary }}>Ekle</button>
                </div>
              </>
            )}

            <button onClick={saveReminderSettings} className="w-full py-3 rounded-xl font-bold text-white" style={{ backgroundColor: colors.secondary }}>Kaydet</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

// Meals Page - Günlük Yemekler Öğün Öğün
const MealsPage = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [meals, setMeals] = useState([]);
  const [summary, setSummary] = useState({ total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [mealsData, summaryData] = await Promise.all([api.getTodayMeals(), api.getDailySummary()]);
      setMeals(mealsData);
      setSummary(summaryData);
    } catch (error) {} finally { setLoading(false); }
  };

  const getMealsByType = (type) => meals.filter(m => m.meal_type === type);
  const getMealTypeCalories = (type) => getMealsByType(type).reduce((sum, m) => sum + m.calories, 0);
  const getMealTypeIcon = (type) => {
    switch (type) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🌞';
      case 'dinner': return '🌙';
      case 'snack': return '☕';
      default: return '🍽️';
    }
  };
  const getMealTypeName = (type) => {
    switch (type) {
      case 'breakfast': return 'Kahvaltı';
      case 'lunch': return 'Öğle Yemeği';
      case 'dinner': return 'Akşam Yemeği';
      case 'snack': return 'Ara Öğün';
      default: return 'Diğer';
    }
  };

  const calorieGoal = user?.daily_calorie_goal || 2000;
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}></div></div>;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: colors.background }}>
      <div className="p-4 shadow-sm flex items-center gap-2" style={{ backgroundColor: colors.cardBg }}>
        <button onClick={() => navigate('/')} className="p-2" style={{ color: colors.text }}>←</button>
        <h1 className="text-xl font-bold" style={{ color: colors.text }}>Bugünkü Yemekler</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: colors.cardBg }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm" style={{ color: colors.textLight }}>Toplam Kalori</p>
              <p className="text-2xl font-bold" style={{ color: colors.text }}>{summary.total_calories} / {calorieGoal} kcal</p>
            </div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
              <span className="text-xl font-bold" style={{ color: colors.primary }}>{Math.round((summary.total_calories / calorieGoal) * 100)}%</span>
            </div>
          </div>
          <div className="flex justify-around">
            <div className="text-center"><div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: '#FF6B6B' }}></div><p className="text-xs" style={{ color: colors.textLight }}>Protein</p><p className="font-bold" style={{ color: colors.text }}>{summary.total_protein.toFixed(1)}g</p></div>
            <div className="text-center"><div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: '#4ECDC4' }}></div><p className="text-xs" style={{ color: colors.textLight }}>Karb</p><p className="font-bold" style={{ color: colors.text }}>{summary.total_carbs.toFixed(1)}g</p></div>
            <div className="text-center"><div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: '#FFE66D' }}></div><p className="text-xs" style={{ color: colors.textLight }}>Yağ</p><p className="font-bold" style={{ color: colors.text }}>{summary.total_fat.toFixed(1)}g</p></div>
          </div>
        </div>

        {/* Meal Sections */}
        {mealTypes.map(type => {
          const typeMeals = getMealsByType(type);
          const typeCalories = getMealTypeCalories(type);
          return (
            <div key={type} className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: colors.cardBg }}>
              <div className="flex justify-between items-center mb-3 pb-3 border-b" style={{ borderColor: colors.background }}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getMealTypeIcon(type)}</span>
                  <span className="font-bold text-lg" style={{ color: colors.text }}>{getMealTypeName(type)}</span>
                </div>
                <span className="font-bold" style={{ color: colors.primary }}>{typeCalories} kcal</span>
              </div>
              {typeMeals.length === 0 ? (
                <p className="text-center py-4" style={{ color: colors.textLight }}>Henüz yemek eklenmedi</p>
              ) : (
                <div className="space-y-2">
                  {typeMeals.map(meal => (
                    <div key={meal.meal_id} className="flex items-center gap-3 p-2 rounded-xl" style={{ backgroundColor: colors.background }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                        {meal.image_base64 ? <img src={meal.image_base64} alt="" className="w-full h-full object-cover rounded-xl" /> : <span className="text-xl">🍽️</span>}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: colors.text }}>{meal.name}</p>
                        <p className="text-xs" style={{ color: colors.textLight }}>P: {meal.protein.toFixed(1)}g • K: {meal.carbs.toFixed(1)}g • Y: {meal.fat.toFixed(1)}g</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: colors.primary }}>{meal.calories}</p>
                        <p className="text-xs" style={{ color: colors.textLight }}>kcal</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
};

// Tracking Page
const TrackingPage = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [weeklyWater, setWeeklyWater] = useState([]);
  const [stepData, setStepData] = useState({ steps: 0 });
  const [manualSteps, setManualSteps] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { const [water, steps] = await Promise.all([api.getWeeklyWater(), api.getTodaySteps()]); setWeeklyWater(water); setStepData(steps); } catch (error) {} finally { setLoading(false); }
  };

  const handleAddSteps = async () => {
    if (!manualSteps) return;
    try { await api.addManualSteps(parseInt(manualSteps)); setStepData({ steps: parseInt(manualSteps) }); setManualSteps(''); } catch (error) {}
  };

  const stepGoal = user?.step_goal || 10000;
  const caloriesBurned = Math.floor(stepData.steps * 0.04);
  const distance = (stepData.steps * 0.0008).toFixed(2);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}></div></div>;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: colors.background }}>
      <div className="p-4 shadow-sm flex items-center gap-2" style={{ backgroundColor: colors.cardBg }}>
        <button onClick={() => navigate('/')} className="p-2" style={{ color: colors.text }}>←</button>
        <h1 className="text-xl font-bold" style={{ color: colors.text }}>Adım Takibi</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: colors.cardBg }}>
          <p className="text-center mb-4" style={{ color: colors.textLight }}>Günlük Hedef: {stepGoal.toLocaleString()} Adım</p>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <ProgressRing progress={Math.min((stepData.steps / stepGoal) * 100, 100)} size={180} strokeWidth={14} color={colors.primary} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: colors.text }}>{stepData.steps.toLocaleString()}</span>
                <span className="text-sm" style={{ color: colors.textLight }}>adım</span>
                <span className="text-lg font-bold" style={{ color: colors.primary }}>{Math.round((stepData.steps / stepGoal) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-4 text-center shadow-sm" style={{ backgroundColor: colors.cardBg }}>
            <span className="text-2xl">🔥</span>
            <p className="text-xl font-bold mt-2" style={{ color: colors.text }}>{caloriesBurned}</p>
            <p className="text-sm" style={{ color: colors.textLight }}>Kalori</p>
          </div>
          <div className="rounded-2xl p-4 text-center shadow-sm" style={{ backgroundColor: colors.cardBg }}>
            <span className="text-2xl">📍</span>
            <p className="text-xl font-bold mt-2" style={{ color: colors.text }}>{distance}</p>
            <p className="text-sm" style={{ color: colors.textLight }}>km</p>
          </div>
          <div className="rounded-2xl p-4 text-center shadow-sm" style={{ backgroundColor: colors.cardBg }}>
            <span className="text-2xl">⏱️</span>
            <p className="text-xl font-bold mt-2" style={{ color: colors.text }}>{Math.floor(stepData.steps / 100)}</p>
            <p className="text-sm" style={{ color: colors.textLight }}>dakika</p>
          </div>
        </div>

        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: colors.cardBg }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📱</span>
            <div>
              <p className="font-bold" style={{ color: colors.text }}>Telefon Pedometresi</p>
              <p className="text-sm" style={{ color: colors.textLight }}>Otomatik adım sayımı için mobil uygulamayı kullanın</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="number" className="input-field flex-1" placeholder="Manuel adım gir" value={manualSteps} onChange={e => setManualSteps(e.target.value)} />
            <button onClick={handleAddSteps} className="px-6 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: colors.primary }}>Ekle</button>
          </div>
        </div>

        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: colors.cardBg }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: colors.text }}>Haftalık Su</h2>
          <div className="flex items-end justify-between h-40 gap-2">
            {weeklyWater.map((day) => {
              const maxAmount = Math.max(...weeklyWater.map(d => d.amount), 1);
              const height = (day.amount / maxAmount) * 100;
              const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
              const dayIndex = new Date(day.date).getDay();
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg" style={{ height: `${Math.max(height, 5)}%`, backgroundColor: colors.secondary }}></div>
                  <span className="text-xs" style={{ color: colors.textLight }}>{dayNames[dayIndex === 0 ? 6 : dayIndex - 1]}</span>
                  <span className="text-xs font-medium" style={{ color: colors.text }}>{(day.amount / 1000).toFixed(1)}L</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

// Bottom Navigation
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors } = useTheme();

  const navItems = [
    { path: '/', icon: '🏠', label: 'Ana Sayfa' },
    { path: '/diets', icon: '📋', label: 'Diyetler' },
    { path: '/tracking', icon: '📊', label: 'Takip' },
    { path: '/profile', icon: '👤', label: 'Profil' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t px-4 py-2 flex justify-around" style={{ backgroundColor: colors.cardBg, borderColor: colors.background }}>
      {navItems.map(item => (
        <button key={item.path} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all" style={{ backgroundColor: location.pathname === item.path ? colors.primary + '15' : 'transparent', color: location.pathname === item.path ? colors.primary : colors.textLight }}>
          <span className="text-xl">{item.icon}</span>
          <span className="text-xs">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { colors } = useTheme();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!user?.height || !user?.weight || !user?.age || !user?.gender) return <Navigate to="/onboarding" />;

  return children;
};

// Main App
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
            <Route path="/diets" element={<ProtectedRoute><DietsPage /></ProtectedRoute>} />
            <Route path="/vitamins" element={<ProtectedRoute><VitaminsPage /></ProtectedRoute>} />
            <Route path="/water" element={<ProtectedRoute><WaterDetailPage /></ProtectedRoute>} />
            <Route path="/meals" element={<ProtectedRoute><MealsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
