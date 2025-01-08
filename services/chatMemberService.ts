import { ChatMember } from '@/types/chat';
import { API_BASE } from '@/config/api';

const CHAT_MEMBERS_ENDPOINT = `${API_BASE}/chat_members`;

export class ChatMemberServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatMemberServiceError';
  }
}

export async function getUserChats(token: string): Promise<ChatMember[]> {
  const response = await fetch(CHAT_MEMBERS_ENDPOINT, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new ChatMemberServiceError('Failed to fetch user chats');
  }

  return response.json();
} 