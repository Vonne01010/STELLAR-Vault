'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SecurityIcon, SupportIcon, ChevronLeftIcon, ChevronRightIcon, UserIcon, BellIcon, LinkIcon} from '@/app/icons';

interface SettingsRow {
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const rows: SettingsRow[] = [
  {
    label: 'Account',
    description: 'Log out or delete your account',
    icon: <UserIcon className="text-slate-400" />,
    href: '/settings/account',
  },
  {
    label: 'Security',
    description: 'PIN, wallet signer, and device access',
    icon: <SecurityIcon className="text-slate-400" />,
    href: '/settings/security',
  },
  {
    label: 'Support',
    description: 'Get help or contact the team',
    icon: <SupportIcon className="text-slate-400" />,
    href: '/settings/support',
  },
  {
    label: 'Notifications',
    description: 'Choose what you get alerted about',
    icon: <BellIcon className="text-slate-400" />,
    href: '/settings/notifications',
  },
  {
    label: 'Linked Accounts',
    description: 'Connected wallets and services',
    icon: <LinkIcon className="text-slate-400" />,
    href: '/settings/linked-accounts',
  },
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen w-full bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md min-h-210 bg-[#fffdfb] rounded-[2.5rem] overflow-hidden shadow-xl relative flex flex-col font-sans tracking-tight border border-slate-200/40 text-[#1A1A1A]">
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-7 pb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Back"
              className="p-1 -ml-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeftIcon />
            </button>
            <h1 className="text-xl font-semibold text-[#FF5E00] tracking-tight">Settings</h1>
          </div>

          <div className="mx-4 mt-5 mb-6 bg-white border border-slate-200/60 rounded-2xl divide-y divide-slate-100 shadow-sm shadow-slate-900/5">
            {rows.map((row) => (
              <button
                key={row.href}
                type="button"
                onClick={() => router.push(row.href)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer"
              >
                {row.icon}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-slate-700">{row.label}</span>
                  <span className="block text-xs text-slate-400">{row.description}</span>
                </span>
                <ChevronRightIcon className="text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}