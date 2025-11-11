import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  user: {
    id: number;
    email: string;
    name: string;
  } | null;
  isLoading: boolean;
  setAuth: (token: string, user: AuthState['user']) => Promise<void>;
  clearAuth: () => Promise<void>;
  initialize: () => Promise<void>;
}

const TOKEN_KEY = 'hosoyte_token';
const USER_KEY = 'hosoyte_user';

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,
  isLoading: true,
  setAuth: async (token: string, user: AuthState['user']) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (user) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    }
    set({ token, user, isLoading: false });
  },
  clearAuth: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null, isLoading: false });
  },
  initialize: async (): Promise<void> => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);
      if (storedToken && storedUser) {
        set({
          token: storedToken,
          user: JSON.parse(storedUser),
          isLoading: false,
        });
        return;
      }
    } catch (error) {
      console.error('Failed to restore session', error);
    }
    set({ token: null, user: null, isLoading: false });
  },
}));
