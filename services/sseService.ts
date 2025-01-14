import { useAuthStore } from '@/store/authStore';
import { API_BASE } from '@/config/api';
import { createParser } from 'eventsource-parser';

const HEARTBEAT_ENDPOINT = `${API_BASE}/users/heartbeat`;
const ONLINE_USERS_ENDPOINT = `${API_BASE}/users/online`;
const SUBSCRIBE_ENDPOINT = (chatId: string) => `${API_BASE}/chats/${chatId}/subscribe`;

export interface ChatEvent {
  type: 'NEW_MESSAGE' | 'ONLINE_USERS' | 'PRESENCE_UPDATE' | 'CONNECTED' | 'HEARTBEAT';
  data: any;
}

export class SSEService {
  private abortController: AbortController | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private isActive = false;

  async subscribeToChatUpdates(chatId: string, onEvent: (event: ChatEvent) => void) {
    await this.cleanup();

    const headers = await useAuthStore.getState().getAuthHeaders();
    const abortController = new AbortController();
    this.abortController = abortController;
    this.isActive = true;

    try {
      const response = await fetch(SUBSCRIBE_ENDPOINT(chatId), {
        headers,
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      this.reader = reader;
      const decoder = new TextDecoder();
      const parser = createParser({
        onEvent: (event) => {
          try {
            let parsedData = event.data;
            try {
              parsedData = JSON.parse(event.data);
            } catch {
              // If JSON parsing fails, use the raw string data
            }
            
            const chatEvent: ChatEvent = {
              type: event.event as ChatEvent['type'],
              data: parsedData
            };
            console.log('Received SSE event:', chatEvent);
            onEvent(chatEvent);
          } catch (error) {
            console.error('Failed to parse event data:', error);
            console.error('Event data:', event);
          }
        }
      });

      const processEvents = async () => {
        try {
          while (this.isActive && this.reader === reader) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            parser.feed(chunk);
          }
        } catch (error) {
          // Ignore AbortError as it's expected when switching chats
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('SSE Read Error:', error);
          }
        }
      };

      processEvents().catch(() => {}).finally(() => {
        // Ensure cleanup happens after the stream is done
        this.cleanup();
      });
      
      this.startHeartbeat(abortController);
    } catch (error) {
      // Ignore AbortError as it's expected when switching chats
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('SSE Connection Error:', error);
      }
      this.cleanup();
    }
  }

  private async startHeartbeat(abortController: AbortController) {
    this.heartbeatInterval = setInterval(async () => {
      if (!this.isActive) {
        this.cleanup();
        return;
      }

      try {
        const headers = await useAuthStore.getState().getAuthHeaders();
        await fetch(HEARTBEAT_ENDPOINT, {
          method: 'POST',
          headers,
          signal: abortController.signal
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Heartbeat error:', error);
        }
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  async cleanup() {
    this.isActive = false;

    try {
      // First release the reader if it exists
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }

      // Then abort the fetch request
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
    } catch (error) {
      // Ignore AbortError and other cleanup errors as they're expected
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Cleanup error:', error);
      }
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async getOnlineUsers(): Promise<string[]> {
    const headers = await useAuthStore.getState().getAuthHeaders();
    const response = await fetch(ONLINE_USERS_ENDPOINT, {
      headers
    });
    return response.json();
  }
} 