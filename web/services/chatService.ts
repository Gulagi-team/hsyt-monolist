import type { ChatMessageItem, ChatSessionSummary } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';

const getAuthToken = (): string | null => localStorage.getItem('auth_token');

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

interface ListSessionsResponse {
  sessions: ChatSessionSummary[];
  pagination: {
    limit: number;
    offset: number;
  };
}

interface ListMessagesResponse {
  session: ChatSessionSummary;
  messages: ChatMessageItem[];
  pagination: {
    limit: number;
    offset: number;
  };
}

interface CreateSessionResponse {
  session: ChatSessionSummary;
}

interface SendMessageRequest {
  question: string;
  sessionId?: number | null;
  includeRecentAnalysis?: boolean;
}

interface SendMessageResponse {
  question: string;
  answer: string;
  sessionId: number;
  userMessageId: number;
  aiMessageId: number;
  hasPatientContext: boolean;
  hasRecentAnalysis: boolean;
  timestamp: string;
  message: string;
}

const chatService = {
  async createSession(title?: string): Promise<CreateSessionResponse> {
    const body: Record<string, unknown> = {};
    if (title && title.trim() !== '') {
      body.title = title.trim();
    }

    const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || payload.error || 'Không thể tạo phiên chat mới');
    }

    return payload.data as CreateSessionResponse;
  },

  async listSessions(limit = 50, offset = 0): Promise<ListSessionsResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || payload.error || 'Không thể tải danh sách phiên chat');
    }

    return payload.data as ListSessionsResponse;
  },

  async getSessionMessages(sessionId: number, limit = 100, offset = 0): Promise<ListMessagesResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || payload.error || 'Không thể tải tin nhắn của phiên chat');
    }

    return payload.data as ListMessagesResponse;
  },

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const body = {
      question: request.question,
      includeRecentAnalysis: request.includeRecentAnalysis ?? true,
      ...(request.sessionId ? { sessionId: request.sessionId } : {}),
    };

    const response = await fetch(`${API_BASE_URL}/chat/medical`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || payload.error || 'Không thể gửi tin nhắn');
    }

    return payload.data as SendMessageResponse;
  },
};

export type { ListSessionsResponse, ListMessagesResponse, SendMessageResponse };
export type { CreateSessionResponse };
export { chatService };
