import { authFetch } from './wallet';

export interface Contact {
  id: string;
  pubkey: string;
  username: string | null;
  avatarUrl: string | null;
  label: string | null;
  createdAt: string;
}

export async function fetchContacts(): Promise<Contact[]> {
  const res = await authFetch('/api/contacts');
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'Failed to load contacts');
  return data.contacts ?? [];
}

export async function addContact(pubkey: string, label?: string): Promise<Contact> {
  const res = await authFetch('/api/contacts', {
    method: 'POST',
    body: JSON.stringify({ pubkey, label }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'Failed to add contact');
  return data.contact;
}

export async function removeContact(id: string): Promise<void> {
  const res = await authFetch(`/api/contacts/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to remove contact');
  }
}