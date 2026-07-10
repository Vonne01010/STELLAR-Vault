import { authFetch } from './wallet';

export interface Invitation {
  id: string;
  vaultId: string;
  invitedBy: string;
  inviteePubkey: string;
  status: 'pending' | 'accepted' | 'declined' | 'active';
  createdAt: string;
  vault?: { id: string; name: string; vaultType: string };
}

export async function fetchMyInvitations(): Promise<Invitation[]> {
  const res = await authFetch('/api/invitations');
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'Failed to load invitations');
  return data;
}

export async function fetchVaultInvitations(vaultId: string): Promise<Invitation[]> {
  const res = await authFetch(`/api/vaults/${vaultId}/invitations`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'Failed to load vault invitations');
  return data;
}

export async function sendInvitation(vaultId: string, inviteePubkey: string): Promise<Invitation> {
  const res = await authFetch(`/api/vaults/${vaultId}/invitations`, {
    method: 'POST',
    body: JSON.stringify({ inviteePubkey }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'Failed to send invitation');
  return data;
}

export async function respondToInvitation(id: string, status: 'accepted' | 'declined'): Promise<Invitation> {
  const res = await authFetch(`/api/invitations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'Failed to respond to invitation');
  return data;
}

export async function confirmInvitation(id: string): Promise<Invitation> {
  const res = await authFetch(`/api/invitations/${id}/confirm`, { method: 'PATCH' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'Failed to confirm invitation');
  return data;
}