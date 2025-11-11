import type { UserProfile } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://api.hsyt.org/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile & {
    id: number;
    email: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

class AuthService {
  private token: string | null = null;
  private userData: (UserProfile & { id: number; email: string }) | null = null;

  constructor() {
    // Load token and user data from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
    const storedUserData = localStorage.getItem('user_data');
    if (storedUserData) {
      try {
        this.userData = JSON.parse(storedUserData);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('user_data');
      }
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Đăng nhập thất bại');
      }

      // Store token and user data
      this.token = data.data.token;
      this.userData = data.data.user;
      localStorage.setItem('auth_token', this.token!);
      localStorage.setItem('user_data', JSON.stringify(this.userData));

      return data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Lỗi kết nối. Vui lòng thử lại.');
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Đăng ký thất bại');
      }

      // Store token and user data
      this.token = data.data.token;
      this.userData = data.data.user;
      localStorage.setItem('auth_token', this.token!);
      localStorage.setItem('user_data', JSON.stringify(this.userData));

      return data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Lỗi kết nối. Vui lòng thử lại.');
    }
  }

  logout(): void {
    this.token = null;
    this.userData = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  getToken(): string | null {
    return this.token;
  }

  getUserData(): (UserProfile & { id: number; email: string }) | null {
    return this.userData;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.userData;
  }

  // Helper method to make authenticated requests
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  static validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 6) {
      return { isValid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
    }
    
    if (password.length > 100) {
      return { isValid: false, message: 'Mật khẩu không được vượt quá 100 ký tự' };
    }

    return { isValid: true };
  }

  // Validate name
  static validateName(name: string): { isValid: boolean; message?: string } {
    if (name.trim().length < 2) {
      return { isValid: false, message: 'Tên phải có ít nhất 2 ký tự' };
    }
    
    if (name.trim().length > 100) {
      return { isValid: false, message: 'Tên không được vượt quá 100 ký tự' };
    }

    return { isValid: true };
  }
}

export const authService = new AuthService();
export default AuthService;
