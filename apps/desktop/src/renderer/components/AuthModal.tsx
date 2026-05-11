import { X } from 'lucide-react';
import type { FormEvent } from 'react';
import type { AuthMode } from '../types';

type AuthModalProps = {
  authError: string;
  authMode: AuthMode;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AuthModal({ authError, authMode, onClose, onModeChange, onSubmit }: AuthModalProps) {
  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={onSubmit}>
        <button className="modal-close" type="button" onClick={onClose}>
          <X size={18} />
        </button>
        <h2>{authMode === 'login' ? 'Sign in' : 'Create account'}</h2>
        {authMode === 'register' && <input name="displayName" placeholder="Display name" />}
        <input name="email" placeholder="Email" type="email" />
        <input name="password" placeholder="Password" type="password" />
        {authError && <p className="form-error">{authError}</p>}
        <button className="primary-action" type="submit">
          {authMode === 'login' ? 'Sign in' : 'Register'}
        </button>
        <button
          className="text-button"
          type="button"
          onClick={() => onModeChange(authMode === 'login' ? 'register' : 'login')}
        >
          {authMode === 'login' ? 'Need an account?' : 'Already have an account?'}
        </button>
      </form>
    </div>
  );
}
