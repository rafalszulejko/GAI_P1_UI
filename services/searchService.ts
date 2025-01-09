import { SearchQuery, SearchResults, SearchType } from '@/types/search';
import { API_BASE } from '@/config/api';
import { getAuthHeaders } from '@/utils/auth';
import { logRequest } from '@/utils/apiLogger';

const SEARCH_ENDPOINT = `${API_BASE}/search`;

export const searchContent = async (
  queryString: string,
  searchTypes: SearchType[]
): Promise<SearchResults> => {
  const searchQuery: SearchQuery = {
    queryString,
    searchTypes,
  };

  const headers = await getAuthHeaders();
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