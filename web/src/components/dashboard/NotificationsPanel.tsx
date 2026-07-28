'use client';

import { type AppNotification, type AppNotificationVariant } from '@/lib/notifications';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function variantLabel(variant: AppNotificationVariant): string {
  switch (variant) {
    case 'success': return 'Success';
    case 'warning': return 'Warning';
    case 'error': return 'Error';
    case 'action_required': return 'Action required';
    default: return 'Info';
  }
}

function variantClasses(variant: AppNotificationVariant): string {
  switch (variant) {
    case 'success': return 'bg-emerald-50 text-emerald-600';
    case 'warning': return 'bg-amber-50 text-amber-600';
    case 'error': return 'bg-rose-50 text-rose-600';
    case 'action_required': return 'bg-rose-50 text-rose-600';
    default: return 'bg-slate-100 text-slate-600';
  }
}

/** Whether a notification actually navigates anywhere when tapped —
 *  drives both the click handler upstream and this panel's hover/cursor styling. */
function isActionable(n: AppNotification): boolean {
  if (n.vaultId) return true;
  const transferId = (n.meta as { transferId?: string } | undefined)?.transferId;
  return !!transferId;
}

export default function NotificationsPanel({
  notifications,
  loading,
  unreadCount,
  onMarkAllRead,
  onClearAll,
  onNotificationClick,
}: {
  notifications: AppNotification[];
  loading: boolean;
  unreadCount: number;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onNotificationClick: (n: AppNotification) => void;
}) {
  return (
    <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto rounded-2xl bg-white border border-slate-200/60 shadow-lg shadow-slate-900/10 z-50 animate-fadeIn">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-700">Notifications</span>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-[10px] uppercase tracking-wider text-[#FF5E00] font-semibold hover:text-[#e65400] transition-colors"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Clear notifications"
              title="Clear notifications"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading && notifications.length === 0 ? (
        <p className="px-4 py-6 text-[11px] text-slate-400 text-center">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="px-4 py-6 text-[11px] text-slate-400 text-center">No notifications yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {notifications.map((n) => {
            const actionable = isActionable(n);
            return (
              <button
                key={n.id}
                onClick={() => onNotificationClick(n)}
                className={`w-full text-left px-4 py-3 flex gap-2 items-start transition-colors duration-150 ${
                  n.read ? 'bg-white hover:bg-slate-50' : 'bg-orange-50/60 hover:bg-orange-50'
                } ${actionable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {!n.read && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#FF5E00] shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${variantClasses(n.variant)}`}>
                      {variantLabel(n.variant)}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-snug mt-1 ${n.read ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
                    {n.message}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
                {actionable && (
                  <svg className="w-3 h-3 text-slate-300 shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}