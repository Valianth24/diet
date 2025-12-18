import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import * as api from './api';

// Auth Context
const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Set a maximum timeout for loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    const init = async () => {
      await checkExistingSession();
      await handleAuthRedirect();
      clearTimeout(timeout);
    };
    
    init();
    
    return () => clearTimeout(timeout);
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
          console.error('Failed to get user data:', err);
          api.setAuthToken(null);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      api.setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthRedirect = async () => {
    const url = window.location.href;
    let sessionId = null;

    if (url.includes('#session_id=')) {
      sessionId = url.split('#session_id=')[1].split('&')[0];
    } else if (url.includes('?session_id=')) {
      sessionId = url.split('?session_id=')[1].split('&')[0];
    }

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
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      api.setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Components
const ProgressRing = ({ progress, size = 80, strokeWidth = 8, color = '#4CAF50' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: offset,
          transition: 'stroke-dashoffset 0.5s ease'
        }}
      />
    </svg>
  );
};

// Login Page
const LoginPage = () => {
  const { login, isLoading, isAuthenticated } = useAuth();

  // If loading, show spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  // If already authenticated, redirect (handled by App routes)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">CalorieDiet</h1>
        <p className="text-gray-500 mb-8">Sağlıklı Yaşam için Diyet Takibi</p>
        
        <button
          onClick={login}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
          data-testid="google-login-btn"
        >
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
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    age: '',
    gender: 'male',
    activity_level: 'moderate'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile({
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        age: parseInt(formData.age),
        gender: formData.gender,
        activity_level: formData.activity_level
      });
      await refreshUser();
      navigate('/');
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Profil güncellenemedi. Lütfen tekrar deneyin.');
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
            <input
              type="number"
              className="input-field"
              value={formData.height}
              onChange={(e) => setFormData({...formData, height: e.target.value})}
              placeholder="170"
              required
              data-testid="height-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kilo (kg)</label>
            <input
              type="number"
              className="input-field"
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
              placeholder="70"
              required
              data-testid="weight-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yaş</label>
            <input
              type="number"
              className="input-field"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              placeholder="25"
              required
              data-testid="age-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cinsiyet</label>
            <div className="flex gap-4">
              <button
                type="button"
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  formData.gender === 'male' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => setFormData({...formData, gender: 'male'})}
                data-testid="gender-male"
              >
                Erkek
              </button>
              <button
                type="button"
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  formData.gender === 'female' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => setFormData({...formData, gender: 'female'})}
                data-testid="gender-female"
              >
                Kadın
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aktivite Seviyesi</label>
            <select
              className="input-field"
              value={formData.activity_level}
              onChange={(e) => setFormData({...formData, activity_level: e.target.value})}
              data-testid="activity-select"
            >
              <option value="sedentary">Hareketsiz</option>
              <option value="light">Hafif Aktif</option>
              <option value="moderate">Orta Aktif</option>
              <option value="active">Aktif</option>
              <option value="very_active">Çok Aktif</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="btn-primary w-full mt-6"
            disabled={loading}
            data-testid="save-profile-btn"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet ve Başla'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Dashboard Page
const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [dailySummary, setDailySummary] = useState({ total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 });
  const [waterData, setWaterData] = useState({ total_amount: 0 });
  const [stepData, setStepData] = useState({ steps: 0 });
  const [vitamins, setVitamins] = useState([]);
  const [recentMeals, setRecentMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [foodDatabase, setFoodDatabase] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('lunch');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summary, water, steps, meals, vitaminData] = await Promise.all([
        api.getDailySummary(),
        api.getTodayWater(),
        api.getTodaySteps(),
        api.getTodayMeals(),
        api.getTodayVitamins().catch(() => [])
      ]);
      setDailySummary(summary);
      setWaterData(water);
      setStepData(steps);
      setRecentMeals(meals.slice(0, 3));
      setVitamins(vitaminData);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFoodDatabase = async () => {
    try {
      const foods = await api.getFoodDatabase('tr');
      setFoodDatabase(foods);
    } catch (error) {
      console.error('Load food database error:', error);
    }
  };

  const handleAddWater = async () => {
    try {
      await api.addWater(250);
      setWaterData(prev => ({ ...prev, total_amount: prev.total_amount + 250 }));
    } catch (error) {
      console.error('Add water error:', error);
    }
  };

  const handleAddMeal = async (food) => {
    try {
      await api.addMeal({
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        image_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        meal_type: selectedMealType
      });
      setShowAddMealModal(false);
      loadData();
    } catch (error) {
      console.error('Add meal error:', error);
      alert('Yemek eklenemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleToggleVitamin = async (vitaminId) => {
    try {
      await api.toggleVitamin(vitaminId);
      setVitamins(prev => prev.map(v => 
        v.vitamin_id === vitaminId ? { ...v, is_taken: !v.is_taken } : v
      ));
    } catch (error) {
      console.error('Toggle vitamin error:', error);
    }
  };

  const calorieGoal = user?.daily_calorie_goal || 2000;
  const waterGoal = user?.water_goal || 2500;
  const stepGoal = user?.step_goal || 10000;
  const calorieProgress = Math.min((dailySummary.total_calories / calorieGoal) * 100, 100);
  const waterProgress = Math.min((waterData.total_amount / waterGoal) * 100, 100);
  const stepProgress = Math.min((stepData.steps / stepGoal) * 100, 100);

  const filteredFoods = foodDatabase.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold">{user?.name?.[0]}</span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-gray-800">Merhaba {user?.name?.split(' ')[0]} 👋</h1>
              <p className="text-sm text-gray-500">Bugün nasılsın?</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-gray-100 rounded-full"
            data-testid="profile-btn"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Bar */}
        <div className="bg-white rounded-2xl p-4 flex justify-around shadow-sm" data-testid="summary-bar">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className="font-semibold">{dailySummary.total_calories} kcal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💧</span>
            <span className="font-semibold">{(waterData.total_amount / 1000).toFixed(1)} L</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👣</span>
            <span className="font-semibold">{stepData.steps.toLocaleString()}</span>
          </div>
        </div>

        {/* Calorie Card */}
        <div className="card" data-testid="calorie-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Günlük Kalori</h2>
            <span className="text-sm text-gray-500">{calorieGoal - dailySummary.total_calories} kalan</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <ProgressRing progress={calorieProgress} size={100} strokeWidth={10} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{Math.round(calorieProgress)}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Protein</span>
                <span className="font-medium">{dailySummary.total_protein.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Karbonhidrat</span>
                <span className="font-medium">{dailySummary.total_carbs.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Yağ</span>
                <span className="font-medium">{dailySummary.total_fat.toFixed(1)}g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Water & Steps */}
        <div className="grid grid-cols-2 gap-4">
          {/* Water Card */}
          <div className="card" data-testid="water-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💧</span>
              <h3 className="font-bold text-gray-800">Su</h3>
            </div>
            <div className="relative mb-3">
              <ProgressRing progress={waterProgress} size={80} strokeWidth={8} color="#26C6DA" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{Math.round(waterProgress)}%</span>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 mb-2">
              {waterData.total_amount} / {waterGoal} ml
            </p>
            <button
              onClick={handleAddWater}
              className="w-full bg-cyan-50 text-cyan-600 py-2 rounded-xl font-medium hover:bg-cyan-100 transition-all"
              data-testid="add-water-btn"
            >
              +250 ml
            </button>
          </div>

          {/* Steps Card */}
          <div className="card" data-testid="steps-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">👣</span>
              <h3 className="font-bold text-gray-800">Adım</h3>
            </div>
            <div className="relative mb-3">
              <ProgressRing progress={stepProgress} size={80} strokeWidth={8} color="#FF9800" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{Math.round(stepProgress)}%</span>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 mb-2">
              {stepData.steps.toLocaleString()} / {stepGoal.toLocaleString()}
            </p>
            <button
              onClick={() => navigate('/tracking')}
              className="w-full bg-orange-50 text-orange-600 py-2 rounded-xl font-medium hover:bg-orange-100 transition-all"
              data-testid="view-steps-btn"
            >
              Detaylar
            </button>
          </div>
        </div>

        {/* Vitamins */}
        {vitamins.length > 0 && (
          <div className="card" data-testid="vitamins-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💊</span>
                <h3 className="font-bold text-gray-800">Vitaminler</h3>
              </div>
              <span className="text-sm text-gray-500">
                {vitamins.filter(v => v.is_taken).length}/{vitamins.length}
              </span>
            </div>
            <div className="space-y-2">
              {vitamins.map(vitamin => (
                <div
                  key={vitamin.vitamin_id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    vitamin.is_taken ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-800">{vitamin.name}</p>
                    <p className="text-xs text-gray-500">{vitamin.time}</p>
                  </div>
                  <button
                    onClick={() => handleToggleVitamin(vitamin.vitamin_id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      vitamin.is_taken ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                    data-testid={`vitamin-toggle-${vitamin.vitamin_id}`}
                  >
                    {vitamin.is_taken ? '✓' : ''}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Meals */}
        {recentMeals.length > 0 && (
          <div className="card" data-testid="recent-meals">
            <h3 className="font-bold text-gray-800 mb-4">Son Yemekler</h3>
            <div className="space-y-3">
              {recentMeals.map(meal => (
                <div key={meal.meal_id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🍽️</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 truncate">{meal.name}</p>
                    <p className="text-sm text-gray-500">{meal.calories} kcal</p>
                  </div>
                  <span className="text-green-500">✓</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Meal Card */}
        <div 
          className="card bg-gradient-to-r from-green-400 to-green-500 text-white cursor-pointer hover:shadow-lg transition-all"
          onClick={() => {
            setShowAddMealModal(true);
            loadFoodDatabase();
          }}
          data-testid="add-meal-card"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">Yemek Ekle</h3>
              <p className="text-white/80 text-sm">Günlük öğünlerini kaydet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Meal Modal */}
      {showAddMealModal && (
        <div className="modal-overlay" onClick={() => setShowAddMealModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Hızlı Ekle</h2>
              <button 
                onClick={() => setShowAddMealModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Meal Type Selection */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Öğün Seç</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'breakfast', icon: '🌅', label: 'Kahvaltı' },
                  { key: 'lunch', icon: '🌞', label: 'Öğle' },
                  { key: 'dinner', icon: '🌙', label: 'Akşam' },
                  { key: 'snack', icon: '☕', label: 'Ara Öğün' }
                ].map(type => (
                  <button
                    key={type.key}
                    className={`p-3 rounded-xl text-center transition-all ${
                      selectedMealType === type.key
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setSelectedMealType(type.key)}
                  >
                    <span className="text-xl">{type.icon}</span>
                    <p className="text-xs mt-1">{type.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <input
              type="text"
              className="input-field mb-4"
              placeholder="Yemek ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              data-testid="food-search-input"
            />

            {/* Food List */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredFoods.map(food => (
                <div
                  key={food.food_id}
                  className="p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all"
                  onClick={() => handleAddMeal(food)}
                  data-testid={`food-item-${food.food_id}`}
                >
                  <p className="font-medium text-gray-800">{food.name}</p>
                  <p className="text-sm text-gray-500">
                    {food.calories} kcal • P: {food.protein}g • K: {food.carbs}g • Y: {food.fat}g
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
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
    height: user?.height || '',
    weight: user?.weight || '',
    age: user?.age || '',
    gender: user?.gender || 'male',
    activity_level: user?.activity_level || 'moderate',
    water_goal: user?.water_goal || 2500,
    step_goal: user?.step_goal || 10000
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.updateProfile({
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        age: parseInt(formData.age),
        gender: formData.gender,
        activity_level: formData.activity_level
      });
      await api.updateGoals({
        water_goal: parseInt(formData.water_goal),
        step_goal: parseInt(formData.step_goal)
      });
      await refreshUser();
      setEditing(false);
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Profil kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-6 pb-20 rounded-b-3xl">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Profil</h1>
        </div>
        
        <div className="flex flex-col items-center">
          {user?.picture ? (
            <img src={user.picture} alt="" className="w-24 h-24 rounded-full border-4 border-white shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white">
              <span className="text-4xl font-bold">{user?.name?.[0]}</span>
            </div>
          )}
          <h2 className="text-xl font-bold mt-4">{user?.name}</h2>
          <p className="text-white/80">{user?.email}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-12">
        <div className="card" data-testid="profile-form">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800">Kişisel Bilgiler</h3>
            {!editing ? (
              <button 
                onClick={() => setEditing(true)}
                className="text-primary font-medium"
                data-testid="edit-profile-btn"
              >
                Düzenle
              </button>
            ) : (
              <button 
                onClick={() => setEditing(false)}
                className="text-gray-500 font-medium"
              >
                İptal
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Boy (cm)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.height}
                    onChange={e => setFormData({...formData, height: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kilo (kg)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.weight}
                    onChange={e => setFormData({...formData, weight: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yaş</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.age}
                  onChange={e => setFormData({...formData, age: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aktivite Seviyesi</label>
                <select
                  className="input-field"
                  value={formData.activity_level}
                  onChange={e => setFormData({...formData, activity_level: e.target.value})}
                >
                  <option value="sedentary">Hareketsiz</option>
                  <option value="light">Hafif Aktif</option>
                  <option value="moderate">Orta Aktif</option>
                  <option value="active">Aktif</option>
                  <option value="very_active">Çok Aktif</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Su Hedefi (ml)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.water_goal}
                    onChange={e => setFormData({...formData, water_goal: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adım Hedefi</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.step_goal}
                    onChange={e => setFormData({...formData, step_goal: e.target.value})}
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                className="btn-primary w-full"
                disabled={loading}
                data-testid="save-changes-btn"
              >
                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Boy</span>
                <span className="font-medium">{user?.height || '-'} cm</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Kilo</span>
                <span className="font-medium">{user?.weight || '-'} kg</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Yaş</span>
                <span className="font-medium">{user?.age || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Günlük Kalori Hedefi</span>
                <span className="font-medium">{user?.daily_calorie_goal || '-'} kcal</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Su Hedefi</span>
                <span className="font-medium">{user?.water_goal || '-'} ml</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Adım Hedefi</span>
                <span className="font-medium">{user?.step_goal?.toLocaleString() || '-'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full mt-4 p-4 bg-red-50 text-red-600 rounded-2xl font-medium hover:bg-red-100 transition-all"
          data-testid="logout-btn"
        >
          Çıkış Yap
        </button>
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [water, steps] = await Promise.all([
        api.getWeeklyWater(),
        api.getTodaySteps()
      ]);
      setWeeklyWater(water);
      setStepData(steps);
    } catch (error) {
      console.error('Load tracking data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddManualSteps = async () => {
    if (!manualSteps) return;
    try {
      await api.addManualSteps(parseInt(manualSteps));
      setStepData({ steps: parseInt(manualSteps) });
      setManualSteps('');
    } catch (error) {
      console.error('Add steps error:', error);
    }
  };

  const stepGoal = user?.step_goal || 10000;
  const stepProgress = Math.min((stepData.steps / stepGoal) * 100, 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Takip</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Steps Card */}
        <div className="card" data-testid="steps-detail-card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl">👣</span>
            <h2 className="text-xl font-bold text-gray-800">Adım Sayacı</h2>
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <ProgressRing progress={stepProgress} size={160} strokeWidth={12} color="#FF9800" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">{stepData.steps.toLocaleString()}</span>
                <span className="text-sm text-gray-500">/ {stepGoal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              className="input-field flex-1"
              placeholder="Manuel adım gir"
              value={manualSteps}
              onChange={e => setManualSteps(e.target.value)}
              data-testid="manual-steps-input"
            />
            <button
              onClick={handleAddManualSteps}
              className="btn-primary px-6"
              data-testid="add-steps-btn"
            >
              Ekle
            </button>
          </div>
        </div>

        {/* Weekly Water Chart */}
        <div className="card" data-testid="weekly-water-chart">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Haftalık Su Tüketimi</h2>
          <div className="flex items-end justify-between h-40 gap-2">
            {weeklyWater.map((day, index) => {
              const maxAmount = Math.max(...weeklyWater.map(d => d.amount), 1);
              const height = (day.amount / maxAmount) * 100;
              const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
              const dayIndex = new Date(day.date).getDay();
              const dayName = dayNames[dayIndex === 0 ? 6 : dayIndex - 1];
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-cyan-400 rounded-t-lg transition-all duration-500"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
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

// Vitamins Page
const VitaminsPage = () => {
  const navigate = useNavigate();
  const [vitamins, setVitamins] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVitamin, setNewVitamin] = useState({ name: '', time: 'Her Sabah' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userVitamins, vitaminTemplates] = await Promise.all([
        api.getTodayVitamins(),
        api.getVitaminTemplates()
      ]);
      setVitamins(userVitamins);
      setTemplates(vitaminTemplates);
    } catch (error) {
      console.error('Load vitamins error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (vitaminId) => {
    try {
      await api.toggleVitamin(vitaminId);
      setVitamins(prev => prev.map(v => 
        v.vitamin_id === vitaminId ? { ...v, is_taken: !v.is_taken } : v
      ));
    } catch (error) {
      console.error('Toggle vitamin error:', error);
    }
  };

  const handleAddVitamin = async () => {
    if (!newVitamin.name) return;
    try {
      const added = await api.addVitamin(newVitamin.name, newVitamin.time);
      setVitamins(prev => [...prev, added]);
      setShowAddModal(false);
      setNewVitamin({ name: '', time: 'Her Sabah' });
    } catch (error) {
      console.error('Add vitamin error:', error);
    }
  };

  const handleAddFromTemplate = async (template) => {
    try {
      const added = await api.addVitamin(template.name, template.default_time);
      setVitamins(prev => [...prev, added]);
    } catch (error) {
      console.error('Add vitamin from template error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">Vitaminler</h1>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-2 bg-primary text-white rounded-full"
            data-testid="add-vitamin-btn"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* User Vitamins */}
        <div className="card" data-testid="user-vitamins">
          <h2 className="font-bold text-gray-800 mb-4">Bugünkü Vitaminlerim</h2>
          {vitamins.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Henüz vitamin eklemediniz</p>
          ) : (
            <div className="space-y-2">
              {vitamins.map(vitamin => (
                <div
                  key={vitamin.vitamin_id}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    vitamin.is_taken ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💊</span>
                    <div>
                      <p className="font-medium text-gray-800">{vitamin.name}</p>
                      <p className="text-sm text-gray-500">{vitamin.time}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(vitamin.vitamin_id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      vitamin.is_taken 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                  >
                    {vitamin.is_taken ? '✓' : ''}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Templates */}
        <div className="card" data-testid="vitamin-templates">
          <h2 className="font-bold text-gray-800 mb-4">Önerilen Vitaminler</h2>
          <div className="space-y-2">
            {templates.map(template => (
              <div
                key={template.vitamin_id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💊</span>
                  <div>
                    <p className="font-medium text-gray-800">{template.name}</p>
                    <p className="text-sm text-gray-500">{template.default_time}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAddFromTemplate(template)}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-all"
                >
                  Ekle
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Vitamin Ekle</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vitamin Adı</label>
                <input
                  type="text"
                  className="input-field"
                  value={newVitamin.name}
                  onChange={e => setNewVitamin({...newVitamin, name: e.target.value})}
                  placeholder="Örn: B12 Vitamini"
                  data-testid="vitamin-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alım Zamanı</label>
                <select
                  className="input-field"
                  value={newVitamin.time}
                  onChange={e => setNewVitamin({...newVitamin, time: e.target.value})}
                >
                  <option value="Her Sabah">Her Sabah</option>
                  <option value="Öğle Yemeği">Öğle Yemeği</option>
                  <option value="Akşam Yemeği">Akşam Yemeği</option>
                  <option value="Yatmadan Önce">Yatmadan Önce</option>
                </select>
              </div>
              <button
                onClick={handleAddVitamin}
                className="btn-primary w-full"
                data-testid="confirm-add-vitamin"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

// Bottom Navigation
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: '🏠', label: 'Ana Sayfa' },
    { path: '/tracking', icon: '📊', label: 'Takip' },
    { path: '/vitamins', icon: '💊', label: 'Vitamin' },
    { path: '/profile', icon: '👤', label: 'Profil' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around">
      {navItems.map(item => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
        >
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check if user needs onboarding
  if (!user?.height || !user?.weight || !user?.age || !user?.gender) {
    return <Navigate to="/onboarding" />;
  }

  return children;
};

// Main App
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
          <Route path="/vitamins" element={<ProtectedRoute><VitaminsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
