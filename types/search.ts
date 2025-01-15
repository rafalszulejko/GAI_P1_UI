export enum SearchType {
  MESSAGE = 'MESSAGE',
  FILE = 'FILE',
  USER = 'USER',
  AI = 'AI'
}

export interface SearchQuery {
  queryString: string;
  searchTypes: SearchType[];
}

export interface MessageSearchResult {
  message: Message;
  user: User;
}

export interface AISearchResults {
  summary: string;
  messages: string[];
}

export interface SearchResults {
  messages: MessageSearchResult[];
  users: User[];
  ai: AISearchResults;
}

// Import required types
import { User } from './user';
import { Message } from './chat'; 