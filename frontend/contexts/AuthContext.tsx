import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { exchangeSession, getMe, logout as apiLogout, setAuthToken } from '../utils/api';
import { useStore } from '../store/useStore';

WebBrowser.maybeCompleteAuthSession();

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  needsOnboarding: boolean;
  setUser: (user: any) => void;
  setNeedsOnboarding: (needs: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => {},
  logout: async () => {},
  needsOnboarding: false,
  setUser: () => {},
  setNeedsOnboarding: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { user, setUser } = useStore();

  const checkExistingSession = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        setAuthToken(token);
        const userData = await getMe();
        setUser(userData);
        setIsAuthenticated(true);
        setNeedsOnboarding(false); // Skip onboarding
      } else {
        // Auto guest login - no login screen
        await autoGuestLogin();
      }
    } catch (error) {
      console.error('Error checking session:', error);
      await AsyncStorage.removeItem('session_token');
      setAuthToken(null);
      // Try auto guest login on error
      await autoGuestLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const autoGuestLogin = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.session_token);
        await AsyncStorage.setItem('session_token', data.session_token);
        setUser(data);
        setIsAuthenticated(true);
        setNeedsOnboarding(false); // Skip onboarding
      }
    } catch (error) {
      console.error('Auto guest login error:', error);
    }
  };

  useEffect(() => {
    checkExistingSession();
    
    // Handle web platform - check URL for session_id
    if (Platform.OS === 'web') {
      const currentUrl = window.location.href;
      if (currentUrl.includes('session_id=')) {
        handleAuthRedirect(currentUrl);
      }
    }
    
    // Handle deep links (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleAuthRedirect(url);
      }
    });
    
    // Handle deep links (hot link)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleAuthRedirect(url);
    });
    
    return () => {
      subscription.remove();
    };
  }, []);

  const handleAuthRedirect = async (url: string) => {
    try {
      // Check for error first
      if (url.includes('error=') || url.includes('detail')) {
        console.log('Auth error detected in URL, ignoring');
        return;
      }
      
      // Parse session_id from URL
      let sessionId = null;
      
      // Try hash first (#session_id=...)
      if (url.includes('#session_id=')) {
        sessionId = url.split('#session_id=')[1].split('&')[0];
      }
      // Try query param (?session_id=...)
      else if (url.includes('?session_id=')) {
        sessionId = url.split('?session_id=')[1].split('&')[0];
      }
      
      if (sessionId) {
        setIsLoading(true);
        
        // Exchange session_id for session_token
        const response = await exchangeSession(sessionId);
        const token = response.session_token;
        
        // Store token
        await AsyncStorage.setItem('session_token', token);
        setAuthToken(token);
        
        // Get user data
        const userData = await getMe();
        setUser(userData);
        setIsAuthenticated(true);
        
        // Check if needs onboarding
        if (!userData.height || !userData.weight || !userData.age || !userData.gender) {
          setNeedsOnboarding(true);
        } else {
          setNeedsOnboarding(false);
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error handling auth redirect:', error);
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      const redirectUrl = Platform.OS === 'web'
        ? `${BACKEND_URL}/`
        : Linking.createURL('/');
      
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      
      if (Platform.OS === 'web') {
        // Web: Just redirect
        window.location.href = authUrl;
      } else {
        // Mobile: Use WebBrowser
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
        
        if (result.type === 'success' && result.url) {
          await handleAuthRedirect(result.url);
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local session
      await AsyncStorage.removeItem('session_token');
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setNeedsOnboarding(false);
      
      // Redirect to Gmail logout
      const gmailLogoutUrl = 'https://mail.google.com/mail/u/0/?logout&hl=en';
      if (Platform.OS === 'web') {
        window.open(gmailLogoutUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(gmailLogoutUrl);
      }
    }
  };

  const handleSetUser = (userData: any) => {
    setUser(userData);
    if (userData) {
      setIsAuthenticated(true);
      if (!userData.height || !userData.weight || !userData.age || !userData.gender) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        needsOnboarding,
        setUser: handleSetUser,
        setNeedsOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
