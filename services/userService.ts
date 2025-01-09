import { User } from '@/types/user'
import { API_BASE } from '@/config/api'
import { logRequest } from '@/utils/apiLogger'
import { getAuthHeaders } from '@/utils/auth'

const USERS_ENDPOINT = `${API_BASE}/users`

export const getCurrentUser = async (): Promise<User> => {
  const headers = await getAuthHeaders();
  const response = await logRequest(
    {
      url: `${USERS_ENDPOINT}/me`,
      headers
    },
    () => fetch(`${USERS_ENDPOINT}/me`, {
      headers
    })
  );
  
  if (!response.ok) {
    throw new Error('Not authenticated');
  }
  
  return response.json();
};

export const getUserById = async (username: string): Promise<User> => {
  const headers = await getAuthHeaders();
  const response = await logRequest(
    {
      url: `${USERS_ENDPOINT}/${username}`,
      headers
    },
    () => fetch(`${USERS_ENDPOINT}/${username}`, {
      headers
    })
  );
  
  if (!response.ok) {
    throw new Error('User not found');
  }
  
  return response.json();
};

