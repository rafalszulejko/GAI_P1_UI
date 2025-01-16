export enum ChatType {
  DIRECT = 'DIRECT',
  CHANNEL = 'CHANNEL',
  THREAD = 'THREAD',
  AI = 'AI'
}

export interface CreateChatCommand {
  name: string;
  description: string;
  type: ChatType;
  members: string[];
}

export interface Attachment {
  key: string;
  filename: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  sentAt: Date;
  threadId: string | null;
  attachments?: Attachment[] | null;
}

export interface Chat {
  id: string;
  name: string;
  description: string;
  type: ChatType;
  lastMessageAt: Date;
}

export interface ChatMember {
  id: string;
  chatId: string;
  userId: string;
  joinedAt: Date;
  lastRead: Date;
  isMuted: boolean;
  isBlocked: boolean;
}

