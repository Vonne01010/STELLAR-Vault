'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SecurityIcon, SupportIcon, ChevronLeftIcon, ChevronRightIcon, UserIcon, BellIcon, LinkIcon } from '@/app/icons';

interface SettingsRow {
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  href: string;
}

interface SettingsSection {
  label: string;
  rows: SettingsRow[];
}

const sections: SettingsSection[] = [
  {
    label: 'Account',
    rows: [
      {
        label: 'Account',
        description: 'Log out or delete your account',
        icon: <UserIcon className="text-[#FF5E00]" />,
        iconBg: 'bg-orange-50',
        href: '/settings/account',
      },
      {
        label: 'Security',
        description: 'PIN, wallet signer, and device access',
        icon: <SecurityIcon className="text-[#3B82F6]" />,
        iconBg: 'bg-blue-50',
        href: '/settings/security',
      },
      {
        label: 'Linked Accounts',
        description: 'Connected wallets and services',
        icon: <LinkIcon className="text-[#0F4F53]" />,
        iconBg: 'bg-[#E3FCFC]',
        href: '/settings/linked-accounts',
      },
    ],
  },
  {
    label: 'Preferences',
    rows: [
      {
        label: 'Notifications',
        description: 'Choose what you get alerted about',
        icon: <BellIcon className="text-amber-500" />,
        iconBg: 'bg-amber-50',
        href: '/settings/notifications',
      },
    ],
  },
  {
    label: 'Help',
    rows: [
      {
        label: 'Support',
        description: 'Get help or contact the team',
        icon: <SupportIcon className="text-[#FF5E00]" />,
        iconBg: 'bg-orange-50',
        href: '/settings/support',
      },
    ],
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

          <div className="px-4 pt-3 pb-8 space-y-6">
            {sections.map((section) => (
              <div key={section.label} className="space-y-2">
                <p className="px-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {section.label}
                </p>
                <div className="bg-white border border-slate-200/60 rounded-2xl divide-y divide-slate-100 shadow-sm shadow-slate-900/5 overflow-hidden">
                  {section.rows.map((row) => (
                    <button
                      key={row.href}
                      type="button"
                      onClick={() => router.push(row.href)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <span className={`shrink-0 w-9 h-9 rounded-full ${row.iconBg} flex items-center justify-center`}>
                        {row.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-slate-700">{row.label}</span>
                        <span className="block text-xs text-slate-400 truncate">{row.description}</span>
                      </span>
                      <ChevronRightIcon className="text-slate-300 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}