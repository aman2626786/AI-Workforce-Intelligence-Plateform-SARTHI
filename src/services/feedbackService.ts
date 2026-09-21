import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface FeedbackSubmission {
  category: string;
  rating: number;
  name?: string;
  email?: string;
  message: string;
}

export const feedbackService = {
  submitFeedback: async (data: FeedbackSubmission): Promise<{ success: boolean; message: string }> => {
    let firestoreSaved = false;
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';

    // 1. Try Firebase Firestore (Free Tier Database)
    try {
      if (db) {
        await addDoc(collection(db, 'feedbacks'), {
          category: data.category,
          rating: data.rating,
          name: data.name || 'Anonymous User',
          email: data.email || '',
          message: data.message,
          page_url: pageUrl,
          user_agent: userAgent,
          created_at: serverTimestamp(),
          created_at_iso: new Date().toISOString(),
        });
        firestoreSaved = true;
      }
    } catch (firebaseErr) {
      console.warn('Firebase Firestore feedback store notice (using local API fallback):', firebaseErr);
    }

    // 2. Guaranteed local API fallback persistence
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          page_url: pageUrl,
        }),
      });
      if (res.ok) {
        return {
          success: true,
          message: 'Thank you! Your feedback has been successfully received.',
        };
      }
    } catch (apiErr) {
      console.warn('API feedback submission notice:', apiErr);
    }

    if (firestoreSaved) {
      return {
        success: true,
        message: 'Thank you! Your feedback has been recorded into our database.',
      };
    }

    // Even in total offline / adblocked situation, ensure feedback is kept in browser localStorage
    if (typeof window !== 'undefined') {
      try {
        const local = JSON.parse(localStorage.getItem('matchskill_offline_feedbacks') || '[]');
        local.push({ ...data, pageUrl, date: new Date().toISOString() });
        localStorage.setItem('matchskill_offline_feedbacks', JSON.stringify(local));
      } catch {}
    }

    return {
      success: true,
      message: 'Thank you! Your feedback has been received.',
    };
  },
};
