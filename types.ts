
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

export type TemplateType = 'standard' | 'three-section';

export interface StyleTemplate {
  id: string;
  name: string;
  description?: string;
  icon: string;
  type: TemplateType;
  // Standard Template fields
  inputExample?: string;
  outputExample?: string;
  // Three-Section Template fields
  threeSection?: {
    rawMaterial: {
      label: string;
      placeholder: string;
      example: string;
    };
    template: {
      label: string;
      placeholder: string;
      example: string;
    };
    exampleOutput?: {
      label: string;
      content: string;
      enabled: boolean;
    };
  };
  systemPrompt?: string;
  createdAt: number;
  lastUsedAt?: number;
  useCount: number;
}

export interface TemplateUsage {
  templateId: string;
  rawMaterial: string;
  template: string;
  useExample: boolean;
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

export type ViewType = 'main' | 'templates' | 'settings' | 'auth';

export interface User {
  id: string;
  name: string;
  email?: string;
  isCloud: boolean;
}
