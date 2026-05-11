import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthUser = {
  id: string;
  displayName: string;
  email: string;
};

type AuthState = {
  user: AuthUser | null;
  login: (email: string, password: string) => void;
  register: (displayName: string, email: string, password: string) => void;
  logout: () => void;
};

function assertValidCredentials(email: string, password: string) {
  if (!email.includes('@')) {
    throw new Error('Email is invalid.');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (email, password) => {
        assertValidCredentials(email, password);
        const displayName = email.split('@')[0] || 'Listener';

        set({
          user: {
            id: `local-user-${email.toLowerCase()}`,
            displayName,
            email: email.toLowerCase(),
          },
        });
      },
      register: (displayName, email, password) => {
        assertValidCredentials(email, password);

        if (displayName.trim().length < 2) {
          throw new Error('Display name must be at least 2 characters.');
        }

        set({
          user: {
            id: `local-user-${email.toLowerCase()}`,
            displayName: displayName.trim(),
            email: email.toLowerCase(),
          },
        });
      },
      logout: () => set({ user: null }),
    }),
    {
      name: 'music-platform-auth',
    },
  ),
);
