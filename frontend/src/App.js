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
  default: { primary: '#4CAF50', secondary: '#26C6DA', background: '#F5F5F5', name: 'Varsayılan', icon: '🎨', requiredAds: 0 },
  pinkStar: { primary: '#FF69B4', secondary: '#FFB6C1', background: '#FFE4F1', name: 'Pembe Yıldız ⭐', icon: '💕', requiredAds: 3 },
  ocean: { primary: '#0EA5E9', secondary: '#06B6D4', background: '#F0F9FF', name: 'Okyanus 🌊', icon: '🌊', requiredAds: 6 },
  sunset: { primary: '#F97316', secondary: '#FBBF24', background: '#FFF7ED', name: 'Gün Batımı 🌅', icon: '🌅', requiredAds: 9 },
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
    const saved = localStorage.getItem('theme_data_v2');
    if (saved) {
      const data = JSON.parse(saved);
      const today = new Date().toDateString();
      
      // Bugünkü izlenen reklamları kontrol et
      if (data.lastWatchDate === today) {
        setTodayWatchedAds(data.todayWatchedAds || 0);
      } else {
        // Yeni gün - sıfırla
        setTodayWatchedAds(0);
      }
      
      // Süresi dolmamış temaları kontrol et
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
      
      // Aktif tema süresi dolduysa varsayılana dön
      if (data.currentTheme && validThemes.includes(data.currentTheme)) {
        setCurrentTheme(data.currentTheme);
      } else {
        setCurrentTheme('default');
      }
    }
  };

  const saveThemeData = (theme, ads, unlocked, expiry) => {
    localStorage.setItem('theme_data_v2', JSON.stringify({ 
      currentTheme: theme, 
      todayWatchedAds: ads, 
      unlockedThemes: unlocked,
      unlockExpiry: expiry,
      lastWatchDate: new Date().toDateString()
    }));
  };

  const setTheme = (themeName) => {
    setCurrentTheme(themeName);
    saveThemeData(themeName, todayWatchedAds, unlockedThemes, unlockExpiry);
  };

  const incrementWatchedAds = async (targetTheme) => {
    const newCount = todayWatchedAds + 1;
    setTodayWatchedAds(newCount);
    
    let newUnlocked = [...unlockedThemes];
    let newExpiry = { ...unlockExpiry };
    let themeJustUnlocked = null;

    // Her 3 videoda bir tema aç (24 saat süreyle)
    if (newCount >= 3 && targetTheme) {
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 saat
      if (!newUnlocked.includes(targetTheme)) {
        newUnlocked.push(targetTheme);
        themeJustUnlocked = targetTheme;
      }
      newExpiry[targetTheme] = expiryTime;
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
    if (expiry && expiry > Date.now()) {
      return true;
    }
    return false;
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

  const getVideosNeededForTheme = () => {
    return Math.max(0, 3 - todayWatchedAds);
  };

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      colors: themes[currentTheme], 
      setTheme, 
      todayWatchedAds, 
      incrementWatchedAds, 
      unlockedThemes, 
      isThemeAvailable, 
      getTimeRemaining,
      getVideosNeededForTheme,
      themes 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ==================== COMPONENTS ====================
const ProgressRing = ({ progress, size = 80, strokeWidth = 8, color = '#4CAF50' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle stroke="#e5e7eb" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
      <circle stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" r={radius} cx={size / 2} cy={size / 2}
        style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease' }} />
    </svg>
  );
};

// Premium Paywall Modal
const PremiumPaywall = ({ visible, onClose, onSubscribe }) => {
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
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">✕</button>
        
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💎</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Premium'a Geç</h2>
          <p className="text-gray-500">Tüm özelliklerin kilidini aç</p>
        </div>

        <div className="space-y-3 mb-6">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-2xl">{f.icon}</span>
              <span className="text-gray-700">{f.text}</span>
            </div>
          ))}
        </div>

        <div className="bg-gray-100 rounded-2xl p-4 text-center mb-4 relative">
          <div className="absolute -top-2 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full">%37 İNDİRİM</div>
          <p className="text-gray-400 line-through">$7.99</p>
          <p className="text-4xl font-bold text-green-500">$4.99<span className="text-lg text-gray-500">/ay</span></p>
        </div>

        <button onClick={onSubscribe} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all">
          🚀 🎉 ÜCRETSİZ ABONE OL
        </button>
        <p className="text-xs text-gray-400 text-center mt-3">Şu an için tamamen ücretsiz!</p>
      </div>
    </div>
  );
};

// Video Reward Modal - Günlük 3 video sistemi
const VideoRewardModal = ({ visible, onClose, targetTheme, onReward }) => {
  const { todayWatchedAds, incrementWatchedAds, getVideosNeededForTheme, themes } = useTheme();
  const { user } = useAuth();
  const [isWatching, setIsWatching] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);

  if (!visible || !targetTheme) return null;

  const theme = themes[targetTheme];
  const videosNeeded = getVideosNeededForTheme();

  const handleWatchAd = async () => {
    setIsWatching(true);
    setWatchProgress(0);
    
    // 3 saniyelik video simülasyonu - progress bar ile
    const interval = setInterval(() => {
      setWatchProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    setTimeout(async () => {
      clearInterval(interval);
      setWatchProgress(100);
      
      const unlockedTheme = await incrementWatchedAds(targetTheme);
      setIsWatching(false);
      
      if (unlockedTheme) {
        setShowReward(true);
      } else if (getVideosNeededForTheme() <= 0) {
        // 3 video tamamlandı ama bu tema için değildi
        alert(`${todayWatchedAds + 1}/3 video izledin! Devam et 🎬`);
      }
    }, 3000);
  };

  if (showReward) {
    const gradientClass = targetTheme === 'pinkStar' ? 'from-pink-500 to-pink-300' : 
                          targetTheme === 'ocean' ? 'from-blue-500 to-cyan-300' :
                          targetTheme === 'sunset' ? 'from-orange-500 to-yellow-300' : 'from-gray-100 to-gray-200';
    
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className={`rounded-3xl p-8 max-w-md w-full text-center bg-gradient-to-br ${gradientClass}`}>
          <div className="text-6xl mb-4 animate-bounce">{theme.icon}</div>
          <h2 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">Tebrikler! 🎉</h2>
          <p className="text-xl mb-2 text-white">{theme.name} Teması Açıldı!</p>
          <div className="bg-white/20 rounded-xl p-3 mb-4">
            <p className="text-white/90">⏰ 24 saat süreyle kullanabilirsin!</p>
            <p className="text-white/70 text-sm">Yarın tekrar 3 video izle</p>
          </div>
          <button onClick={() => { setShowReward(false); onReward && onReward(); onClose(); }} className="px-8 py-3 rounded-xl font-bold bg-white text-purple-600 shadow-lg">
            Harika! 🌟
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Reklam İzle & Tema Aç</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl">✕</button>
        </div>

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{theme.icon}</div>
          <h3 className="text-2xl font-bold text-gray-800">{theme.name}</h3>
          
          {/* Günlük ilerleme */}
          <div className="bg-purple-50 rounded-2xl p-4 mt-4">
            <p className="text-sm text-purple-600 font-medium mb-2">Bugünkü İlerleme</p>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${todayWatchedAds >= i ? 'bg-purple-500' : 'bg-gray-200'}`}>
                  {todayWatchedAds >= i ? '✓' : '📹'}
                </div>
              ))}
            </div>
            <p className="text-gray-600">{todayWatchedAds}/3 video izlendi</p>
            {videosNeeded > 0 && (
              <p className="text-sm text-purple-500 font-medium">{videosNeeded} video daha!</p>
            )}
          </div>

          {/* 24 saat bilgisi */}
          <div className="bg-yellow-50 rounded-xl p-3 mt-3 flex items-center justify-center gap-2">
            <span>⏰</span>
            <span className="text-yellow-700 text-sm">3 video = 24 saat tema kullanımı</span>
          </div>
        </div>

        {/* Video izleme butonu */}
        {isWatching ? (
          <div className="space-y-3">
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <p className="text-gray-600 mb-2">🎬 Reklam izleniyor...</p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-100" style={{ width: `${watchProgress}%` }}></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{Math.round(watchProgress)}%</p>
            </div>
          </div>
        ) : (
          <button 
            onClick={handleWatchAd}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
          >
            ▶️ Video İzle ({todayWatchedAds + 1}/3)
          </button>
        )}

        {user?.is_premium && (
          <p className="text-center text-green-600 text-sm mt-3">💎 Premium üye olarak sınırsız erişiminiz var!</p>
        )}
      </div>
    </div>
  );
};

// Theme Selector Component - Günlük sistem
const ThemeSelector = () => {
  const { currentTheme, setTheme, todayWatchedAds, isThemeAvailable, getTimeRemaining, getVideosNeededForTheme, themes } = useTheme();
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

  const videosNeeded = getVideosNeededForTheme();

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎨</span>
        <h3 className="text-xl font-bold text-gray-800">Temalar</h3>
      </div>

      {/* Daily Progress Card */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 mb-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">📹</span>
          <span className="font-semibold">Bugünkü Reklamlar</span>
        </div>
        <div className="h-3 bg-white/30 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-white transition-all" style={{ width: `${(todayWatchedAds / 3) * 100}%` }}></div>
        </div>
        <p className="font-bold">{todayWatchedAds} / 3 video izlendi</p>
        {videosNeeded > 0 ? (
          <p className="text-sm text-white/80">{videosNeeded} video daha izle ve tema aç! 🎉</p>
        ) : (
          <p className="text-sm text-white/80">✅ Bugün tema açabilirsin!</p>
        )}
        <p className="text-xs text-white/60 mt-2">⏰ Her gün 3 video = 24 saat tema kullanımı</p>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(themes).map(([key, theme]) => {
          const isUnlocked = isThemeAvailable(key, user?.is_premium);
          const isActive = currentTheme === key;
          const timeRemaining = getTimeRemaining(key);
          
          return (
            <button
              key={key}
              onClick={() => handleThemeClick(key)}
              className={`p-4 rounded-2xl text-center transition-all relative ${
                isActive ? 'ring-2 ring-purple-500' : ''
              } ${key === 'pinkStar' && isUnlocked ? 'bg-gradient-to-br from-pink-500 to-pink-300 text-white' : 
                key === 'ocean' && isUnlocked ? 'bg-gradient-to-br from-blue-400 to-cyan-300 text-white' :
                key === 'sunset' && isUnlocked ? 'bg-gradient-to-br from-orange-400 to-yellow-300 text-white' : 'bg-white'} ${
                !isUnlocked ? 'opacity-60' : ''
              }`}
            >
              {!isUnlocked && (
                <div className="absolute top-2 right-2">🔒</div>
              )}
              {isActive && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
              )}
              <div className="text-4xl mb-2">{theme.icon}</div>
              <p className={`font-bold ${(key !== 'default' && isUnlocked) ? 'text-white' : 'text-gray-800'}`}>{theme.name}</p>
              
              {/* Time remaining badge */}
              {isUnlocked && key !== 'default' && !user?.is_premium && timeRemaining && (
                <p className="text-xs bg-white/30 px-2 py-1 rounded-lg mt-2">⏳ {timeRemaining}</p>
              )}
              
              {/* Premium badge */}
              {user?.is_premium && key !== 'default' && (
                <p className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-lg mt-2">♾️ Sınırsız</p>
              )}
              
              {/* Locked - need videos */}
              {!isUnlocked && (
                <p className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-lg mt-2">
                  {videosNeeded > 0 ? `${videosNeeded} video izle` : 'Açmak için tıkla'}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <VideoRewardModal
        visible={showVideoModal}
        targetTheme={selectedTheme}
        onClose={() => setShowVideoModal(false)}
        onReward={() => setTheme(selectedTheme)}
      />
    </div>
  );
};

// ==================== PAGES ====================

// Login Page
const LoginPage = () => {
  const { login, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">💚</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">CalorieDiet</h1>
        <p className="text-gray-500 mb-8">Sağlıklı Yaşam için Diyet Takibi</p>
        
        <button onClick={login} className="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
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
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ height: '', weight: '', age: '', gender: 'male', activity_level: 'moderate' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile({
        height: parseFloat(formData.height), weight: parseFloat(formData.weight),
        age: parseInt(formData.age), gender: formData.gender, activity_level: formData.activity_level
      });
      await refreshUser();
      navigate('/');
    } catch (error) {
      alert('Profil güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Profilini Oluştur</h1>
        <p className="text-gray-500 mb-6">Kalori hedefinizi hesaplayabilmemiz için bilgilerinizi girin.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Boy (cm)</label>
            <input type="number" className="input-field" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kilo (kg)</label>
            <input type="number" className="input-field" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yaş</label>
            <input type="number" className="input-field" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cinsiyet</label>
            <div className="flex gap-4">
              <button type="button" className={`flex-1 py-3 rounded-xl font-medium ${formData.gender === 'male' ? 'bg-green-500 text-white' : 'bg-gray-100'}`} onClick={() => setFormData({...formData, gender: 'male'})}>Erkek</button>
              <button type="button" className={`flex-1 py-3 rounded-xl font-medium ${formData.gender === 'female' ? 'bg-green-500 text-white' : 'bg-gray-100'}`} onClick={() => setFormData({...formData, gender: 'female'})}>Kadın</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aktivite Seviyesi</label>
            <select className="input-field" value={formData.activity_level} onChange={(e) => setFormData({...formData, activity_level: e.target.value})}>
              <option value="sedentary">Hareketsiz</option>
              <option value="light">Hafif Aktif</option>
              <option value="moderate">Orta Aktif</option>
              <option value="active">Aktif</option>
              <option value="very_active">Çok Aktif</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full mt-6" disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet ve Başla'}</button>
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
    try {
      await api.activatePremium();
      alert('🎉 Premium aktif oldu!');
      setShowPremiumModal(false);
      refreshUser();
    } catch (error) { alert('Hata oluştu.'); }
  };

  const calorieGoal = user?.daily_calorie_goal || 2000;
  const waterGoal = user?.water_goal || 2500;
  const stepGoal = user?.step_goal || 10000;

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
              <span className="text-white font-bold">{user?.name?.[0]}</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Merhaba {user?.name?.split(' ')[0]} 👋</h1>
              <p className="text-sm text-gray-500">Bugün nasılsın?</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPremiumModal(true)} className="px-3 py-2 bg-yellow-500 text-white rounded-full text-sm font-bold flex items-center gap-1">
              💎 Premium
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Bar */}
        <div className="bg-white rounded-2xl p-4 flex justify-around shadow-sm">
          <div className="flex items-center gap-2"><span className="text-xl">🔥</span><span className="font-semibold">{dailySummary.total_calories} kcal</span></div>
          <div className="flex items-center gap-2"><span className="text-xl">💧</span><span className="font-semibold">{(waterData.total_amount / 1000).toFixed(1)} L</span></div>
          <div className="flex items-center gap-2"><span className="text-xl">👣</span><span className="font-semibold">{stepData.steps.toLocaleString()}</span></div>
        </div>

        {/* Calorie Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Günlük Kalori</h2>
            <span className="text-sm text-gray-500">{calorieGoal - dailySummary.total_calories} kalan</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <ProgressRing progress={Math.min((dailySummary.total_calories / calorieGoal) * 100, 100)} size={100} strokeWidth={10} color={colors.primary} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{Math.round((dailySummary.total_calories / calorieGoal) * 100)}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Protein</span><span className="font-medium">{dailySummary.total_protein.toFixed(1)}g</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Karbonhidrat</span><span className="font-medium">{dailySummary.total_carbs.toFixed(1)}g</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Yağ</span><span className="font-medium">{dailySummary.total_fat.toFixed(1)}g</span></div>
            </div>
          </div>
        </div>

        {/* Water & Steps */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3"><span className="text-2xl">💧</span><h3 className="font-bold">Su</h3></div>
            <div className="relative mb-3 flex justify-center">
              <ProgressRing progress={Math.min((waterData.total_amount / waterGoal) * 100, 100)} size={80} color="#26C6DA" />
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-bold">{Math.round((waterData.total_amount / waterGoal) * 100)}%</span></div>
            </div>
            <p className="text-center text-sm text-gray-500 mb-2">{waterData.total_amount} / {waterGoal} ml</p>
            <button onClick={handleAddWater} className="w-full bg-cyan-50 text-cyan-600 py-2 rounded-xl font-medium hover:bg-cyan-100">+250 ml</button>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3"><span className="text-2xl">👣</span><h3 className="font-bold">Adım</h3></div>
            <div className="relative mb-3 flex justify-center">
              <ProgressRing progress={Math.min((stepData.steps / stepGoal) * 100, 100)} size={80} color="#FF9800" />
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-bold">{Math.round((stepData.steps / stepGoal) * 100)}%</span></div>
            </div>
            <p className="text-center text-sm text-gray-500 mb-2">{stepData.steps.toLocaleString()} / {stepGoal.toLocaleString()}</p>
            <button onClick={() => navigate('/tracking')} className="w-full bg-orange-50 text-orange-600 py-2 rounded-xl font-medium hover:bg-orange-100">Detaylar</button>
          </div>
        </div>

        {/* Vitamins */}
        {vitamins.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><span className="text-2xl">💊</span><h3 className="font-bold">Vitaminler</h3></div>
              <span className="text-sm text-gray-500">{vitamins.filter(v => v.is_taken).length}/{vitamins.length}</span>
            </div>
            <div className="space-y-2">
              {vitamins.map(vitamin => (
                <div key={vitamin.vitamin_id} className={`flex items-center justify-between p-3 rounded-xl ${vitamin.is_taken ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div><p className="font-medium">{vitamin.name}</p><p className="text-xs text-gray-500">{vitamin.time}</p></div>
                  <button onClick={() => handleToggleVitamin(vitamin.vitamin_id)} className={`w-8 h-8 rounded-full flex items-center justify-center ${vitamin.is_taken ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                    {vitamin.is_taken && '✓'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Meal Card */}
        <div onClick={() => { setShowAddMealModal(true); loadFoodDatabase(); }} className="card cursor-pointer hover:shadow-lg transition-all" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
          <div className="flex items-center gap-4 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center"><span className="text-3xl">➕</span></div>
            <div><h3 className="font-bold text-lg">Yemek Ekle</h3><p className="text-white/80 text-sm">Günlük öğünlerini kaydet</p></div>
          </div>
        </div>

        {/* Diets Link */}
        <div onClick={() => navigate('/diets')} className="card cursor-pointer hover:shadow-lg transition-all border-2 border-dashed border-yellow-400">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center"><span className="text-3xl">📋</span></div>
            <div><h3 className="font-bold text-lg text-gray-800">Diyetler</h3><p className="text-gray-500 text-sm">Premium diyet planlarına göz at</p></div>
            <span className="text-2xl ml-auto">→</span>
          </div>
        </div>
      </div>

      {/* Add Meal Modal */}
      {showAddMealModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowAddMealModal(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Hızlı Ekle</h2>
              <button onClick={() => setShowAddMealModal(false)}>✕</button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[{k:'breakfast',i:'🌅',l:'Kahvaltı'},{k:'lunch',i:'🌞',l:'Öğle'},{k:'dinner',i:'🌙',l:'Akşam'},{k:'snack',i:'☕',l:'Ara Öğün'}].map(t => (
                <button key={t.k} onClick={() => setSelectedMealType(t.k)} className={`p-3 rounded-xl text-center ${selectedMealType === t.k ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>
                  <span className="text-xl">{t.i}</span><p className="text-xs mt-1">{t.l}</p>
                </button>
              ))}
            </div>
            <input type="text" className="input-field mb-4" placeholder="Yemek ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {foodDatabase.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(food => (
                <div key={food.food_id} onClick={() => handleSelectFood(food)} className="p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{food.name}</p>
                    <p className="text-sm text-gray-500">{food.calories} kcal • P: {food.protein}g • K: {food.carbs}g • Y: {food.fat}g</p>
                    <p className="text-xs text-gray-400">100g başına</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gram Input Modal */}
      {showGramModal && selectedFood && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGramModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Miktar Gir</h2>
              <button onClick={() => setShowGramModal(false)} className="text-gray-500 text-2xl">✕</button>
            </div>

            {/* Food Info */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <h3 className="font-bold text-lg text-gray-800">{selectedFood.name}</h3>
              <p className="text-sm text-gray-500">100g başına değerler</p>
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="text-center p-2 bg-white rounded-xl">
                  <p className="text-xs text-gray-500">Kalori</p>
                  <p className="font-bold text-orange-500">{selectedFood.calories}</p>
                </div>
                <div className="text-center p-2 bg-white rounded-xl">
                  <p className="text-xs text-gray-500">Protein</p>
                  <p className="font-bold text-red-500">{selectedFood.protein}g</p>
                </div>
                <div className="text-center p-2 bg-white rounded-xl">
                  <p className="text-xs text-gray-500">Karb</p>
                  <p className="font-bold text-blue-500">{selectedFood.carbs}g</p>
                </div>
                <div className="text-center p-2 bg-white rounded-xl">
                  <p className="text-xs text-gray-500">Yağ</p>
                  <p className="font-bold text-yellow-500">{selectedFood.fat}g</p>
                </div>
              </div>
            </div>

            {/* Gram Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Miktar (gram)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input-field text-center text-2xl font-bold flex-1"
                  value={gramAmount}
                  onChange={e => setGramAmount(e.target.value)}
                  min="1"
                  autoFocus
                />
                <span className="text-xl text-gray-500">g</span>
              </div>
            </div>

            {/* Quick Buttons */}
            <div className="flex gap-2 mb-4">
              {['50', '100', '150', '200', '250'].map(g => (
                <button
                  key={g}
                  onClick={() => setGramAmount(g)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${gramAmount === g ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {g}g
                </button>
              ))}
            </div>

            {/* Calculated Values */}
            <div className="bg-green-50 rounded-2xl p-4 mb-4">
              <p className="text-sm text-green-700 font-medium mb-2">Hesaplanan Değerler ({gramAmount || 0}g için):</p>
              <div className="flex justify-between text-sm">
                <span>🔥 {Math.round(selectedFood.calories * (parseFloat(gramAmount) || 0) / 100)} kcal</span>
                <span>🥩 {Math.round(selectedFood.protein * (parseFloat(gramAmount) || 0) / 100 * 10) / 10}g protein</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>🍞 {Math.round(selectedFood.carbs * (parseFloat(gramAmount) || 0) / 100 * 10) / 10}g karb</span>
                <span>🧈 {Math.round(selectedFood.fat * (parseFloat(gramAmount) || 0) / 100 * 10) / 10}g yağ</span>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddMealWithGram}
              className="w-full py-4 rounded-2xl font-bold text-white text-lg"
              style={{ backgroundColor: colors.primary }}
            >
              ✓ {selectedFood.name} Ekle
            </button>
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
  const navigate = useNavigate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const isPremium = user?.is_premium;

  const premiumDiets = [
    { id: '1', name: 'Keto Diyeti', desc: 'Düşük karbonhidrat, yüksek yağ', duration: '30 gün', calories: 1800, img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400' },
    { id: '2', name: 'Akdeniz Diyeti', desc: 'Dengeli ve sağlıklı beslenme', duration: '30 gün', calories: 2000, img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400' },
    { id: '3', name: 'Kas Yapma Diyeti', desc: 'Yüksek protein, orta karbonhidrat', duration: '60 gün', calories: 2500, img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' },
    { id: '4', name: 'Vejetaryen Diyeti', desc: 'Bitkisel protein kaynakları', duration: '30 gün', calories: 1900, img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400' },
  ];

  const handleDietClick = (diet) => {
    if (!isPremium) setShowPremiumModal(true);
    else alert(`${diet.name} diyetine başladınız!`);
  };

  const handlePremiumSubscribe = async () => {
    try {
      await api.activatePremium();
      alert('🎉 Premium aktif oldu!');
      setShowPremiumModal(false);
      refreshUser();
    } catch (error) { alert('Hata oluştu.'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="p-2">←</button>
          <h1 className="text-xl font-bold">Diyetler</h1>
        </div>
        <button onClick={() => setShowPremiumModal(true)} className="px-4 py-2 bg-yellow-500 text-white rounded-full text-sm font-bold flex items-center gap-1">💎 Premium</button>
      </div>

      <div className="p-4">
        {isPremium && (
          <div className="bg-green-100 p-4 rounded-2xl mb-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <p className="text-green-700 font-medium">Premium üyesiniz! Tüm diyetlere erişime sahipsiniz.</p>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">⭐</span>
          <h2 className="text-xl font-bold">Premium Diyetler</h2>
          {!isPremium && <span className="bg-gray-200 px-2 py-1 rounded-full text-xs">🔒</span>}
        </div>

        <div className="space-y-4">
          {premiumDiets.map(diet => (
            <div key={diet.id} onClick={() => handleDietClick(diet)} className={`bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-lg transition-all ${!isPremium && 'opacity-70'}`}>
              <div className="relative h-40">
                <img src={diet.img} alt={diet.name} className="w-full h-full object-cover" />
                {!isPremium && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-4xl">🔒</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">⭐ Premium</div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg">{diet.name}</h3>
                <p className="text-gray-500 text-sm mb-2">{diet.desc}</p>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>📅 {diet.duration}</span>
                  <span>🔥 {diet.calories} kcal</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Diet */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">✏️</span>
            <h2 className="text-xl font-bold">Kişisel Diyet Oluştur</h2>
          </div>
          <div onClick={() => !isPremium ? setShowPremiumModal(true) : alert('Diyet oluşturma yakında!')} className={`bg-white rounded-2xl p-6 border-2 border-dashed cursor-pointer ${isPremium ? 'border-green-400' : 'border-gray-300 opacity-70'}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">{isPremium ? '➕' : '🔒'}</span>
              </div>
              <h3 className="font-bold">Yeni Diyet Planı</h3>
              <p className="text-gray-500 text-sm">{isPremium ? 'Kendi öğünlerinizi ve hedeflerinizi belirleyin' : 'Premium ile kilidi açın'}</p>
            </div>
          </div>
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
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    height: user?.height || '', weight: user?.weight || '', age: user?.age || '',
    gender: user?.gender || 'male', activity_level: user?.activity_level || 'moderate',
    water_goal: user?.water_goal || 2500, step_goal: user?.step_goal || 10000
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.updateProfile({ height: parseFloat(formData.height), weight: parseFloat(formData.weight), age: parseInt(formData.age), gender: formData.gender, activity_level: formData.activity_level });
      await api.updateGoals({ water_goal: parseInt(formData.water_goal), step_goal: parseInt(formData.step_goal) });
      await refreshUser();
      setEditing(false);
    } catch (error) { alert('Kaydedilemedi.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-green-500 text-white p-6 pb-20 rounded-b-3xl">
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
        {/* Theme Selector */}
        <div className="card mb-4">
          <ThemeSelector />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800">Kişisel Bilgiler</h3>
            {!editing ? <button onClick={() => setEditing(true)} className="text-green-500 font-medium">Düzenle</button>
              : <button onClick={() => setEditing(false)} className="text-gray-500">İptal</button>}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-600">Boy (cm)</label><input type="number" className="input-field" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} /></div>
                <div><label className="text-sm text-gray-600">Kilo (kg)</label><input type="number" className="input-field" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} /></div>
              </div>
              <div><label className="text-sm text-gray-600">Yaş</label><input type="number" className="input-field" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-600">Su Hedefi (ml)</label><input type="number" className="input-field" value={formData.water_goal} onChange={e => setFormData({...formData, water_goal: e.target.value})} /></div>
                <div><label className="text-sm text-gray-600">Adım Hedefi</label><input type="number" className="input-field" value={formData.step_goal} onChange={e => setFormData({...formData, step_goal: e.target.value})} /></div>
              </div>
              <button onClick={handleSave} className="btn-primary w-full" disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Boy</span><span className="font-medium">{user?.height || '-'} cm</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Kilo</span><span className="font-medium">{user?.weight || '-'} kg</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Yaş</span><span className="font-medium">{user?.age || '-'}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Kalori Hedefi</span><span className="font-medium">{user?.daily_calorie_goal || '-'} kcal</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Su Hedefi</span><span className="font-medium">{user?.water_goal || '-'} ml</span></div>
              <div className="flex justify-between py-2"><span className="text-gray-500">Adım Hedefi</span><span className="font-medium">{user?.step_goal?.toLocaleString() || '-'}</span></div>
            </div>
          )}
        </div>

        <button onClick={logout} className="w-full mt-4 p-4 bg-red-50 text-red-600 rounded-2xl font-medium hover:bg-red-100">Çıkış Yap</button>
      </div>

      <BottomNav />
    </div>
  );
};

// Tracking Page
const TrackingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [weeklyWater, setWeeklyWater] = useState([]);
  const [stepData, setStepData] = useState({ steps: 0 });
  const [manualSteps, setManualSteps] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [water, steps] = await Promise.all([api.getWeeklyWater(), api.getTodaySteps()]);
      setWeeklyWater(water);
      setStepData(steps);
    } catch (error) {} finally { setLoading(false); }
  };

  const handleAddSteps = async () => {
    if (!manualSteps) return;
    try { await api.addManualSteps(parseInt(manualSteps)); setStepData({ steps: parseInt(manualSteps) }); setManualSteps(''); } catch (error) {}
  };

  const stepGoal = user?.step_goal || 10000;

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 shadow-sm flex items-center gap-2">
        <button onClick={() => navigate('/')} className="p-2">←</button>
        <h1 className="text-xl font-bold">Takip</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><span className="text-3xl">👣</span><h2 className="text-xl font-bold">Adım Sayacı</h2></div>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <ProgressRing progress={Math.min((stepData.steps / stepGoal) * 100, 100)} size={160} strokeWidth={12} color="#FF9800" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{stepData.steps.toLocaleString()}</span>
                <span className="text-sm text-gray-500">/ {stepGoal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="number" className="input-field flex-1" placeholder="Manuel adım gir" value={manualSteps} onChange={e => setManualSteps(e.target.value)} />
            <button onClick={handleAddSteps} className="btn-primary px-6">Ekle</button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Haftalık Su Tüketimi</h2>
          <div className="flex items-end justify-between h-40 gap-2">
            {weeklyWater.map((day, i) => {
              const maxAmount = Math.max(...weeklyWater.map(d => d.amount), 1);
              const height = (day.amount / maxAmount) * 100;
              const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
              const dayIndex = new Date(day.date).getDay();
              const dayName = dayNames[dayIndex === 0 ? 6 : dayIndex - 1];
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-cyan-400 rounded-t-lg" style={{ height: `${Math.max(height, 5)}%` }}></div>
                  <span className="text-xs text-gray-500">{dayName}</span>
                  <span className="text-xs font-medium">{(day.amount / 1000).toFixed(1)}L</span>
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 flex justify-around">
      {navItems.map(item => (
        <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${location.pathname === item.path ? 'bg-green-50' : ''}`} style={{ color: location.pathname === item.path ? colors.primary : '#9ca3af' }}>
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

  if (isLoading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div></div>;
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
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
