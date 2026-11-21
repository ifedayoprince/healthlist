"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  AuthShell,
  Button,
  Field,
  Input,
  PageLoader,
} from "@/components/ui";
import { consumeRedirect } from "@/lib/redirect";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/site";
import { useApp } from "@/lib/store";

export default function LoginPage() {
  const { ready, sessionUser, signIn, assessmentFor } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !sessionUser) return;

    if (!assessmentFor(sessionUser.id)) {
      router.replace("/assessment");
      return;
    }

    const next = consumeRedirect();
    router.replace(next ?? "/dashboard");
  }, [ready, sessionUser, assessmentFor, router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address to continue.");
      return;
    }
    if (!password) {
      setError("Enter a password to continue.");
      return;
    }

    signIn(trimmed, password);
  };

  if (!ready || sessionUser) return <PageLoader />;

  return (
    <AuthShell footer="Prototype sign-in — no real accounts or passwords are stored.">
      <div className="flex flex-1 flex-col pt-14 sm:pt-24">
        <h1 className="font-serif text-[46px] leading-none tracking-[-0.02em] sm:text-[54px]">
          Welcome
        </h1>

        <form onSubmit={handleSubmit} className="mt-10 sm:mt-12" noValidate>
          <div className="space-y-9 sm:space-y-10">
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="john@acme.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="**********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-[#c25d5d]" role="alert">
              {error}
            </p>
          ) : null}

          <Button size="lg" type="submit" className="mt-10 w-full">
            Continue
          </Button>
        </form>

        <div className="mt-8 rounded-[18px] bg-[#f6f8f9] p-5 text-sm leading-relaxed text-muted">
          <p>
            New here? Continue with any email and we&apos;ll create your account
            and start your health assessment.
          </p>
          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_EMAIL);
              setPassword(DEMO_PASSWORD);
              setError("");
            }}
            className="mt-3 font-medium text-brand underline decoration-brand/30 underline-offset-4 transition hover:decoration-brand"
          >
            Use the demo patient account
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
