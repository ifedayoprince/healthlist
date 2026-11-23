"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { McpConnectModal } from "@/components/mcp-connect-modal";
import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";
import {
  Button,
  Field,
  Input,
  Modal,
  StatusBadge,
} from "@/components/ui";
import {
  CardIcon,
  LinkIcon,
  PlusIcon,
  SparkleIcon,
} from "@/components/icons";
import { ApiError, errorMessage } from "@/lib/api/client";
import {
  intakeHint,
  intakeStatusMeta,
  intakeSubtitle,
  intakeTitle,
  listIntakes,
} from "@/lib/api/intake";
import type { IntakeListEntry } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { useApp } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";
import { cn, detectCardBrand, firstName, formatDate } from "@/lib/utils";

type Tab = "intakes" | "payments";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

function Dashboard() {
  const { user, signOut } = useAuth();
  const {
    paymentsFor,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPayment,
    resetDemo,
  } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("intakes");
  const [mcpOpen, setMcpOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [intakes, setIntakes] = useState<IntakeListEntry[]>([]);
  const [intakeState, setIntakeState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [intakeError, setIntakeError] = useState("");

  const loadIntakes = useCallback(async () => {
    try {
      const data = await listIntakes();
      setIntakes(data);
      setIntakeState("ready");
      setIntakeError("");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) {
        setIntakes([]);
        setIntakeState("ready");
        setIntakeError("");
        return;
      }
      setIntakeError(errorMessage(cause));
      setIntakeState("error");
    }
  }, []);

  useEffect(() => {
    // Loading from the API is an external-system sync on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadIntakes();

    const onIntakesUpdated = () => {
      void loadIntakes();
    };
    window.addEventListener("healthlist:intakes-updated", onIntakesUpdated);
    return () => {
      window.removeEventListener(
        "healthlist:intakes-updated",
        onIntakesUpdated,
      );
    };
  }, [loadIntakes]);

  if (!user) return null;

  const payments = paymentsFor(user.id);

  const addSamplePayment = () => {
    const samples = [
      { brand: "Visa", last4: "4242", expiry: "12/29" },
      { brand: "Mastercard", last4: "4444", expiry: "09/28" },
      { brand: "Amex", last4: "0005", expiry: "03/30" },
    ];
    addPaymentMethod(samples[payments.length % samples.length], user.id);
    setTab("payments");
  };

  const retry = () => {
    setIntakeState("loading");
    void loadIntakes();
  };

  return (
    <div className="min-h-svh bg-white">
      <SiteHeader
        user={user}
        onConnect={() => setMcpOpen(true)}
        onPayments={() => setTab("payments")}
        showDoctorLink={user.role === "DOCTOR"}
        onSignOut={() => {
          void signOut().then(() => router.replace("/"));
        }}
      />

      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-10 sm:px-6 sm:pt-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
          Your healthlist
        </p>
        <h1 className="mt-3 font-serif text-[42px] leading-[1.05] tracking-[-0.02em] sm:text-[56px]">
          Welcome, {firstName(user.name)}.
        </h1>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[17px]">
          Your assistant finds products. You review the details and request a
          doctor&apos;s approval here.
        </p>

        <div className="mt-10 flex gap-7 border-b border-line">
          <TabButton
            active={tab === "intakes"}
            onClick={() => setTab("intakes")}
            label="Intake requests"
            count={intakes.length}
          />
          <TabButton
            active={tab === "payments"}
            onClick={() => setTab("payments")}
            label="Payment methods"
            count={payments.length}
          />
        </div>

        {tab === "intakes" ? (
          <div className="mt-7">
            {intakeState === "loading" ? (
              <div className="space-y-3">
                <div className="h-36 animate-pulse rounded-[22px] bg-[#f4f7f7]" />
                <div className="h-36 animate-pulse rounded-[22px] bg-[#f4f7f7]" />
              </div>
            ) : intakeState === "error" ? (
              <div className="rounded-[24px] border border-[#f0dada] bg-[#fdf8f8] px-6 py-10 text-center">
                <h2 className="font-serif text-2xl">
                  We couldn&apos;t load your requests
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                  {intakeError}
                </p>
                <Button variant="outline" className="mt-5" onClick={retry}>
                  Try again
                </Button>
              </div>
            ) : intakes.length === 0 ? (
              <EmptyIntakes onConnect={() => setMcpOpen(true)} />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted">
                    {intakes.length}{" "}
                    {intakes.length === 1 ? "request" : "requests"}
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <span className="size-1.5 rounded-full bg-brand" />
                    From your assistant
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {intakes.map((intake) => (
                    <IntakeCard key={intake.id || intake.key} intake={intake} />
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-4 rounded-[20px] border border-line bg-[#fbfcfc] p-5 sm:flex-row sm:items-center">
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-mint-soft text-brand">
                    <SparkleIcon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Need something else?</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      Ask your assistant to find another product and create a
                      new intake request. It will appear here.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMcpOpen(true)}
                    className="shrink-0"
                  >
                    <LinkIcon className="size-4" />
                    Assistant setup
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="mt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {payments.length === 0
                  ? "No payment methods yet"
                  : `${payments.length} saved ${
                      payments.length === 1 ? "method" : "methods"
                    }`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addSamplePayment}
                >
                  <SparkleIcon className="size-4" />
                  Sample card
                </Button>
                <Button size="sm" onClick={() => setPaymentOpen(true)}>
                  <PlusIcon className="size-4" />
                  Add method
                </Button>
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="mt-4 rounded-[24px] border border-dashed border-[#d7dbdd] bg-[#fbfcfc] px-6 py-12 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-mint-soft text-brand">
                  <CardIcon className="size-6" />
                </div>
                <h2 className="mt-5 font-serif text-[28px] leading-tight">
                  Add a payment method
                </h2>
                <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
                  You&apos;re not charged when you request a review. A saved card
                  is only used once a doctor approves your order.
                </p>
                <Button className="mt-6" onClick={() => setPaymentOpen(true)}>
                  <PlusIcon className="size-4" />
                  Add payment method
                </Button>
                <button
                  type="button"
                  onClick={addSamplePayment}
                  className="mx-auto mt-3 block text-sm font-medium text-brand underline-offset-4 transition hover:underline"
                >
                  Or use a sample card
                </button>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {payments.map((method) => (
                  <PaymentCard
                    key={method.id}
                    method={method}
                    onDefault={() => setDefaultPayment(method.id)}
                    onRemove={() => removePaymentMethod(method.id)}
                  />
                ))}
              </div>
            )}

            <p className="mt-6 text-xs leading-relaxed text-muted">
              Prototype only — no card details are sent anywhere or stored
              outside this browser.
            </p>
          </div>
        )}

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-xs text-muted">
          {user.role === "DOCTOR" ? (
            <Link href="/doctor" className="transition hover:text-brand">
              Doctor console →
            </Link>
          ) : (
            <span />
          )}
          <ResetDemo onReset={resetDemo} />
        </div>
      </main>

      <McpConnectModal open={mcpOpen} onClose={() => setMcpOpen(false)} />
      <AddPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSave={(input) => addPaymentMethod(input, user.id)}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px flex items-center gap-2 border-b-2 pb-3.5 text-[15px] font-medium transition",
        active
          ? "border-brand text-foreground"
          : "border-transparent text-muted hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px]",
          active ? "bg-mint-soft text-brand" : "bg-[#f1f3f4] text-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function IntakeCard({ intake }: { intake: IntakeListEntry }) {
  const status = intakeStatusMeta(intake.status);
  const hint = intakeHint(intake.status);
  const title = intakeTitle(intake);
  const subtitle = intakeSubtitle(intake);
  const images = (intake.listings ?? [])
    .map((listing) => listing.productImage)
    .filter((image): image is string => Boolean(image))
    .slice(0, 2);

  return (
    <Link
      href={`/i/${encodeURIComponent(intake.key)}`}
      className="group block rounded-[22px] border border-line bg-white p-5 transition hover:border-brand/30 hover:bg-[#fcfefe] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              {intake.key}
            </span>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>
          <h3 className="mt-3 truncate font-serif text-[25px] leading-tight sm:text-[28px]">
            {title}
          </h3>
          <p className="mt-1.5 text-sm text-muted">
            {subtitle} · Created {formatDate(intake.createdAt ?? undefined)}
            {intake.submittedAt
              ? ` · Submitted ${formatDate(intake.submittedAt)}`
              : ""}
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {images.map((image) => (
            <div
              key={image}
              className="size-14 rounded-[10px] bg-mint bg-cover bg-center"
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
          {images.length === 0 ? (
            <>
              <div className="size-14 rounded-[10px] bg-mint" />
              {title.includes(",") ? (
                <div className="size-14 rounded-[10px] bg-mint" />
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
        <p className="text-sm text-muted">{hint}</p>
        <span className="shrink-0 text-sm font-medium text-brand">
          Open request →
        </span>
      </div>
    </Link>
  );
}

function EmptyIntakes({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#d7dbdd] bg-[#fbfcfc] px-6 py-12 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-mint-soft text-brand">
        <SparkleIcon className="size-6" />
      </div>
      <h2 className="mt-5 font-serif text-[28px] leading-tight">
        No intake requests yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
        Ask your assistant to search Healthlist, then say “create an intake
        request”. The link it gives you will show up here.
      </p>
      <div className="mt-7 flex justify-center">
        <Button onClick={onConnect}>
          <LinkIcon className="size-4" />
          Connect your assistant
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted">
        Already connected? Ask it to create an intake request.
      </p>
    </div>
  );
}

function PaymentCard({
  method,
  onDefault,
  onRemove,
}: {
  method: PaymentMethod;
  onDefault: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-[22px] border border-line p-5">
      <div className="flex items-center gap-4">
        <div className="grid h-11 w-14 shrink-0 place-items-center rounded-[10px] bg-[#f4f6f7] text-[#4d5356]">
          <CardIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">
            {method.brand} •••• {method.last4}
          </p>
          <p className="text-sm text-muted">Expires {method.expiry}</p>
        </div>
        {method.isDefault ? (
          <span className="ml-auto shrink-0 rounded-full bg-mint-soft px-2.5 py-1 text-[11px] font-medium text-brand">
            Default
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex gap-4 border-t border-line pt-3 text-sm">
        {!method.isDefault ? (
          <button
            type="button"
            onClick={onDefault}
            className="text-muted transition hover:text-foreground"
          >
            Set as default
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          className="text-[#cf7070] transition hover:underline"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function AddPaymentModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: {
    last4: string;
    expiry: string;
    brand: string;
  }) => void;
}) {
  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const digits = cardNumber.replace(/\D/g, "");
    if (!cardholder.trim()) {
      setError("Add the name shown on the card.");
      return;
    }
    if (digits.length < 12) {
      setError("Enter a valid card number.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError("Enter the expiry as MM/YY.");
      return;
    }
    if (cvc.replace(/\D/g, "").length < 3) {
      setError("Enter the 3-digit security code.");
      return;
    }

    onSave({
      last4: digits.slice(-4),
      expiry,
      brand: detectCardBrand(digits),
    });

    setCardholder("");
    setCardNumber("");
    setExpiry("");
    setCvc("");
    setError("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="payment-modal-title">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
        Payment methods
      </p>
      <h2
        id="payment-modal-title"
        className="mt-2 font-serif text-[32px] leading-tight"
      >
        Add a card
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        No charge is made today. Your card is only used after a doctor approves
        your order.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        <Field label="Name on card" htmlFor="cardholder">
          <Input
            id="cardholder"
            placeholder="Amara Okafor"
            value={cardholder}
            onChange={(event) => setCardholder(event.target.value)}
          />
        </Field>

        <Field label="Card number" htmlFor="card-number">
          <Input
            id="card-number"
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={(event) => {
              const digits = event.target.value
                .replace(/\D/g, "")
                .slice(0, 16);
              setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
            }}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Expiry" htmlFor="expiry">
            <Input
              id="expiry"
              inputMode="numeric"
              placeholder="MM/YY"
              maxLength={5}
              value={expiry}
              onChange={(event) => {
                const digits = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 4);
                setExpiry(
                  digits.length > 2
                    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                    : digits,
                );
              }}
            />
          </Field>
          <Field label="CVC" htmlFor="cvc">
            <Input
              id="cvc"
              inputMode="numeric"
              placeholder="123"
              maxLength={4}
              value={cvc}
              onChange={(event) =>
                setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
            />
          </Field>
        </div>

        {error ? (
          <p className="text-sm text-[#c25d5d]" role="alert">
            {error}
          </p>
        ) : null}

        <Button size="lg" type="submit" className="w-full">
          Save card
        </Button>
      </form>

      <p className="mt-3 text-center text-xs text-muted">
        Prototype only — card details stay in your browser.
      </p>
    </Modal>
  );
}

function ResetDemo({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        if (!confirming) {
          setConfirming(true);
          return;
        }
        onReset();
      }}
      onBlur={() => setConfirming(false)}
      className={cn(
        "transition hover:text-brand",
        confirming && "font-medium text-[#c25d5d]",
      )}
    >
      {confirming
        ? "Click again to reset demo payments"
        : "Reset demo payments"}
    </button>
  );
}
