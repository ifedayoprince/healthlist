"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { buildSeedState } from "./mock-data";
import { listingById } from "./intake";
import type {
  AppState,
  Assessment,
  AssessmentInput,
  IntakeRequest,
  Listing,
  PaymentMethod,
  User,
} from "./types";
import { deriveNameFromEmail, uid } from "./utils";

const STORAGE_KEY = "healthlist.mock.v1";

type SignInResult = {
  user: User;
  created: boolean;
};

type StoreContextValue = {
  ready: boolean;
  users: User[];
  assessments: Assessment[];
  intakes: IntakeRequest[];
  paymentMethods: PaymentMethod[];
  sessionUser: User | null;
  signIn: (email: string, password: string) => SignInResult;
  signOut: () => void;
  completeAssessment: (input: AssessmentInput) => void;
  assessmentFor: (userId: string) => Assessment | undefined;
  intakesFor: (userId: string) => IntakeRequest[];
  paymentsFor: (userId: string) => PaymentMethod[];
  userById: (userId: string) => User | undefined;
  listingById: (listingId: string) => Listing | undefined;
  removeIntakeProduct: (intakeId: string, listingId: string) => void;
  submitIntake: (
    intakeId: string,
    answers?: Record<string, string>,
  ) => void;
  cancelIntake: (intakeId: string) => void;
  decideIntake: (intakeId: string, decision: "approved" | "declined") => void;
  addPaymentMethod: (input: {
    last4: string;
    expiry: string;
    brand: string;
  }) => void;
  removePaymentMethod: (paymentMethodId: string) => void;
  setDefaultPayment: (paymentMethodId: string) => void;
  resetDemo: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => buildSeedState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppState>;
        if (parsed && Array.isArray(parsed.users)) {
          // Hydrate the mock store from localStorage after mounting. This is an
          // external-system sync, not derived render state.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setState({
            ...buildSeedState(),
            ...parsed,
            users: parsed.users,
            assessments: Array.isArray(parsed.assessments)
              ? parsed.assessments
              : [],
            intakes: Array.isArray(parsed.intakes) ? parsed.intakes : [],
            paymentMethods: Array.isArray(parsed.paymentMethods)
              ? parsed.paymentMethods
              : [],
            sessionUserId: parsed.sessionUserId ?? null,
          });
        }
      }
    } catch {
      // Corrupt or unavailable storage: start from the seed.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be full or unavailable. The demo still works in memory.
    }
  }, [state, ready]);

  const sessionUser =
    state.users.find((user) => user.id === state.sessionUserId) ?? null;

  const signIn = useCallback(
    (email: string, password: string): SignInResult => {
      void password; // Mock auth: any password is accepted.
      const normalized = email.trim().toLowerCase();
      const existing = state.users.find((user) => user.email === normalized);

      if (existing) {
        setState((current) => ({
          ...current,
          sessionUserId: existing.id,
        }));
        return { user: existing, created: false };
      }

      const user: User = {
        id: uid("usr"),
        name: deriveNameFromEmail(normalized),
        email: normalized,
        createdAt: new Date().toISOString(),
      };

      setState((current) => ({
        ...current,
        users: [...current.users, user],
        sessionUserId: user.id,
      }));

      return { user, created: true };
    },
    [state.users],
  );

  const signOut = useCallback(() => {
    setState((current) => ({ ...current, sessionUserId: null }));
  }, []);

  const completeAssessment = useCallback((input: AssessmentInput) => {
    setState((current) => {
      const userId = current.sessionUserId;
      if (!userId) return current;

      const assessment: Assessment = {
        ...input,
        id: `asm_${userId}`,
        userId,
        completedAt: new Date().toISOString(),
      };
      const hasAssessment = current.assessments.some(
        (item) => item.userId === userId,
      );

      return {
        ...current,
        assessments: hasAssessment
          ? current.assessments.map((item) =>
              item.userId === userId ? assessment : item,
            )
          : [...current.assessments, assessment],
        users: input.fullName.trim()
          ? current.users.map((user) =>
              user.id === userId
                ? { ...user, name: input.fullName.trim() }
                : user,
            )
          : current.users,
      };
    });
  }, []);

  const assessmentFor = useCallback(
    (userId: string) =>
      state.assessments.find((assessment) => assessment.userId === userId),
    [state.assessments],
  );

  const intakesFor = useCallback(
    (userId: string) =>
      state.intakes
        .filter((intake) => intake.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [state.intakes],
  );

  const paymentsFor = useCallback(
    (userId: string) =>
      state.paymentMethods.filter((method) => method.userId === userId),
    [state.paymentMethods],
  );

  const userById = useCallback(
    (userId: string) => state.users.find((user) => user.id === userId),
    [state.users],
  );

  const removeIntakeProduct = useCallback(
    (intakeId: string, listingId: string) => {
      setState((current) => ({
        ...current,
        intakes: current.intakes.map((intake) =>
          intake.id === intakeId
            ? {
                ...intake,
                products: intake.products.filter(
                  (product) => product.listingId !== listingId,
                ),
              }
            : intake,
        ),
      }));
    },
    [],
  );

  const submitIntake = useCallback(
    (intakeId: string, answers?: Record<string, string>) => {
      setState((current) => ({
        ...current,
        intakes: current.intakes.map((intake) =>
          intake.id === intakeId && intake.status === "pending"
            ? {
                ...intake,
                status: "pending",
                submittedAt: intake.submittedAt ?? new Date().toISOString(),
                additionalAnswers: {
                  ...intake.additionalAnswers,
                  ...answers,
                },
              }
            : intake,
        ),
      }));
    },
    [],
  );

  const cancelIntake = useCallback((intakeId: string) => {
    setState((current) => ({
      ...current,
      intakes: current.intakes.map((intake) =>
        intake.id === intakeId && intake.status === "pending"
          ? { ...intake, status: "cancelled" }
          : intake,
      ),
    }));
  }, []);

  const decideIntake = useCallback(
    (intakeId: string, decision: "approved" | "declined") => {
      setState((current) => ({
        ...current,
        intakes: current.intakes.map((intake) =>
          intake.id === intakeId
            ? {
                ...intake,
                status: decision,
                reviewedAt: new Date().toISOString(),
              }
            : intake,
        ),
      }));
    },
    [],
  );

  const addPaymentMethod = useCallback(
    (input: { last4: string; expiry: string; brand: string }) => {
      setState((current) => {
        const userId = current.sessionUserId;
        if (!userId) return current;

        const existing = current.paymentMethods.filter(
          (method) => method.userId === userId,
        );
        const method: PaymentMethod = {
          id: uid("pm"),
          userId,
          brand: input.brand,
          last4: input.last4,
          expiry: input.expiry,
          isDefault: existing.length === 0,
        };

        return {
          ...current,
          paymentMethods: [...current.paymentMethods, method],
        };
      });
    },
    [],
  );

  const removePaymentMethod = useCallback((paymentMethodId: string) => {
    setState((current) => {
      const target = current.paymentMethods.find(
        (method) => method.id === paymentMethodId,
      );
      if (!target) return current;

      const remaining = current.paymentMethods.filter(
        (method) => method.id !== paymentMethodId,
      );

      if (!target.isDefault) {
        return { ...current, paymentMethods: remaining };
      }

      const nextDefault = remaining.find(
        (method) => method.userId === target.userId,
      );

      return {
        ...current,
        paymentMethods: remaining.map((method) =>
          method.id === nextDefault?.id ? { ...method, isDefault: true } : method,
        ),
      };
    });
  }, []);

  const setDefaultPayment = useCallback((paymentMethodId: string) => {
    setState((current) => {
      const target = current.paymentMethods.find(
        (method) => method.id === paymentMethodId,
      );
      if (!target) return current;

      return {
        ...current,
        paymentMethods: current.paymentMethods.map((method) =>
          method.userId === target.userId
            ? { ...method, isDefault: method.id === paymentMethodId }
            : method,
        ),
      };
    });
  }, []);

  const resetDemo = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
    setState(buildSeedState());
  }, []);

  const value: StoreContextValue = {
    ready,
    users: state.users,
    assessments: state.assessments,
    intakes: state.intakes,
    paymentMethods: state.paymentMethods,
    sessionUser,
    signIn,
    signOut,
    completeAssessment,
    assessmentFor,
    intakesFor,
    paymentsFor,
    userById,
    listingById,
    removeIntakeProduct,
    submitIntake,
    cancelIntake,
    decideIntake,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPayment,
    resetDemo,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useApp() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useApp must be used inside a StoreProvider");
  }
  return context;
}
