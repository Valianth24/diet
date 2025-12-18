import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';
const API_URL = `${BACKEND_URL}/api`;

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const getHeaders = () => {
  const headers: any = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

// Auth
export const exchangeSession = async (sessionId: string) => {
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

export const updateProfile = async (profileData: any) => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(profileData),
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return response.json();
};

export const updateGoals = async (goals: any) => {
  const response = await fetch(`${API_URL}/user/goals`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(goals),
  });
  if (!response.ok) throw new Error('Failed to update goals');
  return response.json();
};

// Food
export const analyzeFood = async (imageBase64: string) => {
  const response = await fetch(`${API_URL}/food/analyze`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
  if (!response.ok) throw new Error('Failed to analyze food');
  return response.json();
};

export const addMeal = async (mealData: any) => {
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

export const getFoodDatabase = async (lang: string = 'tr') => {
  const response = await fetch(`${API_URL}/food/database?lang=${lang}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get food database');
  return response.json();
};

// Water
export const addWater = async (amount: number) => {
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
export const syncSteps = async (steps: number, source: string) => {
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

export const addManualSteps = async (steps: number) => {
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

export const addVitamin = async (name: string, time: string) => {
  const response = await fetch(`${API_URL}/vitamins/add`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, time }),
  });
  if (!response.ok) throw new Error('Failed to add vitamin');
  return response.json();
};

export const toggleVitamin = async (vitaminId: string) => {
  const response = await fetch(`${API_URL}/vitamins/toggle`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ vitamin_id: vitaminId }),
  });
  if (!response.ok) throw new Error('Failed to toggle vitamin');
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
export const watchAd = async (adCount: number = 1) => {
  const response = await fetch(`${API_URL}/ads/watch`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ad_count: adCount }),
  });
  if (!response.ok) throw new Error('Failed to record ad watch');
  return response.json();
};
