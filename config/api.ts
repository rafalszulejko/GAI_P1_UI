export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api'; 

export const USERS_ENDPOINT = `${API_BASE}/users`
export const CHATS_ENDPOINT = `${API_BASE}/chats`
export const MESSAGES_ENDPOINT = `${API_BASE}/messages`
export const SEARCH_ENDPOINT = `${API_BASE}/search` 