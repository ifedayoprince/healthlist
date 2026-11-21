"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { McpConnectModal } from "@/components/mcp-connect-modal";
import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";
import {
  Button,
  Field,
  Input,
  Modal,
  ProductThumb,
  StatusBadge,
} from "@/components/ui";
import {
  CardIcon,
  LinkIcon,
  PlusIcon,
  SparkleIcon,
} from "@/components/icons";
import { displayStatus, intakeListings } from "@/lib/intake";
import { useApp } from "@/lib/store";
import type { IntakeRequest, PaymentMethod } from "@/lib/types";
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
  const {
    sessionUser,
    intakesFor,
    paymentsFor,
    removePaymentMethod,
    setDefaultPayment,
    signOut,
  } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("intakes");
  const [mcpOpen, setMcpOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  if (!sessionUser) return null;

  const intakes = intakesFor(sessionUser.id);
  const payments = paymentsFor(sessionUser.id);

  return (
    <div className="min-h-svh bg-white">
      <SiteHeader
        user={sessionUser}
        onConnect={() => setMcpOpen(true)}
        onPayments={() => setTab("payments")}
        onSignOut={() => {
          signOut();
          router.replace("/");
        }}
      />

      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-10 sm:px-6 sm:pt-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
          Your healthlist
        </p>
        <h1 className="mt-3 font-serif text-[42px] leading-[1.05] tracking-[-0.02em] sm:text-[56px]">
          Welcome, {firstName(sessionUser.name)}.
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
            {intakes.length === 0 ? (
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
                    <IntakeCard key={intake.id} intake={intake} />
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
              <Button size="sm" onClick={() => setPaymentOpen(true)}>
                <PlusIcon className="size-4" />
                Add method
              </Button>
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
                <Button
                  className="mt-6"
                  onClick={() => setPaymentOpen(true)}
                >
                  <PlusIcon className="size-4" />
                  Add payment method
                </Button>
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
          <Link href="/doctor" className="transition hover:text-brand">
            Doctor console →
          </Link>
          <ResetDemo />
        </div>
      </main>

      <McpConnectModal open={mcpOpen} onClose={() => setMcpOpen(false)} />
      <AddPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
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

function IntakeCard({ intake }: { intake: IntakeRequest }) {
  const listings = intakeListings(intake);
  const status = displayStatus(intake);
  const actionable = intake.status === "pending" && !intake.submittedAt;

  const hint =
    actionable
      ? "Action needed — review and submit"
      : intake.status === "pending"
        ? "Submitted — waiting for a doctor"
        : intake.status === "approved"
          ? "Approved — your order is moving ahead"
          : intake.status === "declined"
            ? "Not approved — open to see the doctor's note"
            : "Cancelled";

  return (
    <Link
      href={`/intake/${intake.id}`}
      className="group block rounded-[22px] border border-line bg-white p-5 transition hover:border-brand/30 hover:bg-[#fcfefe] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              {intake.id}
            </span>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>
          <h3 className="mt-3 truncate font-serif text-[25px] leading-tight sm:text-[28px]">
            {listings.map((listing) => listing.name).join(", ") ||
              "No products selected"}
          </h3>
          <p className="mt-1.5 text-sm text-muted">
            Created {formatDate(intake.createdAt)}
            {intake.submittedAt
              ? ` · Submitted ${formatDate(intake.submittedAt)}`
              : ""}
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {listings.slice(0, 2).map((listing) => (
            <ProductThumb
              key={listing.id}
              listing={listing}
              className="size-14 rounded-[10px]"
            />
          ))}
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
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addPaymentMethod } = useApp();
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

    addPaymentMethod({
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

function ResetDemo() {
  const { resetDemo } = useApp();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        if (!confirming) {
          setConfirming(true);
          return;
        }
        resetDemo();
        router.replace("/");
      }}
      onBlur={() => setConfirming(false)}
      className={cn(
        "transition hover:text-brand",
        confirming && "font-medium text-[#c25d5d]",
      )}
    >
      {confirming ? "Click again to reset the demo" : "Reset demo data"}
    </button>
  );
}
