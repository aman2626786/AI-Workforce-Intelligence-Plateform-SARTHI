import { auth, googleProvider, signInWithPopup, signOut } from '@/lib/firebase';
import { API_BASE_URL, setToken, getToken } from './api';

export interface AuthUserData {
  access_token: string;
  user_id: string;
  student_id?: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export const authService = {
  // 1. Google OAuth Sign-In via Firebase
  signInWithGoogle: async (): Promise<AuthUserData> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Exchange with Backend API
      const res = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || 'Student',
          firebase_uid: user.uid,
          photo_url: user.photoURL || undefined,
          id_token: idToken,
        }),
      });

      if (!res.ok) {
        // Fallback for offline/local standalone mode
        const fallbackData: AuthUserData = {
          access_token: 'sv_jwt_' + user.uid,
          user_id: user.uid,
          email: user.email || '',
          name: user.displayName || 'Student',
          avatar_url: user.photoURL || undefined,
        };
        setToken(fallbackData.access_token);
        authService.saveLocalUserSession(fallbackData);
        return fallbackData;
      }

      const data: AuthUserData = await res.json();
      setToken(data.access_token);
      authService.saveLocalUserSession(data);
      return data;
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      throw new Error(error.message || 'Google authentication failed');
    }
  },

  // 2. Email & Password Login
  loginWithEmail: async (email: string, password: string): Promise<AuthUserData> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid email or password' }));
      throw new Error(err.detail || 'Login failed. Please check your credentials.');
    }

    const data: AuthUserData = await res.json();
    setToken(data.access_token);
    authService.saveLocalUserSession(data);
    return data;
  },

  // 3. Email & Password Registration
  registerWithEmail: async (name: string, email: string, password: string, confirmPassword: string): Promise<AuthUserData> => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        confirm_password: confirmPassword,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }

    const data: AuthUserData = await res.json();
    setToken(data.access_token);
    authService.saveLocalUserSession(data);
    return data;
  },

  // 4. Logout User
  logout: async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore firebase signout error if not logged in through firebase
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('skillvantage_auth_token');
      localStorage.removeItem('skillvantage_user_session');
      localStorage.removeItem('skillvantage_user_profile');
    }
  },

  // 5. Save and Get Local User Session
  saveLocalUserSession: (data: AuthUserData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('skillvantage_user_session', JSON.stringify(data));
    }
  },

  getLocalUserSession: (): AuthUserData | null => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('skillvantage_user_session');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
    }
    return null;
  },

  getCurrentUser: (): AuthUserData | null => {
    return authService.getLocalUserSession();
  },

  isAuthenticated: (): boolean => {
    return !!getToken();
  }
};
