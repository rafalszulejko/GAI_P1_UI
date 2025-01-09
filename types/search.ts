export enum SearchType {
  MESSAGE = 'MESSAGE',
  FILE = 'FILE',
  USER = 'USER'
}

export interface SearchQuery {
  queryString: string;
  searchTypes: SearchType[];
}

export interface MessageSearchResult {
  message: Message;
  user: User;
}

export interface SearchResults {
  messages: MessageSearchResult[];
  users: User[];
}

// Import required types
import { User } from './user';
import { Message } from './chat'; 