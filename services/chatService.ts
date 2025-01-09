import { Chat, ChatType } from '@/types/chat';
import { API_BASE } from '@/config/api';
import { getAuthHeaders } from '@/utils/auth';
import { logRequest } from '@/utils/apiLogger';

const CHATS_ENDPOINT = `${API_BASE}/chats`;

export class ChatServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatServiceError';
  }
}

export async function getAllChats(): Promise<Chat[]> {
  const headers = await getAuthHeaders();
  const response = await logRequest(
    {
      url: CHATS_ENDPOINT,
      headers
    },
    () => fetch(CHATS_ENDPOINT, {
      headers
    })
  );

  if (!response.ok) {
    throw new ChatServiceError('Failed to fetch all chats');
  }

  return response.json();
}

export async function getChatById(chatId: string): Promise<Chat> {
  const headers = await getAuthHeaders();
  const response = await logRequest(
    {
      url: `${CHATS_ENDPOINT}/${chatId}`,
      headers
    },
    () => fetch(`${CHATS_ENDPOINT}/${chatId}`, {
      headers
    })
  );

  if (!response.ok) {
    throw new ChatServiceError('Failed to fetch chat');
  }

  return response.json();
}

export async function createChat(chat: Chat): Promise<Chat> {
  const headers = await getAuthHeaders();
  const response = await logRequest(
    {
      method: 'POST',
      url: CHATS_ENDPOINT,
      headers,
      body: chat
    },
    () => fetch(CHATS_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(chat)
    })
  );

  if (!response.ok) {
    throw new ChatServiceError('Failed to create chat');
  }

  return response.json();
}

export async function updateChat(chatId: string, chat: Partial<Chat>): Promise<Chat> {
  const headers = await getAuthHeaders();
  const response = await logRequest(
    {
      method: 'PUT',
      url: `${CHATS_ENDPOINT}/${chatId}`,
      headers,
      body: chat
    },
    () => fetch(`${CHATS_ENDPOINT}/${chatId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(chat)
    })
  );

  if (!response.ok) {
    throw new ChatServiceError('Failed to update chat');
  }

  return response.json();
} 