import { Chat } from '@/types/chat';
import { API_BASE } from '@/config/api';

const CHATS_ENDPOINT = `${API_BASE}/chats`;

export class ChatServiceError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ChatServiceError';
  }
}

const getAuthHeaders = (token?: string) => {
  if (!token) {
    throw new ChatServiceError('No authentication token provided');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const getUserChats = async (token: string): Promise<Chat[]> => {
  try {
    const headers = getAuthHeaders(token);
    const response = await fetch(CHATS_ENDPOINT, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new ChatServiceError('Failed to fetch chats', response.status);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof ChatServiceError) {
      throw error;
    }
    throw new ChatServiceError('Failed to fetch chats');
  }
};

export const createChat = async (chat: Chat, token: string): Promise<Chat> => {
  const headers = getAuthHeaders(token);
  const response = await fetch(CHATS_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(chat)
  });

  if (!response.ok) {
    throw new Error('Failed to create chat');
  }

  return response.json();
};

export const getChatById = async (chatId: string, token?: string): Promise<Chat> => {
  try {
    const headers = getAuthHeaders(token);
    const response = await fetch(`${CHATS_ENDPOINT}/${chatId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new ChatServiceError(`Failed to fetch chat ${chatId}`, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ChatServiceError) {
      throw error;
    }
    throw new ChatServiceError(`Failed to fetch chat ${chatId}`);
  }
}; 