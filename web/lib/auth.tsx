"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getSession,
  logout,
  signIn as apiSignIn,
  signUp as apiSignUp,
} from "./api/auth";
import { getAssessment } from "./api/assessment";
import { ApiError } from "./api/client";
import type {
  ApiUser,
  AuthenticateResponse,
  SigninInput,
  SignupInput,
} from "./api/types";

type AuthContextValue = {
  ready: boolean;
  user: ApiUser | null;
  pendingAssessment: boolean | null;
  signIn: (
    input: SigninInput,
  ) => Promise<{ response: AuthenticateResponse; user: ApiUser }>;
  signUp: (
    input: SignupInput,
  ) => Promise<{ response: AuthenticateResponse; user: ApiUser }>;
  signOut: () => Promise<void>;
  completeAssessment: () => void;
  refreshAssessment: () => Promise<boolean | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [pendingAssessment, setPendingAssessment] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const session = await getSession();
        if (!active) return;
        setUser(session);

        try {
          const assessment = await getAssessment();
          if (active) {
            setPendingAssessment(
              assessment.preliminary.pending.length > 0,
            );
          }
        } catch (error) {
          if (!active) return;
          if (error instanceof ApiError && error.status === 401) {
            setUser(null);
          }
          setPendingAssessment(null);
        }
      } catch {
        if (!active) return;
        setUser(null);
        setPendingAssessment(null);
      } finally {
        if (active) setReady(true);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const establishSession = useCallback(
    async (response: AuthenticateResponse) => {
      const session = await getSession();
      setUser(session);
      setPendingAssessment(response.hasPendingAssessment);
      return { response, user: session };
    },
    [],
  );

  const signIn = useCallback(
    async (input: SigninInput) => establishSession(await apiSignIn(input)),
    [establishSession],
  );

  const signUp = useCallback(
    async (input: SignupInput) => establishSession(await apiSignUp(input)),
    [establishSession],
  );

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // The cookie is httpOnly. If logout is unavailable, clear the client
      // session and let the user continue; a refresh will restore the cookie.
    } finally {
      setUser(null);
      setPendingAssessment(null);
    }
  }, []);

  const completeAssessment = useCallback(() => {
    setPendingAssessment(false);
  }, []);

  const refreshAssessment = useCallback(async () => {
    try {
      const assessment = await getAssessment();
      const pending = assessment.preliminary.pending.length > 0;
      setPendingAssessment(pending);
      return pending;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        setPendingAssessment(null);
      }
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ready,
        user,
        pendingAssessment,
        signIn,
        signUp,
        signOut,
        completeAssessment,
        refreshAssessment,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
