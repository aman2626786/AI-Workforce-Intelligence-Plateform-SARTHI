'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquareHeart,
  Star,
  Mail,
  Copy,
  Check,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { feedbackService } from '@/services/feedbackService';

const CATEGORIES = [
  { id: 'Feature Request', label: '💡 Feature Request' },
  { id: 'Bug Report', label: '🐞 Bug Report' },
  { id: 'Platform Experience', label: '⭐ Experience' },
  { id: 'Resource Request', label: '📚 Resources' },
  { id: 'General Feedback', label: '💬 General' },
];

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];

export function FeedbackModal() {
  const { isFeedbackModalOpen, setIsFeedbackModalOpen, profile, addToast } = useApp();

  const [category, setCategory] = useState('Platform Experience');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const SUPPORT_EMAIL = 'aiworkforceintelligence@gmail.com';

  useEffect(() => {
    if (isFeedbackModalOpen && profile) {
      if (profile.name && !name) setName(profile.name);
      if (profile.email && !email) setEmail(profile.email);
    }
    if (!isFeedbackModalOpen) {
      // Reset success state after modal fully closes
      setTimeout(() => {
        setIsSuccess(false);
        setErrorMsg('');
      }, 300);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFeedbackModalOpen(false);
      }
    };

    if (isFeedbackModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFeedbackModalOpen, profile, setIsFeedbackModalOpen]);

  if (!isFeedbackModalOpen) return null;

  const handleCopyEmail = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(SUPPORT_EMAIL);
      setIsCopied(true);
      addToast('Support email copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Please enter your feedback message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await feedbackService.submitFeedback({
        category,
        rating,
        name: name.trim() || profile?.name || 'Anonymous User',
        email: email.trim() || profile?.email || '',
        message: message.trim(),
      });

      setIsSubmitting(false);
      setIsSuccess(true);
      setMessage('');
      addToast('Thank you! Your feedback has been recorded.', 'success');
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to submit feedback. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-fade-in font-sans"
      onClick={() => setIsFeedbackModalOpen(false)}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-sky-50/70 via-white to-indigo-50/50 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20 shrink-0">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Share Your Feedback
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Help us refine MatchSkill AI & workforce intelligence
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsFeedbackModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Direct Support & Connect Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-sky-50/90 to-blue-50/50 border border-sky-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white text-sky-600 flex items-center justify-center shadow-2xs shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Connect & Support</p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=MatchSkill%20Platform%20Support`}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline truncate block"
                  title="Send email to support"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-sky-200 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Email</span>
                </>
              )}
            </button>
          </div>

          {isSuccess ? (
            /* Success State */
            <div className="py-8 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200/80 shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="text-lg font-extrabold text-slate-900">Thank You For Your Feedback!</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Your feedback has been securely stored. Our engineering team reviews all student & community submissions to improve tools, recommendations, and analytics.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Back to Platform
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Category selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Feedback Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        category === cat.id
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs shadow-sky-600/20'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Experience Rating
                  </label>
                  <span className="text-xs font-extrabold text-amber-600">
                    {RATING_LABELS[hoverRating || rating]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                      aria-label={`${star} Stars`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Email in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aman Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Email <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 font-medium transition-all"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Your Thoughts & Feedback <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {message.length} / 1000
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your thoughts, suggestions, problems faced, or ideas for new features..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 font-medium transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
