'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
  type AppNotification,
} from '@/lib/notifications';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';

function BellIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function NotificationBell({
  publicKey,
  onNavigateToVault,
  onNavigateToTransfer,
}: {
  publicKey: string | null;
  onNavigateToVault?: (vaultId: string) => void;
  onNavigateToTransfer?: (transferId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!publicKey) { setNotifications([]); return; }
    setLoading(true);
    try {
      setNotifications(await fetchNotifications());
    } catch {
      // silent — non-critical
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  useEffect(() => {
    if (!publicKey) return;
    const interval = setInterval(() => { void refresh(); }, 30000);
    return () => clearInterval(interval);
  }, [publicKey, refresh]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = () => {
    setOpen((prev) => !prev);
  };

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      void refresh();
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      void refresh();
    }
  };

  const handleClearAll = async () => {
    setNotifications([]);
    try {
      await clearNotifications();
    } catch {
      void refresh();
    }
  };

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.read) {
      await handleMarkRead(n.id);
    }
    if (n.vaultId && onNavigateToVault) {
      onNavigateToVault(n.vaultId);
      setOpen(false);
      return;
    }
    const transferId = (n.meta as { transferId?: string } | undefined)?.transferId;
    if (transferId && onNavigateToTransfer) {
      onNavigateToTransfer(transferId);
      setOpen(false);
    }
  };

  if (!publicKey) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="w-5 h-5 text-slate-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#FF5E00] text-white text-[9px] font-semibold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationsPanel
          notifications={notifications}
          loading={loading}
          unreadCount={unreadCount}
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearAll}
          onNotificationClick={handleNotificationClick}
        />
      )}
    </div>
  );
}