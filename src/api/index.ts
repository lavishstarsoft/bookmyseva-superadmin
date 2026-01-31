// Central API exports
export { default as api } from '@/lib/axios';
export { getBaseUrl } from '@/lib/axios';

// API Services
export { authApi } from './auth';
export type { LoginResponse, AuthUser } from './auth';

export { enquiriesApi } from './enquiries';
export type { Enquiry, EnquiriesResponse } from './enquiries';

export { chatApi } from './chat';
export type { ChatSession, ChatMessage, BotIntent } from './chat';

export { contentApi } from './content';
export type { ContentBlock, Blog, Category } from './content';

export { storageApi } from './storage';
export type { UploadResponse, StorageFile } from './storage';
