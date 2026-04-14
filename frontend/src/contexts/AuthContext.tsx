import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserResponseDTO, UserRole, UserStatus } from '../types/user.types';
import { userApi } from '../api/userApi';

const MAX_LOADING_TIME = 8000; // 8 seconds max loading time

// RBAC Permissions Configuration
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_VIEW', 'VIEW_AUDIT', 
    'MANAGE_ROLES', 'BULK_ACTIONS', 'EXPORT_DATA', 'SYSTEM_SETTINGS'
  ],
  [UserRole.AGENT]: [
    'CLIENT_CREATE', 'CLIENT_UPDATE', 'CLIENT_VIEW', 'VIEW_OWN_CLIENTS',
    'ADD_NOTES', 'VIEW_PERFORMANCE', 'PROCESS_APPLICATIONS'
  ],
  [UserRole.CLIENT]: [
    'PROFILE_VIEW', 'PROFILE_UPDATE', 'VIEW_OWN_DATA'
  ]
};

interface AuthContextType {
  currentUser: UserResponseDTO | null;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (formData: any) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Safety timeout
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.warn('[AuthContext] Safety timeout reached');
        setIsLoading(false);
      }
    }, MAX_LOADING_TIME);
    return () => clearTimeout(safetyTimer);
  }, [isLoading]);

  // Init Auth
  useEffect(() => {
    const initAuth = async () => {
      const actorId = localStorage.getItem('kredia_actor_id');
      const token = localStorage.getItem('kredia_token');
      
      if (!actorId || !token) {
        setIsLoading(false);
        return;
      }
      
      try {
        const user = await userApi.getById(Number(actorId), Number(actorId));
        setCurrentUser(user);
      } catch (err: any) {
        localStorage.removeItem('kredia_actor_id');
        localStorage.removeItem('kredia_token');
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleAuthSuccess = useCallback(async (token: string) => {
    localStorage.setItem('kredia_token', token);

    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decodedToken = JSON.parse(jsonPayload);
    const userId = Number(decodedToken.sub);
    const userRole = decodedToken.role;

    const user = await userApi.getById(userId, userId);
    setCurrentUser(user);

    localStorage.setItem('kredia_actor_id', String(userId));
    localStorage.setItem('kredia_role', userRole);
    localStorage.setItem('kredia_user_id', String(userId));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const authResponse = await userApi.login(email, password);
      await handleAuthSuccess(authResponse.token);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthSuccess]);

  const register = useCallback(async (formData: any) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await userApi.register(formData);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('kredia_actor_id');
    localStorage.removeItem('kredia_token');
    localStorage.removeItem('kredia_role');
    localStorage.removeItem('kredia_user_id');
    setCurrentUser(null);
    setAuthError(null);
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const googleIdentity = window.google?.accounts?.id;
      if (!googleIdentity) {
        throw new Error('Google Identity Services SDK is not loaded. Please refresh the page.');
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId || clientId.includes('YOUR_ACTUAL')) {
        throw new Error('Google Client ID is not configured. Please check your .env file.');
      }

      await new Promise<void>((resolve, reject) => {
        googleIdentity.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (!response?.credential) {
              reject(new Error('Google sign-in failed. Please try again.'));
              return;
            }

            try {
              const authResponse = await userApi.googleLogin(response.credential);
              await handleAuthSuccess(authResponse.token);
              resolve();
            } catch (error: any) {
              console.error('Google login backend error:', error);
              reject(new Error(error.message || 'Failed to authenticate with server'));
            }
          }
        });

        googleIdentity.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            reject(new Error('Google sign-in was cancelled. Please try again.'));
          }
        });
      });
    } catch (err: any) {
      console.error('Google login error:', err);
      setAuthError(err.message || 'Google login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGithub = async () => {
    setAuthError(null);
    window.location.href = 'http://localhost:8086/oauth2/authorization/github';
  };

  const hasRole = (role: UserRole) => currentUser?.role === role;

  const hasPermission = (permission: string) => {
    if (!currentUser) return false;
    return ROLE_PERMISSIONS[currentUser.role]?.includes(permission) || false;
  };

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isLoading, 
      authError,
      login, 
      register,
      logout,
      loginWithGoogle,
      loginWithGithub,
      hasRole,
      hasPermission,
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
