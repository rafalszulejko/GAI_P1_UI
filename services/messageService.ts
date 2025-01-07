import { Message } from '@/types/chat'
import { API_BASE } from '@/config/api'
import { logRequest } from '@/utils/apiLogger'
import { getAuthToken } from '@/utils/auth'

const MESSAGES_ENDPOINT = (chatId: string) => `${API_BASE}/chats/${chatId}/messages`

const getAuthHeaders = (token?: string) => {
  if (!token) {
    throw new Error('No authentication token provided');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const getMessagesByChat = async (chatId: string, token: string): Promise<Message[]> => {
  const headers = getAuthHeaders(token);
  const url = MESSAGES_ENDPOINT(chatId);
  const response = await logRequest(
    {
      url,
      headers
    },
    () => fetch(url, {
      headers
    })
  );
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  return response.json();
};

export const sendMessage = async (chatId: string, content: string, token: string): Promise<Message> => {
  const headers = getAuthHeaders(token);
  const url = MESSAGES_ENDPOINT(chatId);
  const message: Partial<Message> = {
    chatId,
    content,
    sentAt: new Date()
  };

  const response = await logRequest(
    {
      method: 'POST',
      url,
      headers,
      body: message
    },
    () => fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(message)
    })
  );
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  return response.json();
};

