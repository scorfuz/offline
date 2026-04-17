import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createAuthClient, type LoginCredentials } from "@offline/api-client";
import type { AuthSession } from "@offline/contracts";

const UNAUTHENTICATED_SESSION: AuthSession = {
  type: "unauthenticated",
};

interface AuthContextValue {
  session: AuthSession;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: UNAUTHENTICATED_SESSION,
  isLoading: true,
  isSubmitting: false,
  error: null,
  login: async () => {
    throw new Error("AuthProvider is missing");
  },
  logout: async () => {
    throw new Error("AuthProvider is missing");
  },
  refreshSession: async () => {
    throw new Error("AuthProvider is missing");
  },
  clearError: () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
  apiOrigin: string;
}

export function AuthProvider({ children, apiOrigin }: AuthProviderProps) {
  const authClient = useMemo(
    () => createAuthClient({ baseUrl: apiOrigin }),
    [apiOrigin]
  );
  const [session, setSession] = useState<AuthSession>(UNAUTHENTICATED_SESSION);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    setError(null);

    try {
      const nextSession = await authClient.getCurrentUser();
      setSession(nextSession);
    } catch (err) {
      setSession(UNAUTHENTICATED_SESSION);
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  useEffect(() => {
    setIsLoading(true);
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const nextSession = await authClient.login(credentials);
        setSession(nextSession);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [authClient]
  );

  const logout = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await authClient.logout();
      setSession(UNAUTHENTICATED_SESSION);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [authClient]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isSubmitting,
        error,
        login,
        logout,
        refreshSession,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
