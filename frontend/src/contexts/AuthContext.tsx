import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserResponseDTO } from '../types/user.types';
import { userApi } from '../api/userApi';

const MAX_LOADING_TIME = 8000; // 8 seconds max loading time

interface AuthContextType {
  currentUser: UserResponseDTO | null;
  isLoading: boolean;
  authError: string | null;
  login: (userId: number) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (formData: any) => Promise<void>;
  logout: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Safety timeout - force loading to false after max time
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.warn('[AuthContext] Safety timeout reached, forcing loading to false');
        setIsLoading(false);
        setAuthError('Loading timeout - backend may be unavailable');
      }
    }, MAX_LOADING_TIME);

    return () => clearTimeout(safetyTimer);
  }, [isLoading]);

  useEffect(() => {
    const initAuth = async () => {
      const actorId = localStorage.getItem('kredia_actor_id');
      const token = localStorage.getItem('kredia_token');
      
      if (!actorId || !token) {
        console.log('[AuthContext] No stored session or token, skipping auto-login');
        setIsLoading(false);
        return;
      }

      console.log('[AuthContext] Found stored session, verifying user ID:', actorId);
      
      try {
        // Fetch user profile - token will be added by interceptor
        const user = await userApi.getById(Number(actorId), Number(actorId));
        
        console.log('[AuthContext] Session valid, user:', user.email);
        setCurrentUser(user);
        setAuthError(null);
      } catch (err: any) {
        console.error('[AuthContext] Session verification failed:', err.message || err);
        localStorage.removeItem('kredia_actor_id');
        localStorage.removeItem('kredia_token');
        setCurrentUser(null);
        setAuthError(err.message || 'Session expired');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (userId: number) => {
    console.log('[AuthContext] Login attempt for ID:', userId);
    setIsLoading(true);
    setAuthError(null);
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout - backend not responding')), 5000)
      );
      
      const user = await Promise.race([
        userApi.getById(userId, userId),
        timeoutPromise
      ]) as UserResponseDTO;
      
      console.log('[AuthContext] Login success:', user.email, 'Role:', user.role);
      setCurrentUser(user);
      localStorage.setItem('kredia_actor_id', String(userId));
      setAuthError(null);
    } catch (err: any) {
      console.error('[AuthContext] Login failed:', err.message || err);
      setAuthError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    console.log('[AuthContext] Login attempt with email:', email);
    setIsLoading(true);
    setAuthError(null);
    
    try {
      // Get the JWT token
      const authResponse = await userApi.login(email, password);
      const token = authResponse.token; // Access token directly from data
      localStorage.setItem('kredia_token', token);
      
      // Parse the token to get the user ID
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decodedToken = JSON.parse(jsonPayload);
      const userId = Number(decodedToken.sub);
      
      // Fetch user profile
      const user = await userApi.getById(userId, userId);
      
      console.log('[AuthContext] Login success:', user.email, 'Role:', user.role);
      setCurrentUser(user);
      localStorage.setItem('kredia_actor_id', String(userId));
      setAuthError(null);
    } catch (err: any) {
      console.error('[AuthContext] Login failed:', err.message || err);
      setAuthError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (formData: any) => {
    console.log('[AuthContext] Register attempt:', formData.email);
    setIsLoading(true);
    setAuthError(null);
    try {
      await userApi.register(formData);
      console.log('[AuthContext] Register success');
    } catch (err: any) {
      console.error('[AuthContext] Register failed:', err.message || err);
      setAuthError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    console.log('[AuthContext] Logout');
    localStorage.removeItem('kredia_actor_id');
    localStorage.removeItem('kredia_token');
    setCurrentUser(null);
    setAuthError(null);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return (
      <AuthContext.Provider value={{ 
        currentUser, 
        isLoading, 
        authError,
        login, 
        loginWithEmail,
        register,
        logout,
        clearAuthError 
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
