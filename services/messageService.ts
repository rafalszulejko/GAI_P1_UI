import { Message } from '@/types/chat'
import { API_BASE } from '@/config/api'
import { logRequest } from '@/utils/apiLogger'
import { getAuthHeaders } from '@/utils/auth'

const MESSAGES_ENDPOINT = `${API_BASE}/messages`

export const getMessagesByChat = async (chatId: string): Promise<Message[]> => {
  const headers = await getAuthHeaders();
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

export const sendMessage = async (chatId: string, content: string): Promise<Message> => {
  const headers = await getAuthHeaders();
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

export async function updateMessage(messageId: string, message: Partial<Message>): Promise<Message> {
  const headers = await getAuthHeaders();
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

