const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API_URL = `${BACKEND_URL}/api`;

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('session_token', token);
  } else {
    localStorage.removeItem('session_token');
  }
};

export const getStoredToken = () => {
  return localStorage.getItem('session_token');
};

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = authToken || getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Auth
export const exchangeSession = async (sessionId) => {
  const response = await fetch(`${API_URL}/auth/session`, {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionId,
    },
  });
  if (!response.ok) throw new Error('Failed to exchange session');
  return response.json();
};

export const getMe = async () => {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get user');
  return response.json();
};

export const logout = async () => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to logout');
  return response.json();
};

export const registerUser = async (email, password, name) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Kayıt başarısız');
  }
  return response.json();
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Giriş başarısız');
  }
  return response.json();
};

export const guestLogin = async () => {
  const response = await fetch(`${API_URL}/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Misafir girişi başarısız');
  return response.json();
};

export const updateProfile = async (profileData) => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(profileData),
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return response.json();
};

export const updateGoals = async (goals) => {
  const response = await fetch(`${API_URL}/user/goals`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(goals),
  });
  if (!response.ok) throw new Error('Failed to update goals');
  return response.json();
};

// Food
export const analyzeFood = async (imageBase64) => {
  const response = await fetch(`${API_URL}/food/analyze`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
  if (!response.ok) throw new Error('Failed to analyze food');
  return response.json();
};

export const addMeal = async (mealData) => {
  const response = await fetch(`${API_URL}/food/add-meal`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(mealData),
  });
  if (!response.ok) throw new Error('Failed to add meal');
  return response.json();
};

export const getTodayMeals = async () => {
  const response = await fetch(`${API_URL}/food/today`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get meals');
  return response.json();
};

export const getDailySummary = async () => {
  const response = await fetch(`${API_URL}/food/daily-summary`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get daily summary');
  return response.json();
};

export const getFoodDatabase = async (lang = 'tr') => {
  const response = await fetch(`${API_URL}/food/database?lang=${lang}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get food database');
  return response.json();
};

// Water
export const addWater = async (amount) => {
  const response = await fetch(`${API_URL}/water/add`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount }),
  });
  if (!response.ok) throw new Error('Failed to add water');
  return response.json();
};

export const getTodayWater = async () => {
  const response = await fetch(`${API_URL}/water/today`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get water');
  return response.json();
};

export const getWeeklyWater = async () => {
  const response = await fetch(`${API_URL}/water/weekly`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get weekly water');
  return response.json();
};

// Steps
export const syncSteps = async (steps, source) => {
  const response = await fetch(`${API_URL}/steps/sync`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ steps, source }),
  });
  if (!response.ok) throw new Error('Failed to sync steps');
  return response.json();
};

export const getTodaySteps = async () => {
  const response = await fetch(`${API_URL}/steps/today`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get steps');
  return response.json();
};

export const addManualSteps = async (steps) => {
  const response = await fetch(`${API_URL}/steps/manual`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ steps }),
  });
  if (!response.ok) throw new Error('Failed to add steps');
  return response.json();
};

// Vitamins
export const getVitaminTemplates = async () => {
  const response = await fetch(`${API_URL}/vitamins/templates`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get vitamin templates');
  return response.json();
};

export const getUserVitamins = async () => {
  const response = await fetch(`${API_URL}/vitamins/user`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get user vitamins');
  return response.json();
};

export const addVitamin = async (name, time) => {
  const response = await fetch(`${API_URL}/vitamins/add`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, time }),
  });
  if (!response.ok) throw new Error('Failed to add vitamin');
  return response.json();
};

export const toggleVitamin = async (vitaminId) => {
  const response = await fetch(`${API_URL}/vitamins/toggle`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ vitamin_id: vitaminId }),
  });
  if (!response.ok) throw new Error('Failed to toggle vitamin');
  return response.json();
};

export const deleteVitamin = async (vitaminId) => {
  const response = await fetch(`${API_URL}/vitamins/${vitaminId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete vitamin');
  return response.json();
};

export const getTodayVitamins = async () => {
  const response = await fetch(`${API_URL}/vitamins/today`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get today vitamins');
  return response.json();
};

// Premium
export const activatePremium = async () => {
  const response = await fetch(`${API_URL}/premium/activate`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to activate premium');
  return response.json();
};

export const getPremiumStatus = async () => {
  const response = await fetch(`${API_URL}/premium/status`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get premium status');
  return response.json();
};

// Ads
export const watchAd = async (adCount = 1) => {
  const response = await fetch(`${API_URL}/ads/watch`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ad_count: adCount }),
  });
  if (!response.ok) throw new Error('Failed to record ad watch');
  return response.json();
};