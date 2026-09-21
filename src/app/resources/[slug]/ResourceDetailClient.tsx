'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { ShareModal } from '@/components/resources/ShareModal';
import { GuestLimitModal } from '@/components/resources/GuestLimitModal';
import { FormattedDocumentRenderer } from '@/components/resources/FormattedDocumentRenderer';
import { api, ResourceItem, ResourceCommentItem, getToken } from '@/services/api';
import { PLATFORM_CONFIG } from '@/components/resources/platformConfig';
import {
  ExternalLink,
  Bookmark,
  Heart,
  Share2,
  Calendar,
  Globe,
  User,
  ShieldCheck,
  ArrowLeft,
  MessageSquare,
  Send,
  RefreshCw,
  AlertCircle,
  Clock,
  Tag,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Award,
  Check,
  Compass,
  Type,
  FlaskConical,
  Newspaper,
  ArrowRight,
  X,
  Sparkles,
  Lock,
} from 'lucide-react';

interface ResourceDetailClientProps {
  slug: string;
}

export default function ResourceDetailClient({ slug }: ResourceDetailClientProps) {
  const router = useRouter();
  const commentsSectionRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);
  const techMatrixRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const practiceRef = useRef<HTMLDivElement>(null);

  const [resource, setResource] = useState<ResourceItem | null>(null);
  const [allResources, setAllResources] = useState<ResourceItem[]>([]);
  const [comments, setComments] = useState<ResourceCommentItem[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [commentAuthor, setCommentAuthor] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [commentSuccess, setCommentSuccess] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuestLimitReached, setIsGuestLimitReached] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveCount, setSaveCount] = useState<number>(0);
  const [isProcessingLike, setIsProcessingLike] = useState<boolean>(false);
  const [isProcessingSave, setIsProcessingSave] = useState<boolean>(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Authentication status & free article state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isFirstFreeArticle, setIsFirstFreeArticle] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalConfig, setAuthModalConfig] = useState<{
    title: string;
    description: string;
    badge: string;
  }>({
    title: 'Sign In to Read Full Article',
    description: 'Sign in with your account or create a free student account to access full in-depth analysis, key highlights, complete tech stack matrices, and join discussions.',
    badge: 'Member Access Required',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = getToken();
      const userIsLoggedIn = Boolean(token);
      setIsLoggedIn(userIsLoggedIn);

      if (!userIsLoggedIn) {
        // Track the first free article for guest users
        const freeSlugKey = 'matchskill_guest_free_slug';
        const existingFreeSlug = localStorage.getItem(freeSlugKey);

        if (!existingFreeSlug) {
          // This is the user's first article: grant complete free reading access without lock card
          localStorage.setItem(freeSlugKey, slug);
          setIsFirstFreeArticle(true);
        } else if (existingFreeSlug === slug) {
          // Returning to the same 1st article: still free
          setIsFirstFreeArticle(true);
        } else {
          // User shifted to the 2nd (or another) article as guest:
          // Gate content and prompt signup popup modal!
          setIsFirstFreeArticle(false);
          setAuthModalConfig({
            title: 'Sign In to Read Full Article',
            description: 'You’ve read your 1st free article! Sign in or create a free student account to continue reading unlimited research, view technology matrices, and join community discussions.',
            badge: '1 Free Article Completed',
          });
          setIsAuthModalOpen(true);
        }
      } else {
        setIsFirstFreeArticle(true);
      }
    }
  }, [slug]);

  const canReadFullArticle = isLoggedIn || isFirstFreeArticle;

  // Text size volume slider feature (range: 12px to 24px, default: 16px = 100%)
  const [fontSize, setFontSize] = useState<number>(16);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSize = localStorage.getItem('matchskill_reader_font_size_px');
      if (storedSize) {
        const val = Number(storedSize);
        if (!isNaN(val) && val >= 12 && val <= 24) {
          setFontSize(val);
        }
      }
    }
  }, []);

  const handleFontSizeChange = (size: number) => {
    const clamped = Math.max(12, Math.min(24, Math.round(size)));
    setFontSize(clamped);
    if (typeof window !== 'undefined') {
      localStorage.setItem('matchskill_reader_font_size_px', String(clamped));
    }
  };

  // Load resource & catalog
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const item = await api.getResourceBySlug(slug);
        setResource(item);
        const storedLike = typeof window !== 'undefined'
          ? localStorage.getItem(`matchskill_likes_${item.id}`) === 'true'
          : false;
        const initiallyLiked = Boolean(item.is_liked) || storedLike;
        setIsLiked(initiallyLiked);
        setLikeCount(Math.max(Number(item.like_count) || 0, initiallyLiked ? 1 : 0));
        setIsSaved(Boolean(item.is_saved));
        setSaveCount(item.save_count || 0);

        if (typeof window !== 'undefined') {
          const storedSave = localStorage.getItem(`matchskill_saved_${item.id}`);
          if (storedSave !== null) setIsSaved(storedSave === 'true');
        }

        const commList = await api.getResourceComments(item.id);
        setComments(commList);

        const catalog = await api.listResources({ page: 1, page_size: 50 });
        setAllResources(catalog.resources || []);
      } catch (err: any) {
        if (err.isGuestLimit || (err.message && err.message.includes('GUEST_LIMIT_REACHED'))) {
          setIsGuestLimitReached(true);
        } else {
          setErrorMsg(err.message || 'Failed to load resource.');
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [slug]);

  // Track user-marked read articles history
  const [readSlugs, setReadSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('matchskill_read_articles');
        if (stored) setReadSlugs(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const isMarkedRead = useMemo(() => {
    return Boolean(resource?.slug && readSlugs.includes(resource.slug));
  }, [resource?.slug, readSlugs]);

  const cleanSubtitle = useMemo(() => {
    if (!resource?.short_description) return '';
    const trimmed = resource.short_description.trim();
    if (trimmed.startsWith('#') || trimmed.toLowerCase() === 'summary' || trimmed.length < 15) return '';
    if (trimmed.toLowerCase() === resource.title.toLowerCase()) return '';
    return trimmed;
  }, [resource?.short_description, resource?.title]);

  const handleToggleRead = () => {
    if (!resource?.slug) return;
    if (!isLoggedIn) {
      setAuthModalConfig({
        title: 'Sign In to Track Reading Progress',
        description: 'Sign in or create a free student account to mark articles as read and track your reading series progress.',
        badge: 'Authentication Required',
      });
      setIsAuthModalOpen(true);
      return;
    }
    setReadSlugs((prev) => {
      const exists = prev.includes(resource.slug);
      const next = exists
        ? prev.filter((s) => s !== resource.slug)
        : [...prev, resource.slug];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('matchskill_read_articles', JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  };

  // Stable deterministic reading list: order NEVER jumps or re-sorts when switching between articles!
  const readingFeed = useMemo(() => {
    if (!allResources.length && !resource) return [];

    let list = [...allResources];
    if (resource && !list.some((r) => r.id === resource.id || r.slug === resource.slug)) {
      list.push(resource);
    }

    return list.sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at || 0).getTime();
      const dateB = new Date(b.published_at || b.created_at || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [allResources, resource]);

  // Active dropdown state for cross-category menu in top title bar
  const [activeNavDropdown, setActiveNavDropdown] = useState<'cat1' | 'cat2' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveNavDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveNavDropdown(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Determine current resource category type
  const currentCategoryType = useMemo(() => {
    if (!resource) return 'INDUSTRY_NEWS';
    const t = (resource.resource_type || '').toUpperCase();
    const c = (resource.category || '').toLowerCase();
    if (t === 'RESEARCH_PAPER' || c === 'research') return 'RESEARCH_PAPER';
    if (t === 'LEARNING_RESOURCE' || c === 'learning') return 'LEARNING_RESOURCE';
    return 'INDUSTRY_NEWS';
  }, [resource]);

  // Compute the 2 other categories dynamically based on what the user is currently reading
  const crossCategories = useMemo(() => {
    const getCategoryData = (typeKey: 'INDUSTRY_NEWS' | 'LEARNING_RESOURCE' | 'RESEARCH_PAPER') => {
      const filtered = allResources.filter((r) => {
        if (r.id === resource?.id || r.slug === resource?.slug) return false;
        const rt = (r.resource_type || '').toUpperCase();
        const rc = (r.category || '').toLowerCase();
        if (typeKey === 'RESEARCH_PAPER') {
          return rt === 'RESEARCH_PAPER' || rc === 'research';
        }
        if (typeKey === 'LEARNING_RESOURCE') {
          return rt === 'LEARNING_RESOURCE' || rc === 'learning';
        }
        // INDUSTRY_NEWS
        return rt === 'INDUSTRY_NEWS' || rt === 'TECH_UPDATE' || rc === 'technology' || rc === 'career' || rc === 'news';
      });

      // Score items that share skills or tags with current resource
      const currentSkills = new Set((resource?.skills || []).map((s) => s.toLowerCase()));
      const currentTags = new Set((resource?.tags || []).map((t) => t.toLowerCase()));

      filtered.sort((a, b) => {
        const aMatches =
          (a.skills || []).filter((s) => currentSkills.has(s.toLowerCase())).length +
          (a.tags || []).filter((t) => currentTags.has(t.toLowerCase())).length;
        const bMatches =
          (b.skills || []).filter((s) => currentSkills.has(s.toLowerCase())).length +
          (b.tags || []).filter((t) => currentTags.has(t.toLowerCase())).length;
        if (bMatches !== aMatches) return bMatches - aMatches;
        return (b.like_count || 0) - (a.like_count || 0);
      });

      // Gather relevant topics/tags from current article skills and top category articles
      const tagsSet = new Set<string>();
      (resource?.skills || []).forEach((s) => tagsSet.add(s));
      filtered.slice(0, 8).forEach((item) => {
        (item.skills || []).slice(0, 2).forEach((s) => tagsSet.add(s));
        (item.tags || []).slice(0, 2).forEach((t) => tagsSet.add(t));
      });

      return {
        items: filtered.slice(0, 4),
        totalCount: filtered.length,
        tags: Array.from(tagsSet).filter(Boolean).slice(0, 6),
      };
    };

    let cat1Key: 'INDUSTRY_NEWS' | 'LEARNING_RESOURCE' | 'RESEARCH_PAPER';
    let cat2Key: 'INDUSTRY_NEWS' | 'LEARNING_RESOURCE' | 'RESEARCH_PAPER';

    if (currentCategoryType === 'RESEARCH_PAPER') {
      cat1Key = 'INDUSTRY_NEWS';
      cat2Key = 'LEARNING_RESOURCE';
    } else if (currentCategoryType === 'LEARNING_RESOURCE') {
      cat1Key = 'INDUSTRY_NEWS';
      cat2Key = 'RESEARCH_PAPER';
    } else {
      // Default / Industry news reading -> show Learning Resources & Research Material
      cat1Key = 'LEARNING_RESOURCE';
      cat2Key = 'RESEARCH_PAPER';
    }

    const configs = {
      INDUSTRY_NEWS: {
        id: 'news' as const,
        label: 'Industry News',
        shortLabel: 'Industry News',
        badgeText: 'News & Trends',
        icon: Newspaper,
        accentColor: 'text-amber-600 bg-amber-50 border-amber-200',
        exploreUrl: '/resources?type=INDUSTRY_NEWS',
        typeQuery: 'INDUSTRY_NEWS',
        ...getCategoryData('INDUSTRY_NEWS'),
      },
      LEARNING_RESOURCE: {
        id: 'learning' as const,
        label: 'Learning Resources',
        shortLabel: 'Learning Resources',
        badgeText: 'Courses & Docs',
        icon: BookOpen,
        accentColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        exploreUrl: '/resources?type=LEARNING_RESOURCE',
        typeQuery: 'LEARNING_RESOURCE',
        ...getCategoryData('LEARNING_RESOURCE'),
      },
      RESEARCH_PAPER: {
        id: 'research' as const,
        label: 'Research Material',
        shortLabel: 'Research Material',
        badgeText: 'Papers & Labs',
        icon: FlaskConical,
        accentColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        exploreUrl: '/resources?type=RESEARCH_PAPER',
        typeQuery: 'RESEARCH_PAPER',
        ...getCategoryData('RESEARCH_PAPER'),
      },
    };

    return {
      cat1: configs[cat1Key],
      cat2: configs[cat2Key],
    };
  }, [allResources, resource, currentCategoryType]);

  // Handle Like
  const handleLike = async () => {
    if (!resource || isProcessingLike) return;
    if (!isLoggedIn) {
      setAuthModalConfig({
        title: 'Sign In to Like Resources',
        description: 'You need to be signed in to like resources and save your engagement history.',
        badge: 'Authentication Required',
      });
      setIsAuthModalOpen(true);
      return;
    }
    setIsProcessingLike(true);

    const prevLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await api.toggleLikeResource(resource.id, prevLiked);
      setIsLiked(res.liked);
      setLikeCount(Math.max(Number(res.like_count) || 0, res.liked ? 1 : 0));
    } catch {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setIsProcessingLike(false);
    }
  };

  // Handle Save
  const handleSave = async () => {
    if (!resource || isProcessingSave) return;
    if (!isLoggedIn) {
      setAuthModalConfig({
        title: 'Sign In to Save Resources',
        description: 'Sign in or create a free student account to bookmark resources into your personal dashboard library.',
        badge: 'Authentication Required',
      });
      setIsAuthModalOpen(true);
      return;
    }
    setIsProcessingSave(true);

    const prevSaved = isSaved;
    const prevCount = saveCount;

    setIsSaved(!prevSaved);
    setSaveCount(prevSaved ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await api.toggleSaveResource(resource.id, prevSaved);
      setIsSaved(res.saved);
      setSaveCount(res.save_count);
    } catch {
      setIsSaved(prevSaved);
      setSaveCount(prevCount);
    } finally {
      setIsProcessingSave(false);
    }
  };

  // Handle Share
  const handleQuickShare = () => {
    if (navigator.share && resource) {
      navigator
        .share({
          title: resource.title,
          text: resource.short_description,
          url: window.location.href,
        })
        .catch(() => setIsShareModalOpen(true));
    } else {
      setIsShareModalOpen(true);
    }
  };

  // Scroll to section
  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>, name: string) => {
    if (!canReadFullArticle && name !== 'overview' && name !== 'discussion') {
      setAuthModalConfig({
        title: 'Sign In to Read Full Article',
        description: 'Sign in or create a free student account to unlock key highlights, technology matrices, detailed analysis, and community discussions.',
        badge: 'Member Access Required',
      });
      setIsAuthModalOpen(true);
      return;
    }
    setActiveSection(name);
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle Post Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource || !commentText.trim()) return;

    if (!isLoggedIn) {
      setAuthModalConfig({
        title: 'Sign In to Post Comments',
        description: 'Join the community discussion and share peer insights by signing into your account.',
        badge: 'Authentication Required',
      });
      setIsAuthModalOpen(true);
      return;
    }

    setCommentError('');
    setIsSubmittingComment(true);
    try {
      const newComment = await api.addResourceComment(
        resource.id,
        commentText.trim()
      );
      // The displayed author comes from the authenticated account/profile.
      // Do not allow a free-text author field to replace the verified identity.
      setComments([newComment, ...comments]);
      setCommentText('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3500);
    } catch (err: any) {
      setCommentError(err.message || 'Failed to submit comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const isOwnComment = (comment: ResourceCommentItem) => {
    if (!isLoggedIn || typeof window === 'undefined') return false;
    try {
      const session = JSON.parse(localStorage.getItem('skillvantage_user_session') || '{}');
      return comment.user_id === session.user_id || comment.user_id === session.email || comment.user_id === 'current-user';
    } catch {
      return false;
    }
  };

  const handleDeleteOwnComment = async (comment: ResourceCommentItem) => {
    if (!resource || !isOwnComment(comment)) return;
    try {
      await api.deleteOwnResourceComment(comment.id, resource.id);
      setComments((current) => current.filter((item) => item.id !== comment.id));
      setCommentSuccess(false);
      setCommentError('Your comment was deleted.');
    } catch (error: any) {
      setCommentError(error.message || 'Unable to delete your comment.');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'RESEARCH_PAPER':
        return 'Research Paper';
      case 'LEARNING_RESOURCE':
        return 'Learning Resource';
      case 'TECH_UPDATE':
        return 'Tech Update';
      case 'OPPORTUNITY':
        return 'Opportunity';
      case 'INDUSTRY_NEWS':
      default:
        return 'Industry News';
    }
  };

  // Read time
  const readTimeMinutes = useMemo(() => {
    if (!resource) return 4;
    const wordCount = (
      (resource.short_description || '') +
      ' ' +
      (resource.content_summary || '') +
      ' ' +
      (resource.title || '')
    ).split(/\s+/).length;
    return Math.max(3, Math.ceil(wordCount / 35));
  }, [resource]);

  // Dynamic real-world technology/skills application matrix
  const technologyMatrix = useMemo(() => {
    if (!resource?.skills) return [];

    const applicationMap: Record<string, string> = {
      Python: 'Powers modern AI/ML pipelines, research simulation, and backend microservices.',
      'Machine Learning': 'Drives predictive intelligence, fraud detection, and recommendation systems.',
      Mathematics: 'Forms foundation for quantum error correction, crypto algorithms, and optimization.',
      'Data Analysis': 'Extracts business telemetry, user behavioral trends, and executive insights.',
      'Embedded Systems': 'Controls automotive ECUs, battery management, and smart IoT devices.',
      'C++': 'Executes high-frequency algorithmic trading, graphics kernels, and game engines.',
      Robotics: 'Powers autonomous warehouse rovers, robotic surgery, and sensor fusion.',
      Git: 'Enables collaborative enterprise code versioning, CI/CD, and open source auditing.',
      JavaScript: 'Renders dynamic web interfaces, browser applications, and Node.js microservices.',
      React: 'Powers high-performance reactive user experiences at Meta, Airbnb, and Netflix.',
      Docker: 'Packages containerized microservices for predictable, reproducible cloud deployments.',
      SQL: 'Queries petabyte-scale relational data warehouses across banking and enterprise.',
      PostgreSQL: 'Stores transactional records with ACID compliance, JSONB, and vector search.',
      FastAPI: 'Serves asynchronous REST APIs with automatic OpenAPI schema generation.',
      AWS: 'Hosts scalable hyperscale cloud infrastructure and distributed microservices.',
      Linux: 'Runs 95%+ of top 500 supercomputers and production cloud server backbones.',
    };

    return resource.skills.map((skill) => ({
      skill,
      application:
        applicationMap[skill] ||
        `Employed in modern enterprise infrastructure for scalable ${skill.toLowerCase()} implementations.`,
    }));
  }, [resource]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <LandingHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
          <p className="text-sm font-semibold text-slate-700">Loading learning resource...</p>
        </div>
      </div>
    );
  }

  // Guest limit
  if (isGuestLimitReached) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <LandingHeader />
        <GuestLimitModal isOpen={true} redirectUrl={`/resources/${slug}`} />
      </div>
    );
  }

  // Not found
  if (errorMsg || !resource) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <LandingHeader />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Resource Not Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {errorMsg || 'This resource could not be found or has been moved.'}
            </p>
            <Link
              href="/resources"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Resource Catalog</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = resource.published_at
    ? new Date(resource.published_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '12 Sep, 2026';

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/40 via-white to-sky-50/20 flex flex-col font-sans text-slate-900 selection:bg-sky-600 selection:text-white">
      <LandingHeader />

      {/* ========================================================
          1. GFG-STYLE TOP SUB-NAVIGATION STRIP WITH FONT SIZE CONTROLS
          ======================================================== */}
      <nav className="bg-slate-50/95 border-b border-slate-200 sticky top-16 z-30 shadow-2xs">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="flex items-center justify-between gap-3 sm:gap-4 py-2 sm:py-2.5">
            {/* Left: Dynamic Cross-Category Recommendation Dropdowns */}
            <div ref={dropdownRef} className="flex items-center gap-2 sm:gap-2.5 shrink-0 relative">
              {/* Category 1 Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveNavDropdown(activeNavDropdown === 'cat1' ? null : 'cat1')}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all cursor-pointer text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 border ${
                    activeNavDropdown === 'cat1'
                      ? 'bg-slate-100 text-slate-900 border-slate-300 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs'
                  }`}
                  aria-expanded={activeNavDropdown === 'cat1'}
                  aria-haspopup="true"
                  title={`Browse related ${crossCategories.cat1.label}`}
                >
                  <span>{crossCategories.cat1.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 ${
                      activeNavDropdown === 'cat1' ? 'rotate-180 text-slate-700' : ''
                    }`}
                  />
                </button>

                {/* Popover Card for Category 1 */}
                {activeNavDropdown === 'cat1' && (
                  <div className="fixed inset-x-3 top-[118px] sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 w-auto sm:w-[420px] max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl border border-slate-200 shadow-xl p-4 sm:p-5 z-50 text-slate-800 animate-in fade-in-50 zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {crossCategories.cat1.label}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                            {crossCategories.cat1.totalCount} Available
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Curated based on this topic
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveNavDropdown(null)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        aria-label="Close menu"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Related Topics */}
                    {crossCategories.cat1.tags.length > 0 && (
                      <div className="py-3 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-700 mb-2">
                          Related Topics
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {crossCategories.cat1.tags.map((tag) => (
                            <Link
                              key={tag}
                              href={`/resources?type=${crossCategories.cat1.typeQuery}&skill=${encodeURIComponent(tag)}`}
                              onClick={() => setActiveNavDropdown(null)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors"
                            >
                              <span>{tag}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Curated Recommendations */}
                    <div className="py-3 space-y-2">
                      <div className="text-xs font-bold text-slate-700">
                        Top Recommended Material
                      </div>
                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {crossCategories.cat1.items.length > 0 ? (
                          crossCategories.cat1.items.map((item) => (
                            <Link
                              key={item.id}
                              href={`/resources/${item.slug}`}
                              onClick={() => setActiveNavDropdown(null)}
                              className="block p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all group"
                            >
                              <h5 className="text-xs font-semibold text-slate-900 group-hover:text-sky-600 line-clamp-2 leading-snug">
                                {item.title}
                              </h5>
                              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                                <span className="font-medium text-slate-600 truncate max-w-[140px]">
                                  {item.publisher || item.source_name || 'MatchSkill'}
                                </span>
                                <span>•</span>
                                <span>{item.read_time_minutes || 5} min read</span>
                                {item.difficulty && (
                                  <>
                                    <span>•</span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                      {item.difficulty}
                                    </span>
                                  </>
                                )}
                              </div>
                            </Link>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic py-2">No direct matches found.</p>
                        )}
                      </div>
                    </div>

                    {/* Explore All Footer Link */}
                    <div className="pt-2 border-t border-slate-100">
                      <Link
                        href={crossCategories.cat1.exploreUrl}
                        onClick={() => setActiveNavDropdown(null)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all group"
                      >
                        <span>Explore all {crossCategories.cat1.label} ({crossCategories.cat1.totalCount} items)</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Category 2 Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveNavDropdown(activeNavDropdown === 'cat2' ? null : 'cat2')}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all cursor-pointer text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 border ${
                    activeNavDropdown === 'cat2'
                      ? 'bg-slate-100 text-slate-900 border-slate-300 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs'
                  }`}
                  aria-expanded={activeNavDropdown === 'cat2'}
                  aria-haspopup="true"
                  title={`Browse related ${crossCategories.cat2.label}`}
                >
                  <span>{crossCategories.cat2.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 ${
                      activeNavDropdown === 'cat2' ? 'rotate-180 text-slate-700' : ''
                    }`}
                  />
                </button>

                {/* Popover Card for Category 2 */}
                {activeNavDropdown === 'cat2' && (
                  <div className="fixed inset-x-3 top-[118px] sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 w-auto sm:w-[420px] max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl border border-slate-200 shadow-xl p-4 sm:p-5 z-50 text-slate-800 animate-in fade-in-50 zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {crossCategories.cat2.label}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                            {crossCategories.cat2.totalCount} Available
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Curated based on this topic
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveNavDropdown(null)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        aria-label="Close menu"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Related Topics */}
                    {crossCategories.cat2.tags.length > 0 && (
                      <div className="py-3 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-700 mb-2">
                          Related Topics
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {crossCategories.cat2.tags.map((tag) => (
                            <Link
                              key={tag}
                              href={`/resources?type=${crossCategories.cat2.typeQuery}&skill=${encodeURIComponent(tag)}`}
                              onClick={() => setActiveNavDropdown(null)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors"
                            >
                              <span>{tag}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Curated Recommendations */}
                    <div className="py-3 space-y-2">
                      <div className="text-xs font-bold text-slate-700">
                        Top Recommended Material
                      </div>
                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {crossCategories.cat2.items.length > 0 ? (
                          crossCategories.cat2.items.map((item) => (
                            <Link
                              key={item.id}
                              href={`/resources/${item.slug}`}
                              onClick={() => setActiveNavDropdown(null)}
                              className="block p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all group"
                            >
                              <h5 className="text-xs font-semibold text-slate-900 group-hover:text-sky-600 line-clamp-2 leading-snug">
                                {item.title}
                              </h5>
                              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                                <span className="font-medium text-slate-600 truncate max-w-[140px]">
                                  {item.publisher || item.source_name || 'MatchSkill'}
                                </span>
                                <span>•</span>
                                <span>{item.read_time_minutes || 5} min read</span>
                                {item.difficulty && (
                                  <>
                                    <span>•</span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                      {item.difficulty}
                                    </span>
                                  </>
                                )}
                              </div>
                            </Link>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic py-2">No direct matches found.</p>
                        )}
                      </div>
                    </div>

                    {/* Explore All Footer Link */}
                    <div className="pt-2 border-t border-slate-100">
                      <Link
                        href={crossCategories.cat2.exploreUrl}
                        onClick={() => setActiveNavDropdown(null)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all group"
                      >
                        <span>Explore all {crossCategories.cat2.label} ({crossCategories.cat2.totalCount} items)</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Volume-Style Text Size Slider Feature + Breadcrumb */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Volume Slider Widget */}
              <div
                className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs hover:border-sky-400 transition-all"
                title={`Text Size: ${fontSize}px (${Math.round((fontSize / 16) * 100)}%)`}
              >
                {/* Small indicator button - decrease font size */}
                <button
                  type="button"
                  onClick={() => handleFontSizeChange(fontSize - 2)}
                  className="text-xs font-bold text-slate-500 hover:text-sky-600 active:scale-95 select-none cursor-pointer px-1 py-0.5 rounded transition-all"
                  title="Decrease text size (A-)"
                >
                  A
                </button>

                {/* Range Volume Slider */}
                <input
                  type="range"
                  min="12"
                  max="24"
                  step="1"
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  className="w-16 sm:w-24 md:w-28 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 focus:outline-none"
                  aria-label="Text volume size slider"
                />

                {/* Big indicator button - increase font size */}
                <button
                  type="button"
                  onClick={() => handleFontSizeChange(fontSize + 2)}
                  className="text-sm font-bold text-slate-700 hover:text-sky-600 active:scale-95 select-none cursor-pointer px-1 py-0.5 rounded transition-all"
                  title="Increase text size (A+)"
                >
                  A
                </button>

                {/* Percentage readout pill with reset on click */}
                <button
                  type="button"
                  onClick={() => handleFontSizeChange(16)}
                  className="px-2 py-0.5 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold tracking-tight transition-colors cursor-pointer"
                  title="Click to reset text size to 100% (16px)"
                >
                  {Math.round((fontSize / 16) * 100)}%
                </button>
              </div>

              {/* Breadcrumb Trail */}
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Link href="/resources" className="hover:text-sky-600 font-semibold text-slate-600">
                  Resources
                </Link>
                <span>/</span>
                <span className="text-slate-600 font-semibold truncate max-w-[140px]">{resource.category}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ========================================================
          2. EXPANDED MAIN LAYOUT:
             MOBILE: NEWS ARTICLE FIRST (order-1), SUGGESTIONS AFTER (order-2)
             DESKTOP: CLEAN TOPIC INDEX ON LEFT, EXPANDED WIDE READING DOCUMENT ON RIGHT
          ======================================================== */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 sm:py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-10 items-start">
          {/* ========================================================
              LEFT COLUMN (DESKTOP) / BOTTOM SUGGESTIONS (MOBILE):
              GFG-STYLE TOPIC NAVIGATION & RELATED RECOMMENDATIONS
              ======================================================== */}
          <aside className="order-2 lg:order-1 w-full lg:w-[310px] xl:w-[340px] 2xl:w-[360px] shrink-0 lg:sticky lg:top-28 space-y-5 self-start max-h-none lg:max-h-[calc(100vh-8.5rem)] lg:overflow-y-auto pr-0 no-scrollbar">
            <div className="bg-white rounded-2xl border border-sky-100/90 shadow-sm p-5 space-y-5">
              {/* Module Outline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-sky-100/70">
                  <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Article Outline
                  </span>
                  <span className="text-xs text-slate-400 font-normal">5 Sections</span>
                </div>
                <div className="space-y-1 text-sm font-medium">
                  <button
                    onClick={() => scrollTo(overviewRef, 'overview')}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between group cursor-pointer transition-all border ${
                      activeSection === 'overview'
                        ? 'bg-sky-50 text-sky-700 font-semibold border-sky-200 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                          activeSection === 'overview'
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        1
                      </span>
                      <span className="truncate text-xs sm:text-sm">Executive Overview</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-all ${
                        activeSection === 'overview'
                          ? 'text-sky-600 translate-x-0.5'
                          : 'text-slate-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => scrollTo(analysisRef, 'analysis')}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between group cursor-pointer transition-all border ${
                      activeSection === 'analysis'
                        ? 'bg-sky-50 text-sky-700 font-semibold border-sky-200 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                          activeSection === 'analysis'
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        2
                      </span>
                      <span className="truncate text-xs sm:text-sm">Complete Document</span>
                    </div>
                    {!canReadFullArticle ? (
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 transition-all ${
                          activeSection === 'analysis'
                            ? 'text-sky-600 translate-x-0.5'
                            : 'text-slate-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5'
                        }`}
                      />
                    )}
                  </button>

                  <button
                    onClick={() => scrollTo(practiceRef, 'practice')}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between group cursor-pointer transition-all border ${
                      activeSection === 'practice'
                        ? 'bg-sky-50 text-sky-700 font-semibold border-sky-200 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                          activeSection === 'practice'
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        3
                      </span>
                      <span className="truncate text-xs sm:text-sm">Practice & Code Links</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-all ${
                        activeSection === 'practice'
                          ? 'text-sky-600 translate-x-0.5'
                          : 'text-slate-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => scrollTo(commentsSectionRef, 'discussion')}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between group cursor-pointer transition-all border ${
                      activeSection === 'discussion'
                        ? 'bg-sky-50 text-sky-700 font-semibold border-sky-200 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                          activeSection === 'discussion'
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        4
                      </span>
                      <span className="truncate text-xs sm:text-sm">Community Discussion</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                        {comments.length}
                      </span>
                      {!canReadFullArticle && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Stable Topic Reading Series */}
              <div className="space-y-3 pt-3 border-t border-sky-100/70">
                <div className="flex items-center justify-between pb-2 border-b border-sky-100/70">
                  <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Reading Series ({readingFeed.length})
                  </span>
                  <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                    {readSlugs.filter((s) => readingFeed.some((i) => i.slug === s)).length} / {readingFeed.length} Read
                  </span>
                </div>

                {/* Single unified reading list */}
                <div className="space-y-2 pt-1">
                  {readingFeed.map((item, idx) => {
                    const isCurrent = item.slug === resource.slug || item.id === resource.id;
                    const isRead = readSlugs.includes(item.slug);

                    if (isCurrent) {
                      return (
                        <div
                          key={item.id || item.slug}
                          className="p-3 rounded-xl bg-sky-50/80 border border-sky-200 text-slate-900 shadow-2xs space-y-1.5 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
                              </span>
                              Now Reading
                            </span>
                            <span className="text-xs font-semibold text-sky-700 bg-white px-2 py-0.5 rounded-md border border-sky-200">
                              #{idx + 1}
                            </span>
                          </div>

                          <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                            {item.title}
                          </div>

                          <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-normal pt-0.5">
                            <span className="text-slate-600 font-medium truncate max-w-[130px]">
                              {item.source_name || 'Official Source'}
                            </span>
                            {item.skills && item.skills.length > 0 && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-700 font-medium bg-white border border-sky-200 text-xs px-2 py-0.5 rounded-md">
                                  {item.skills[0]}
                                </span>
                              </>
                            )}
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-400">
                              {item.read_time_minutes || 4}m read
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id || item.slug}
                        onClick={() => router.push(`/resources/${item.slug}`)}
                        className={`p-2.5 rounded-xl transition-all cursor-pointer group space-y-1 border ${
                          isRead
                            ? 'bg-slate-50/70 hover:bg-slate-100/90 border-slate-200/60'
                            : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-400">
                            #{idx + 1}
                          </span>
                          <span className="text-xs text-slate-400">
                            {item.read_time_minutes || 4}m
                          </span>
                        </div>

                        <div
                          className={`text-xs sm:text-sm font-medium leading-snug line-clamp-2 transition-colors ${
                            isRead ? 'text-slate-500 group-hover:text-sky-600' : 'text-slate-700 group-hover:text-sky-600'
                          }`}
                        >
                          {item.title}
                        </div>

                        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-normal">
                          <span className="text-slate-600 font-medium truncate max-w-[130px]">
                            {item.source_name || 'Official Source'}
                          </span>
                          {item.skills && item.skills.length > 0 && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600 font-medium bg-slate-50 border border-slate-200 text-xs px-2 py-0.5 rounded-md">
                                {item.skills[0]}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* ========================================================
              EXPANDED CENTER READING AREA (PRIMARY CONTENT - ORDER 1 ON MOBILE)
              ======================================================== */}
          <main className="order-1 lg:order-2 flex-1 min-w-0 max-w-none bg-white rounded-2xl border border-sky-100/90 shadow-sm p-6 sm:p-8 space-y-6 w-full">
            {/* Title Section */}
            <div ref={overviewRef} className="space-y-3 pb-4 border-b border-slate-200/80">
              {resource.resource_type && (
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-md border border-sky-200 shadow-2xs">
                    {getTypeLabel(resource.resource_type)}
                  </span>
                </div>
              )}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-snug tracking-tight">
                {resource.title}
              </h1>

              {cleanSubtitle && (
                <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                  {cleanSubtitle}
                </p>
              )}

              {/* Single Clean Meta Bar (Matching outer page: Last Updated + Action Icons) */}
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 font-normal pt-1">
                <div className="flex items-center gap-2">
                  <span>Last Updated: {formattedDate}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">{resource.source_name || resource.source_domain || 'Official Source'}</span>
                  <span>•</span>
                  <span>~{readTimeMinutes} min read</span>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-2">
                  {/* Mark as Read Toggle */}
                  <button
                    onClick={handleToggleRead}
                    className={`p-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border text-xs font-semibold ${
                      isMarkedRead
                        ? 'text-sky-700 bg-sky-50 border-sky-300 shadow-2xs'
                        : 'text-slate-600 border-slate-200 hover:text-sky-700 hover:bg-slate-50'
                    }`}
                    title={isMarkedRead ? 'Click to unmark as read' : 'Click to mark as read'}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                        isMarkedRead ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-400 bg-white'
                      }`}
                    >
                      {isMarkedRead && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span>{isMarkedRead ? 'Read' : 'Mark as Read'}</span>
                  </button>

                  {/* Like */}
                  <button
                    onClick={handleLike}
                    disabled={isProcessingLike}
                    className={`p-1.5 px-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border ${
                      isLiked ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-600 border-slate-200 hover:text-rose-600 hover:bg-slate-50'
                    }`}
                    title="Like article"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
                    <span className="text-xs font-semibold">{likeCount}</span>
                  </button>

                  {/* Bookmark */}
                  <button
                    onClick={handleSave}
                    disabled={isProcessingSave}
                    className={`p-1.5 px-2.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer border ${
                      isSaved ? 'text-sky-600 bg-sky-50 border-sky-200' : 'text-slate-600 border-slate-200 hover:text-sky-600 hover:bg-slate-50'
                    }`}
                    title={isSaved ? 'Saved to Library' : 'Save'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-sky-600' : ''}`} />
                    <span className="text-xs font-semibold hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                  </button>

                  {/* Comments Jump */}
                  <button
                    onClick={() => scrollTo(commentsSectionRef, 'discussion')}
                    className="p-1.5 px-2.5 rounded-xl text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Jump to Comments"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{comments.length}</span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={handleQuickShare}
                    className="p-1.5 px-2.5 rounded-xl text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Attached Hashtags & Topic Pills Bar */}
              {((resource.tags && resource.tags.length > 0) || (resource.hashtags && resource.hashtags.length > 0)) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
                    <Tag className="w-3 h-3 text-sky-600" />
                    <span>Tags:</span>
                  </span>
                  {(resource.tags || resource.hashtags || []).map((tag) => {
                    const clean = tag.replace(/^#/, '');
                    return (
                      <Link
                        key={clean}
                        href={`/resources?tag=${encodeURIComponent(clean)}`}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 hover:text-sky-950 text-xs font-bold transition-all border border-sky-200 shadow-2xs hover:scale-105"
                      >
                        #{clean}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dynamic Scalable Reading Container (Controlled by Volume Slider) */}
            <div id="reading-content-container" style={{ fontSize: `${fontSize}px` }} className="space-y-6 transition-all duration-150">
              <style dangerouslySetInnerHTML={{ __html: `
                #reading-content-container {
                  font-size: ${fontSize}px !important;
                }
                #reading-content-container p,
                #reading-content-container ul,
                #reading-content-container ol,
                #reading-content-container li,
                #reading-content-container .reading-body-text,
                #reading-content-container .reading-lead {
                  font-size: ${fontSize}px !important;
                  line-height: 1.75 !important;
                }
                #reading-content-container h2 {
                  font-size: ${Math.round(fontSize * 1.25)}px !important;
                  line-height: 1.35 !important;
                }
                #reading-content-container h3 {
                  font-size: ${Math.round(fontSize * 1.15)}px !important;
                  line-height: 1.4 !important;
                }
                #reading-content-container .table-cell-text {
                  font-size: ${Math.max(12, Math.round(fontSize * 0.9))}px !important;
                  line-height: 1.6 !important;
                }
              `}} />

              {/* Detailed Content: Available when logged in or on first free article, else Gated Preview */}
              {canReadFullArticle ? (
                <>
                  {/* Primary Formatted Document Reader Body */}
                  <div ref={analysisRef} className="reading-body-text text-slate-800 leading-relaxed font-normal space-y-4">
                    <FormattedDocumentRenderer
                      content={(resource as any).content_markdown || resource.content_summary || (resource.short_description && resource.short_description.includes('\n') ? resource.short_description : '') || ''}
                      skipTitleAndSubtitle={true}
                    />
                  </div>

                  {/* Verified Practice & Official Reference Links Section */}
                  <div ref={practiceRef} className="pt-6 border-t border-slate-200/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Compass className="w-4.5 h-4.5 text-sky-600" />
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">
                            Verified Practice & Code Reference Links
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                            {((resource.attached_links && resource.attached_links.length > 0) ? resource.attached_links.length : (resource.original_url ? 1 : 0))} Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Practice code directly on verified platforms with official resources attached to this guide.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {resource.attached_links && resource.attached_links.length > 0 ? (
                        resource.attached_links.map((link) => {
                          const cfg = PLATFORM_CONFIG[link.platform] || PLATFORM_CONFIG.docs;
                          return (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-4 rounded-2xl bg-white border-2 border-sky-200/90 hover:border-sky-500 hover:shadow-md transition-all flex items-start justify-between gap-3.5 group cursor-pointer"
                            >
                              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                  {cfg.logoUrl ? (
                                    <img src={cfg.logoUrl} alt={cfg.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <Globe className="w-6 h-6 text-sky-600" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${cfg.badgeBg} ${cfg.badgeText} border-slate-200`}>
                                      {cfg.name}
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-600" /> Verified Link
                                    </span>
                                  </div>
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate group-hover:text-sky-600 transition-colors">
                                    {link.title}
                                  </h4>
                                  <div className="text-[11px] text-sky-600 font-semibold hover:underline truncate flex items-center gap-1">
                                    <span className="truncate">{link.url.replace(/^https?:\/\//, '')}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </div>
                                </div>
                              </div>
                            </a>
                          );
                        })
                      ) : resource.original_url ? (
                        <a
                          href={resource.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 rounded-2xl bg-white border-2 border-sky-200/90 hover:border-sky-500 hover:shadow-md transition-all flex items-start justify-between gap-3.5 group cursor-pointer"
                        >
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                              <Globe className="w-6 h-6 text-sky-600" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-sky-100 text-sky-800 border-slate-200">
                                  Official Reference / Web
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" /> Verified Source
                                </span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate group-hover:text-sky-600 transition-colors">
                                {resource.source_name || resource.title}
                              </h4>
                              <div className="text-[11px] text-sky-600 font-semibold hover:underline truncate flex items-center gap-1">
                                <span className="truncate">{resource.original_url.replace(/^https?:\/\//, '')}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </div>
                            </div>
                          </div>
                        </a>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 md:col-span-2">
                          No external practice links attached yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Community Discussion & Comments Section */}
                  <div ref={commentsSectionRef} className="pt-6 border-t border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4.5 h-4.5 text-sky-600" />
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          Community Discussion ({comments.length})
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400 font-normal">Constructive reviews & peer notes</span>
                    </div>

                    {/* Comment Form */}
                    <form onSubmit={handlePostComment} className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          placeholder="Your Name / Handle"
                          value={commentAuthor}
                          onChange={(e) => setCommentAuthor(e.target.value)}
                          className="w-full sm:w-56 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-normal text-slate-800"
                        />
                        <div className="text-xs text-slate-400 self-center">
                          Share your learning takeaways, project application, or interview notes
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add your constructive insights or review for peers..."
                        className="w-full p-3 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-normal"
                        maxLength={2000}
                      />

                      {commentError && (
                        <p className="text-xs font-semibold text-rose-600">{commentError}</p>
                      )}

                      {commentSuccess && (
                        <p className="text-xs font-semibold text-sky-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Comment submitted successfully!</span>
                        </p>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmittingComment || !commentText.trim()}
                          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-slate-900 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {isSubmittingComment ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Post Comment</span>
                        </button>
                      </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-3 pt-2">
                      {comments.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center font-normal">
                          No comments yet. Share your experience with this resource.
                        </p>
                      ) : (
                        comments.map((comm) => (
                          <div
                            key={comm.id}
                            className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900 text-xs sm:text-sm">{comm.user_name || 'Student'}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-normal">{new Date(comm.created_at).toLocaleDateString('en-GB')}</span>
                                {isOwnComment(comm) && <button type="button" onClick={() => handleDeleteOwnComment(comm)} className="text-[11px] font-semibold text-rose-600 hover:underline">Delete</button>}
                              </div>
                            </div>
                            <p className="text-slate-600 leading-relaxed font-normal text-xs sm:text-sm">{comm.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Premium Editorial Member Access Gate */
                <div className="relative pt-2">
                  {/* Article teaser with natural content and smooth fade-out */}
                  <div className="relative space-y-3 select-none pointer-events-none">
                    <div className="line-clamp-6 text-slate-700 leading-relaxed font-normal overflow-hidden max-h-48">
                      <FormattedDocumentRenderer
                        content={(resource as any).content_markdown || resource.content_summary || resource.short_description || ''}
                        skipTitleAndSubtitle={true}
                      />
                    </div>

                    {/* Gradient fade covering the bottom of teaser */}
                    <div className="h-24 bg-gradient-to-b from-transparent via-white/80 to-white -mt-12 relative z-10" />
                  </div>

                  {/* Guests may read comments; posting still requires authentication. */}
                  <div ref={commentsSectionRef} className="relative z-20 mb-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-bold text-slate-900">Community Discussion ({comments.length})</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalConfig({
                            title: 'Sign In to Comment',
                            description: 'Sign in to join the discussion and share your learning takeaways.',
                            badge: 'Authentication Required',
                          });
                          setIsAuthModalOpen(true);
                        }}
                        className="rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                      >
                        Login to comment
                      </button>
                    </div>
                    {comments.length === 0 ? (
                      <p className="py-3 text-center text-xs text-slate-400">No comments yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {comments.map((comm) => (
                          <div key={comm.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-900">{comm.user_name || 'Student'}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-400">{new Date(comm.created_at).toLocaleDateString('en-GB')}</span>
                                {isOwnComment(comm) && <button type="button" onClick={() => handleDeleteOwnComment(comm)} className="text-[11px] font-semibold text-rose-600 hover:underline">Delete</button>}
                              </div>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-600">{comm.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sleek Paywall Banner */}
                  <div className="relative z-20 -mt-8 rounded-2xl bg-gradient-to-b from-white via-sky-50/40 to-white border border-sky-200/80 p-6 sm:p-8 shadow-lg shadow-sky-600/5 text-center space-y-5">
                    {/* Badge & Lock Header */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
                      <Lock className="w-3.5 h-3.5 text-sky-600" />
                      <span>Full Article Requires Free Account</span>
                    </div>

                    {/* Headline & Explanation */}
                    <div className="space-y-2 max-w-xl mx-auto">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Continue reading with a free MatchSkill account
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                        Sign in to access the complete technical scope, technology & skill matrix, original source documentation, and student discussions.
                      </p>
                    </div>

                    {/* Value Checklist Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-1 text-xs text-slate-700 font-medium">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        <span>Complete In-Depth Analysis</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        <span>Skills & Technologies Matrix</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        <span>Direct Primary Research Links</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        <span>Bookmark & Community Discussions</span>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <Link
                        href={`/login?redirect=/resources/${slug}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm shadow-sky-600/20 whitespace-nowrap cursor-pointer"
                      >
                        <span>Login to Read Full Article</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <Link
                        href={`/signup?redirect=/resources/${slug}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs sm:text-sm font-semibold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
                      >
                        <span>Create Free Account</span>
                      </Link>
                    </div>

                    {/* Subtle Trust Note */}
                    <p className="text-[11px] text-slate-400 font-normal">
                      Free for students and engineers • Instant access in seconds
                    </p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ========================================================
          FOOTER / BOTTOM BAR: MATCHSKILL
          ======================================================== */}
      <footer className="py-10 bg-gradient-to-b from-sky-50/60 via-white to-sky-100/30 mt-auto border-t border-sky-200/90">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm shadow-sky-600/20">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-slate-900">MatchSkill</span>
              <p className="text-xs text-slate-500 font-medium">Real-Time Labor & Skill Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <Link href="/" className="hover:text-sky-700 transition-colors">Home</Link>
              <Link href="/resources" className="hover:text-sky-700 transition-colors">Resources</Link>
              <Link href="/#how-it-works" className="hover:text-sky-700 transition-colors">How It Works</Link>
            </nav>
            <span className="h-4 w-px bg-sky-200" />
            <p className="text-xs text-slate-500 font-medium">© 2026 MatchSkill. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        resource={resource}
      />

      {/* Guest Limit & Auth Requirement Modal */}
      <GuestLimitModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectUrl={`/resources/${slug}`}
        title={authModalConfig.title}
        description={authModalConfig.description}
        badge={authModalConfig.badge}
      />
    </div>
  );
}
