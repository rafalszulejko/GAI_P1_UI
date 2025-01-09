import { ChatMember } from '@/types/chat';
import { API_BASE } from '@/config/api';
import { getAuthHeaders } from '@/utils/auth';
import { logRequest } from '@/utils/apiLogger';

const CHAT_MEMBERS_ENDPOINT = `${API_BASE}/chat_members`;

export class ChatMemberServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatMemberServiceError';
  }
}

export async function addChatMember(chatId: string, userId: string): Promise<ChatMember> {
  const headers = await getAuthHeaders();
  const response = await logRequest(
    {
      method: 'POST',
      url: CHAT_MEMBERS_ENDPOINT,
      headers,
      body: {
        chatId,
        userId,
        joinedAt: new Date(),
        lastRead: new Date(),
        isMuted: false,
        isBlocked: false
      }
    },
    () => fetch(CHAT_MEMBERS_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chatId,
        userId,
        joinedAt: new Date(),
        lastRead: new Date(),
        isMuted: false,
        isBlocked: false
      })
    })
  );

  if (!response.ok) {
    throw new ChatMemberServiceError('Failed to add chat member');
  }

  return response.json();
}

export async function getUserChats(): Promise<ChatMember[]> {
  const headers = await getAuthHeaders();
  const response = await logRequest(
    {
      url: CHAT_MEMBERS_ENDPOINT,
      headers
    },
    () => fetch(CHAT_MEMBERS_ENDPOINT, {
      headers
    })
  );

  if (!response.ok) {
    throw new ChatMemberServiceError('Failed to fetch user chats');
  }

  return response.json();
}

export async function getChatMembers(chatId: string): Promise<ChatMember[]> {
  const headers = await getAuthHeaders();
  const response = await logRequest(
    {
      url: `${CHAT_MEMBERS_ENDPOINT}/${chatId}`,
      headers
    },
    () => fetch(`${CHAT_MEMBERS_ENDPOINT}/${chatId}`, {
      headers
    })
  );

  if (!response.ok) {
    throw new ChatMemberServiceError('Failed to fetch chat members');
  }

  return response.json();
}

export function withoutUser(members: ChatMember[], userId: string): ChatMember[] {
  return members.filter(member => member.userId !== userId);
} 