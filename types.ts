
export type Role = 'user' | 'assistant';

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  templateUsedId?: string;
  attachments?: FileAttachment[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  lastUpdatedAt: number;
}

export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  inputExample: string;
  outputExample: string;
  createdAt: number;
  lastUsedAt?: number;
  useCount: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  chatMode: 'normal' | 'suggest';
  showCopy: boolean;
  showEdit: boolean;
  showRegenerate: boolean;
  autoSave: boolean;
  templateSuggestions: boolean;
  autoComplete: boolean;
  stickyMode: boolean;
  maxFileSize: number;
}

export type ViewType = 'main' | 'templates' | 'settings';
