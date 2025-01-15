import { SearchQuery, SearchResults, SearchType } from '@/types/search';
import { API_BASE } from '@/config/api';
import { SEARCH_ENDPOINT } from '@/config/api'
import { useAuthStore } from '@/store/authStore'
import { logRequest } from '@/utils/apiLogger';



export const searchContent = async (
  queryString: string,
  searchTypes: SearchType[]
): Promise<SearchResults> => {
  // Check if AI search is requested and handle trailing space
  const hasTrailingSpace = queryString.endsWith(' ');
  const cleanQuery = queryString.trim();
  
  // Remove AI from searchTypes if no trailing space
  const effectiveSearchTypes = hasTrailingSpace 
    ? searchTypes 
    : searchTypes.filter(type => type !== SearchType.AI);

  const searchQuery: SearchQuery = {
    queryString: cleanQuery,
    searchTypes: effectiveSearchTypes,
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