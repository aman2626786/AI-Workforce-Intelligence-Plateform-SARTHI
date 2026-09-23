import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { api } from '@/services/api';
import { BrandLogo } from '@/components/brand/BrandLogo';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  MapPin,
  Briefcase,
  Settings,
  LogOut,
  User,
  Compass,
  BookOpen,
  Bookmark,
  CheckCheck,
  TrendingUp,
  FileCheck2,
  Clock,
  ExternalLink,
  ChevronRight,
  Heart,
  MessageSquare,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  type: string;
  href: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Emerging Skill Signal',
    description: 'Demand for LangChain & Agentic AI rose +34% in Bengaluru tech hiring this week.',
    timestamp: '15m ago',
    unread: true,
    type: 'signal',
    href: '/dashboard/industry-skills',
  },
  {
    id: '2',
    title: 'Readiness Score Updated',
    description: 'Your verified skills boosted your Data Scientist role readiness to 78%.',
    timestamp: '1h ago',
    unread: true,
    type: 'readiness',
    href: '/dashboard',
  },
  {
    id: '3',
    title: 'Resume Telemetry Synced',
    description: '24 skills and 5 work experiences were successfully indexed from your resume.',
    timestamp: '3h ago',
    unread: true,
    type: 'resume',
    href: '/dashboard/profile',
  },
  {
    id: '4',
    title: 'Roadmap Module Ready',
    description: 'Module 3: Advanced Feature Engineering is ready to start.',
    timestamp: '1d ago',
    unread: false,
    type: 'roadmap',
    href: '/dashboard/roadmap',
  },
];

interface TopNavbarProps {
  onOpenSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenSidebar }) => {
  const router = useRouter();
  const { profile, activeRole, activeLocation, addToast, logout } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [mounted, setMounted] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const fetchLiveNotifications = React.useCallback(() => {
    api.getNotifications().then((items) => {
      if (Array.isArray(items) && items.length > 0) {
        setNotifications(items.map((item: any) => ({
          id: item.id || `notif-${Math.random()}`,
          title: item.title,
          description: item.description,
          timestamp: item.created_at ? new Date(item.created_at).toLocaleString() : 'Recently',
          unread: Boolean(item.unread),
          type: item.type || 'resource',
          href: item.href || '/dashboard/resources',
        })));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchLiveNotifications();

    // Listen for custom event triggered whenever a like, save, or comment occurs
    const handleUpdate = () => fetchLiveNotifications();
    window.addEventListener('notifications-updated', handleUpdate);

    // Poll every 25 seconds for incoming real-time notifications
    const interval = setInterval(fetchLiveNotifications, 25000);

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('notifications-updated', handleUpdate);
      clearInterval(interval);
    };
  }, [fetchLiveNotifications]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    api.markNotificationsRead();
    addToast('All notifications marked as read', 'info');
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    setIsNotificationsOpen(false);
    router.push(item.href);
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full h-16 border-b border-sky-200/50 bg-sky-100/40 backdrop-blur-md px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 transition-all">
      {/* Left side: Mobile Toggle + Complete Brand Logo */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenSidebar}
          className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100/60 lg:hidden cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* MatchSkill Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group cursor-pointer transition-transform hover:scale-105 duration-200 shrink-0"
        >
          <BrandLogo size="sm" textClassName="group-hover:[&>span:first-child]:text-slate-800 group-hover:[&>span:last-child]:text-sky-700 transition-colors" />
        </Link>
      </div>

      {/* Middle: Global Search Input */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative w-full">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search skills, roles, companies, or roadmap modules..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Right actions: Target Pill, Notifications & User Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Target Context Pill */}
        <div
          suppressHydrationWarning
          className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sm font-medium text-slate-700"
        >
          <span className="font-semibold text-slate-900" suppressHydrationWarning>
            {mounted ? (profile?.targetRole || activeRole || 'Select Target Role') : 'Select Target Role'}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600" suppressHydrationWarning>
            {mounted ? (profile?.targetLocation || profile?.location || activeLocation || 'All India') : 'All India'}
          </span>
        </div>

        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsDropdownOpen(false);
            }}
            className={`relative p-2 rounded-xl transition-all cursor-pointer ${
              isNotificationsOpen
                ? 'bg-sky-100 text-sky-700'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Notifications & Alerts"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-600 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fade-in font-sans">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-700 border border-sky-200">
                      {unreadCount} New
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all as read</span>
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3.5 hover:bg-slate-50/90 transition-colors cursor-pointer flex items-start gap-3 text-left ${
                        item.unread ? 'bg-sky-50/40' : 'bg-white'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {item.type === 'resource' && (
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                            item.title.toLowerCase().includes('like')
                              ? 'bg-rose-50 text-rose-600 border-rose-100'
                              : item.title.toLowerCase().includes('comment')
                              ? 'bg-sky-50 text-sky-600 border-sky-100'
                              : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                            {item.title.toLowerCase().includes('like') ? (
                              <Heart className="w-4 h-4 fill-rose-600" />
                            ) : item.title.toLowerCase().includes('comment') ? (
                              <MessageSquare className="w-4 h-4" />
                            ) : (
                              <BookOpen className="w-4 h-4" />
                            )}
                          </div>
                        )}
                        {item.type === 'signal' && (
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                        {item.type === 'readiness' && (
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                        )}
                        {item.type === 'resume' && (
                          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                            <FileCheck2 className="w-4 h-4" />
                          </div>
                        )}
                        {item.type === 'roadmap' && (
                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                            <Compass className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-bold truncate ${item.unread ? 'text-slate-900' : 'text-slate-700'}`}>
                            {item.title}
                          </p>
                          {item.unread && (
                            <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-normal">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium pt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{item.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No new notifications
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-sky-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Configure Notification Preferences</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar with Dropdown */}
        <div ref={userDropdownRef} className="relative pl-2 border-l border-slate-200">
          <button
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2 focus:outline-none cursor-pointer"
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-slate-200 ring-2 ring-transparent hover:ring-sky-500 transition-all"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <span className="hidden sm:inline text-sm font-semibold text-slate-800" suppressHydrationWarning>
              {mounted && profile?.name ? profile.name.split(' ')[0] : 'Student'}
            </span>
          </button>

          {/* User Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate" suppressHydrationWarning>
                  {profile?.name || 'Student Profile'}
                </p>
                <p className="text-xs text-slate-500 truncate" suppressHydrationWarning>
                  {profile?.email || 'student@example.com'}
                </p>
              </div>

              <Link
                href="/dashboard/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
              >
                <User className="w-4.5 h-4.5 text-slate-400" />
                My Profile
              </Link>

              <Link
                href="/dashboard/resources"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
              >
                <BookOpen className="w-4.5 h-4.5 text-slate-400" />
                Resource Hub
              </Link>

              <Link
                href="/dashboard/resources/saved"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
              >
                <Bookmark className="w-4.5 h-4.5 text-slate-400" />
                Saved Resources
              </Link>

              <Link
                href="/dashboard/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
              >
                <Settings className="w-4.5 h-4.5 text-slate-400" />
                Settings
              </Link>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5 text-rose-500" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
