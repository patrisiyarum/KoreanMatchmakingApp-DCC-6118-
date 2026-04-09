import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'lm_userId';

type AuthContextValue = {
  userId: string | null;
  setUserId: (id: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(() => {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(STORAGE_KEY);
  });

  const setUserId = useCallback((id: string | null) => {
    setUserIdState(id);
    if (typeof sessionStorage === 'undefined') return;
    if (id) sessionStorage.setItem(STORAGE_KEY, id);
    else sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const logout = useCallback(() => setUserId(null), [setUserId]);

  const value = useMemo(
    () => ({ userId, setUserId, logout }),
    [userId, setUserId, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
