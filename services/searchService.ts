import { SearchQuery, SearchResults, SearchType } from '@/types/search';
import { API_BASE } from '@/config/api';
import { SEARCH_ENDPOINT } from '@/config/api'
import { useAuthStore } from '@/store/authStore'
import { logRequest } from '@/utils/apiLogger';



export const searchContent = async (
  queryString: string,
  searchTypes: SearchType[]
): Promise<SearchResults> => {
  const searchQuery: SearchQuery = {
    queryString,
    searchTypes,
  };

  const headers = await useAuthStore.getState().getAuthHeaders();
  const response = await logRequest(
    {
      method: 'POST',
      url: SEARCH_ENDPOINT,
      headers,
      body: searchQuery
    },
    () => fetch(SEARCH_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(searchQuery),
    })
  );

  if (!response.ok) {
    throw new Error('Search request failed');
  }

  return response.json();
}; 