"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AuthShell,
  Button,
  Field,
  Input,
  PageLoader,
  PasswordInput,
} from "@/components/ui";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { consumeRedirect } from "@/lib/redirect";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const { ready, user, pendingAssessment, signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const redirecting = useRef(false);

  useEffect(() => {
    if (!ready || !user || redirecting.current) return;

    if (user.role === "DOCTOR") {
      consumeRedirect();
      router.replace("/doctor");
      return;
    }

    if (pendingAssessment) {
      router.replace("/assessment");
      return;
    }

    const next = consumeRedirect();
    router.replace(next ?? "/dashboard");
  }, [ready, user, pendingAssessment, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (mode === "signup" && !name.trim()) {
      setError("Add your full name to create your account.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address to continue.");
      return;
    }
    if (!password) {
      setError("Enter a password to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const { response, user: sessionUser } =
        mode === "signup"
          ? await signUp({
              name: name.trim(),
              email: trimmedEmail,
              password,
            })
          : await signIn({
              email: trimmedEmail,
              password,
            });

      redirecting.current = true;

      if (sessionUser.role === "DOCTOR") {
        consumeRedirect();
        router.replace("/doctor");
        return;
      }

      if (response.hasPendingAssessment) {
        router.replace("/assessment");
        return;
      }

      const next = consumeRedirect();
      router.replace(next ?? "/dashboard");
    } catch (cause) {
      setError(errorMessage(cause));
      setSubmitting(false);
    }
  };

  if (!ready || user) return <PageLoader />;

  return (
    <AuthShell footer="Your health details stay private to you and the doctor reviewing your request.">
      <div className="flex flex-1 flex-col pt-14 sm:pt-24">
        <h1 className="font-serif text-[46px] leading-none tracking-[-0.02em] sm:text-[54px]">
          Welcome
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-muted">
          {mode === "signin"
            ? "Sign in to review your intake requests."
            : "Create your account, then take a short health assessment."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8" noValidate>
          <div className="space-y-7">
            {mode === "signup" ? (
              <Field label="Full name" htmlFor="name">
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={submitting}
                />
              </Field>
            ) : null}

            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="john@acme.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={submitting}
              />
            </Field>

            <Field
              label="Password"
              htmlFor="password"
              hint={
                mode === "signup"
                  ? "Use 8+ characters with uppercase, lowercase, a number, and a symbol."
                  : undefined
              }
            >
              <PasswordInput
                id="password"
                name="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                placeholder="**********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
              />
            </Field>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-[#c25d5d]" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            size="lg"
            type="submit"
            className="mt-10 w-full"
            disabled={submitting}
          >
            {submitting
              ? "Checking…"
              : mode === "signup"
                ? "Create account"
                : "Continue"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((current) => (current === "signin" ? "signup" : "signin"));
            setError("");
          }}
          disabled={submitting}
          className="mt-7 self-center text-sm text-muted transition hover:text-brand disabled:opacity-50"
        >
          {mode === "signin" ? (
            <>
              New here?{" "}
              <span className="font-medium text-brand">Create an account</span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span className="font-medium text-brand">Sign in</span>
            </>
          )}
        </button>
      </div>
    </AuthShell>
  );
}
