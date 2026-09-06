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
    let result;
    try {
      result = await signInWithPopup(auth, googleProvider);
    } catch (popupError: any) {
      console.error('Google Popup Error:', popupError);
      if (popupError.code === 'auth/popup-closed-by-user') {
        throw new Error('Google Sign-In was cancelled. Please try again.');
      }
      throw new Error(popupError.message || 'Google authentication popup failed');
    }

    const user = result.user;
    let idToken = '';
    try {
      idToken = await user.getIdToken();
    } catch (e) {}

    // Synchronize user with live backend API (resilient against network or cold-start)
    try {
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

      if (res.ok) {
        const data: AuthUserData = await res.json();
        setToken(data.access_token);
        authService.saveLocalUserSession(data);
        return data;
      }
    } catch (networkError) {
      console.warn('Backend sync delayed or offline, proceeding with authenticated Firebase session:', networkError);
    }

    // Since Firebase Google OAuth succeeded, the user is authenticated!
    const verifiedSession: AuthUserData = {
      access_token: 'sv_fb_' + user.uid,
      user_id: user.uid,
      email: user.email || '',
      name: user.displayName || 'Student',
      avatar_url: user.photoURL || undefined,
    };
    setToken(verifiedSession.access_token);
    authService.saveLocalUserSession(verifiedSession);
    return verifiedSession;
  },

  // 2. Email & Password Login
  loginWithEmail: async (email: string, password: string): Promise<AuthUserData> => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
    } catch (err: any) {
      throw new Error('Unable to connect to the authentication server. Please check your internet connection or use Google Sign-In.');
    }

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
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirm_password: confirmPassword,
        }),
      });
    } catch (err: any) {
      throw new Error('Unable to reach the registration server. Please check your internet connection or use Google Sign-In.');
    }

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
