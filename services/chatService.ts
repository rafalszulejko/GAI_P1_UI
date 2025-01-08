import { Chat, ChatType } from '@/types/chat';
import { API_BASE } from '@/config/api';

const CHATS_ENDPOINT = `${API_BASE}/chats`;

export class ChatServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatServiceError';
  }
}

export async function getChatById(chatId: string, token: string): Promise<Chat> {
  const response = await fetch(`${CHATS_ENDPOINT}/${chatId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new ChatServiceError('Failed to fetch chat');
  }

  return response.json();
}

export async function createChat(chat: Chat, token: string): Promise<Chat> {
  const response = await fetch(CHATS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(chat)
  });

  if (!response.ok) {
    throw new ChatServiceError('Failed to create chat');
  }

  return response.json();
} 