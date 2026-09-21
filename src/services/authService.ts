import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, FirebaseUser } from '@/lib/firebase';
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
      const code = popupError?.code || '';
      
      // User closed popup or cancelled: this is expected behavior, not a code crash
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        const cancelErr = new Error('Google sign-in was closed.');
        (cancelErr as any).code = 'auth/popup-closed-by-user';
        (cancelErr as any).isCancelled = true;
        throw cancelErr;
      }

      if (code === 'auth/popup-blocked') {
        const blockedErr = new Error('Google popup was blocked by your browser. Please allow popups for localhost or continue with Demo Access.');
        (blockedErr as any).code = 'auth/popup-blocked';
        throw blockedErr;
      }

      if (code === 'auth/unauthorized-domain') {
        const domainErr = new Error('Domain not authorized in Firebase. Please explore using Demo Access.');
        (domainErr as any).code = 'auth/unauthorized-domain';
        throw domainErr;
      }

      if (code === 'auth/network-request-failed') {
        const netErr = new Error('Network connection error during sign-in. Please check your internet connection.');
        (netErr as any).code = 'auth/network-request-failed';
        throw netErr;
      }

      console.warn('Google Auth notice:', popupError?.message || popupError);
      const generalErr = new Error(popupError?.message || 'Google authentication could not be completed. Please try again.');
      (generalErr as any).code = code;
      throw generalErr;
    }

    const user = result.user;
    let idToken = '';
    try {
      idToken = await user.getIdToken();
    } catch (e) {}

    // Synchronize user with live backend API (resilient with 3.5s timeout against cold-start)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || 'Student',
          firebase_uid: user.uid,
          photo_url: user.photoURL || undefined,
          id_token: idToken,
        }),
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || 'Server-side Firebase verification failed.');
      }
      const data: AuthUserData = await res.json();
      setToken(data.access_token);
      authService.saveLocalUserSession(data);
      return data;
    } catch (networkError) {
      console.warn('Backend sync delayed/offline, saving verified Firebase session locally:', networkError);
      const localData: AuthUserData = {
        access_token: idToken || `fb_${user.uid}`,
        user_id: user.uid,
        email: user.email || '',
        name: user.displayName || 'Student',
        avatar_url: user.photoURL || undefined,
      };
      setToken(localData.access_token);
      authService.saveLocalUserSession(localData);
      return localData;
    }
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

  // 4. Logout User (The ONLY place where user session is cleared)
  logout: async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore firebase signout error if not logged in through firebase
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('skillvantage_auth_token');
      localStorage.removeItem('matchskill_auth_token');
      localStorage.removeItem('skillvantage_user_session');
      localStorage.removeItem('skillvantage_auth_user');
      localStorage.removeItem('matchskill_auth_user');
      localStorage.removeItem('skillvantage_user_profile');
    }
  },

  // 5. Save and Get Local User Session
  saveLocalUserSession: (data: AuthUserData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('skillvantage_user_session', JSON.stringify(data));
      if (data.access_token) {
        setToken(data.access_token);
      }
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

  // Permanent persistence: checks token, local session, or Firebase active session
  isAuthenticated: (): boolean => {
    return Boolean(getToken() || authService.getLocalUserSession() || (auth && auth.currentUser));
  },

  // Auto-restore session listener from Firebase Auth (IndexedDB persistent layer)
  initAuthListener: (onUserChanged?: (user: AuthUserData | null) => void) => {
    if (typeof window === 'undefined') return () => {};
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const existingSession = authService.getLocalUserSession();
        const existingToken = getToken();
        if (!existingToken || !existingSession) {
          try {
            const idToken = await firebaseUser.getIdToken();
            const sessionData: AuthUserData = {
              access_token: idToken,
              user_id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Student',
              avatar_url: firebaseUser.photoURL || undefined,
            };
            setToken(idToken);
            authService.saveLocalUserSession(sessionData);
            if (onUserChanged) onUserChanged(sessionData);
          } catch (e) {
            console.warn('Auto session restore notice:', e);
          }
        }
      }
    });
  },

  // 6. Quick Demo Login (Instant Dashboard Preview)
  demoLogin: async (name = 'Alex Chen', email = 'alex.chen@student.edu'): Promise<AuthUserData> => {
    const demoSession: AuthUserData = {
      access_token: 'sv_demo_' + Date.now(),
      user_id: 'demo_user_1',
      email,
      name,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    };
    setToken(demoSession.access_token);
    authService.saveLocalUserSession(demoSession);
    return demoSession;
  }
};
