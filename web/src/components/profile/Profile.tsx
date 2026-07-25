'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Level2Verification from '@/components/verification/Level2Verification';
import EditProfileModal from '@/components/profile/EditProfileModal';
import { authFetch } from '@/lib/wallet';
import { CheckBadgeIcon, LockIcon, EditIcon, SettingsIcon } from '@/app/icons';

const LEVEL3_CHECK_LABELS: Record<string, string> = {
  hasCompletedVaults: '2+ completed collaborative vaults',
  hasOnTimeHistory: '10+ on-time contributions',
  noDisputes: 'No disputes or fraud reports',
  hasAccountAge: 'Account active for 3+ months',
};

interface ProfileProps {
  publicKey: string | null;
  phpRate: number;
  purchasingPowerSaved: number;
  copied: boolean;
  onCopyAddress: () => void;
  loading: boolean;
  onRefresh: () => void;
  wallet: {
    status?: string;
    network?: string;
    provider?: string;
    signerAvailable?: boolean;
    error?: string | null;
  };
  username?: string;
  handle?: string;
  vaultsCount?: number;
  points?: number;
  avatarSrc?: string;
  phoneVerified?: boolean;
  phoneNumber?: string;
  identityVerified?: boolean;
  level2GateUnlocked?: boolean;
  communityTrustUnlocked?: boolean;
  onVerifyIdentity?: () => void;
  onOpenSettings?: () => void;
  onProfileUpdated?: (next: { username: string; avatarSrc: string }) => void;
}

export default function Profile({
  wallet,
  publicKey,
  username = 'Starry Voyager',
  handle = 'stella_user_882',
  vaultsCount = 12,
  points = 2450,
  avatarSrc = '/stellamascot.png',
  phoneVerified = true,
  phoneNumber = '+63 917 •• •• 213',
  identityVerified = false,
  level2GateUnlocked = false,
  communityTrustUnlocked = false,
  onVerifyIdentity,
  onOpenSettings,
  onProfileUpdated,
}: ProfileProps) {
  const { network } = wallet || {};

  const [localUsername, setLocalUsername] = useState(username);
  const [localAvatarSrc, setLocalAvatarSrc] = useState(avatarSrc);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [showLevel2, setShowLevel2] = useState(false);

  const [level3Status, setLevel3Status] = useState<{
    eligible: boolean;
    checks?: Record<string, boolean>;
    reasons?: string[];
  } | null>(null);

  useEffect(() => {
    if (!identityVerified || !publicKey) return;
    authFetch('/api/verification/level3-status')
      .then((r) => r.json())
      .then((d) => setLevel3Status(d))
      .catch(() => setLevel3Status(null));
  }, [identityVerified, publicKey]);

  const handleLevelUpClick = () => {
    setShowLevel2(true);
    onVerifyIdentity?.();
  };

  const handleLevelUpToLevel3Click = async () => {
    try {
      const res = await authFetch('/api/verification/level3', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        onVerifyIdentity?.();
      } else {
        console.log('Not eligible yet:', data.reasons);
      }
    } catch (e) {
      console.error('Level 3 upgrade failed', e);
    }
  };

  return (
    <div className="px-5 py-4 space-y-7 animate-fade-in">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xl font-semibold text-[#FF5E00] tracking-tight">Profile</h3>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open settings"
          className="p-2 -mr-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <SettingsIcon />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative w-20 h-20">
          <div className="w-20 h-20 rounded-full bg-linear-to-b from-orange-50 to-orange-100 border-4 border-white shadow-md shadow-orange-900/10 overflow-hidden relative">
            <Image
              src={localAvatarSrc}
              alt="Profile avatar"
              fill
              priority
              sizes="80px"
              className="object-contain p-2"
            />
          </div>
          <button
            type="button"
            aria-label="Edit profile"
            onClick={() => setShowEditProfile(true)}
            disabled={!publicKey}
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#FF5E00] text-white flex items-center justify-center border-2 border-white shadow-sm cursor-pointer hover:bg-[#e65300] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <EditIcon />
          </button>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight">{localUsername}</h2>
          <p className="text-xs font-medium text-slate-400">@{handle}</p>
        </div>

        <div className="flex items-center gap-3 w-full max-w-xs">
          <div className="flex-1 bg-white border border-slate-200/60 rounded-2xl py-2.5 text-center shadow-sm shadow-slate-900/5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Vaults</p>
            <p className="text-base font-semibold text-slate-800 mt-0.5">{vaultsCount}</p>
          </div>
          <div className="flex-1 bg-white border border-slate-200/60 rounded-2xl py-2.5 text-center shadow-sm shadow-slate-900/5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Points</p>
            <p className="text-base font-semibold text-slate-800 mt-0.5">{points.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="px-1">
          <h3 className="text-sm font-semibold text-slate-800 tracking-tight">Progressive Identity</h3>
          <p className="text-xs font-normal text-slate-400">Verify your account to unlock premium vaults</p>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl divide-y divide-slate-100">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-300 w-4">1</span>
              <span className="text-sm font-medium text-slate-700">Phone Verified</span>
            </div>
            {phoneVerified && <CheckBadgeIcon className="text-emerald-500 shrink-0" />}
          </div>

          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-300 w-4">2</span>
                <span className="text-sm font-medium text-slate-700">Identity Details</span>
              </div>
              {identityVerified && <CheckBadgeIcon className="text-emerald-500 shrink-0" />}
            </div>
            {!identityVerified && (
              <button
                onClick={handleLevelUpClick}
                className="w-full py-2 rounded-xl bg-linear-to-br from-[#FFB238] via-[#FF9F1C] to-[#F37A00] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#e65300] active:scale-95 transition-all cursor-pointer"
              >
                Level Up
              </button>
            )}
          </div>

          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-300 w-4">3</span>
                <span className={`text-sm font-medium ${identityVerified ? 'text-slate-700' : 'text-slate-400'}`}>Community Trust</span>
              </div>
              {communityTrustUnlocked ? (
                <CheckBadgeIcon className="text-emerald-500 shrink-0" />
              ) : !identityVerified ? (
                <LockIcon className="text-slate-300 shrink-0" />
              ) : level3Status ? (
                <span className="text-[10px] font-medium text-slate-400">
                  {Object.entries(level3Status.checks ?? {}).filter(([k, v]) => v && k !== 'hasVerificationLevel2').length}/4
                </span>
              ) : null}
            </div>

            {identityVerified && !communityTrustUnlocked && level3Status && (
              <>
                <ul className="space-y-1.5 pl-6.5">
                  {Object.entries(LEVEL3_CHECK_LABELS).map(([key, label]) => {
                    const passed = level3Status.checks?.[key] ?? false;
                    return (
                      <li key={key} className="flex items-center gap-2 text-xs text-slate-500">
                        <span className={passed ? 'text-emerald-500' : 'text-slate-300'}>
                          {passed ? '✓' : '○'}
                        </span>
                        {label}
                      </li>
                    );
                  })}
                </ul>
                <button
                  onClick={handleLevelUpToLevel3Click}
                  disabled={!level3Status.eligible}
                  className="w-full py-2 rounded-xl bg-linear-to-br from-[#FFB238] via-[#FF9F1C] to-[#F37A00] text-white text-xs font-semibold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#e65300] active:scale-95 transition-all cursor-pointer"
                >
                  Level Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {publicKey && (
        <EditProfileModal
          open={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          publicKey={publicKey}
          currentUsername={localUsername}
          currentAvatarSrc={localAvatarSrc}
          onSaved={(next) => {
            setLocalUsername(next.username);
            setLocalAvatarSrc(next.avatarSrc);
            onProfileUpdated?.(next);
          }}
        />
      )}

      {showLevel2 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLevel2(false);
          }}
        >
          <Level2Verification
            currentPoints={points}
            verifiedPhone={phoneNumber}
            level2GateUnlocked={level2GateUnlocked}
            onClose={() => setShowLevel2(false)}
            onComplete={() => {
              setShowLevel2(false);
              onVerifyIdentity?.();
            }}
          />
        </div>
      )}
    </div>
  );
}