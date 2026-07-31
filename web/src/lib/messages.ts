import { authFetch } from './wallet';

export interface Message {
  id: string;
  senderPubkey: string;
  recipientPubkey: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export async function fetchConversation(withPubkey: string): Promise<Message[]> {
  const res = await authFetch(`/api/messages?with=${encodeURIComponent(withPubkey)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'Failed to load messages');
  return data.messages ?? [];
}

export async function sendMessage(recipientPubkey: string, body: string): Promise<Message> {
  const res = await authFetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ recipientPubkey, body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'Failed to send message');
  return data.message;
}