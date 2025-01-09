import { Message } from '@/types/chat'
import { API_BASE } from '@/config/api'
import { logRequest } from '@/utils/apiLogger'
import { getAuthToken } from '@/utils/auth'

const MESSAGES_ENDPOINT = `${API_BASE}/messages`

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
  const url = `${MESSAGES_ENDPOINT}/chat/${chatId}`;
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
  const message: Partial<Message> = {
    chatId,
    content,
    sentAt: new Date()
  };

  const response = await logRequest(
    {
      method: 'POST',
      url: MESSAGES_ENDPOINT,
      headers,
      body: message
    },
    () => fetch(MESSAGES_ENDPOINT, {
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

export async function updateMessage(messageId: string, message: Partial<Message>, token: string): Promise<Message> {
  const headers = getAuthHeaders(token);
  const url = `${MESSAGES_ENDPOINT}/${messageId}`;
  
  const response = await logRequest(
    {
      method: 'PUT',
      url,
      headers,
      body: message
    },
    () => fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(message)
    })
  );

  if (!response.ok) {
    throw new Error('Failed to update message');
  }

  return response.json();
}

