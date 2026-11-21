"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { DocIcon } from "@/components/icons";
import {
  BrandLockup,
  Button,
  Modal,
  PageLoader,
  StatusBadge,
} from "@/components/ui";
import { displayStatus, intakeListings } from "@/lib/intake";
import { useApp } from "@/lib/store";
import type { IntakeRequest, User } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

type Filter = "all" | "pending" | "approved" | "declined";

export default function DoctorPage() {
  const {
    ready,
    intakes,
    userById,
    assessmentFor,
    decideIntake,
    resetDemo,
  } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [assessmentUser, setAssessmentUser] = useState<User | null>(null);
  const [resetArmed, setResetArmed] = useState(false);

  if (!ready) return <PageLoader />;

  const pending = intakes.filter((intake) => intake.status === "pending");
  const approved = intakes.filter((intake) => intake.status === "approved");
  const declined = intakes.filter((intake) => intake.status === "declined");

  const sorted = [...intakes].sort((a, b) => {
    const rank = (intake: IntakeRequest) =>
      intake.status === "pending" ? 0 : 1;
    const rankDifference = rank(a) - rank(b);
    if (rankDifference !== 0) return rankDifference;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filtered =
    filter === "all"
      ? sorted
      : sorted.filter((intake) => intake.status === filter);

  const assessment = assessmentUser
    ? assessmentFor(assessmentUser.id)
    : undefined;

  return (
    <div className="min-h-svh bg-white">
      <header className="sticky top-0 z-40 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[108px] bg-gradient-to-b from-white via-white/90 to-transparent"
        />
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-[22px] border border-[#e3e9ea] bg-white/90 px-2.5 py-2 shadow-[0_18px_45px_-26px_rgba(13,60,66,0.45)] backdrop-blur-xl sm:rounded-full sm:pl-4">
          <BrandLockup href="/" />
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center rounded-full bg-[#fff7e8] px-3 py-1.5 text-[11px] font-medium text-[#9d7c3b] sm:inline-flex">
              Clinician access
            </span>
            <Link
              href="/"
              className="rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-medium transition hover:bg-[#f8fafb]"
            >
              Back to site
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-10 sm:px-6 sm:pt-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
          Healthlist clinicians
        </p>
        <h1 className="mt-3 font-serif text-[40px] leading-[1.05] tracking-[-0.02em] sm:text-[52px]">
          Intake reviews
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted sm:text-[17px]">
          Review the products patients requested, check the assessment they
          completed, then approve or decline the request.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat label="Pending" value={pending.length} />
          <Stat label="Approved" value={approved.length} />
          <Stat label="Declined" value={declined.length} />
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="All"
            count={intakes.length}
          />
          <FilterButton
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
            label="Pending"
            count={pending.length}
          />
          <FilterButton
            active={filter === "approved"}
            onClick={() => setFilter("approved")}
            label="Approved"
            count={approved.length}
          />
          <FilterButton
            active={filter === "declined"}
            onClick={() => setFilter("declined")}
            label="Declined"
            count={declined.length}
          />
        </div>

        <div className="mt-5 space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#d7dbdd] bg-[#fbfcfc] px-6 py-12 text-center text-muted">
              No requests in this view.
            </div>
          ) : (
            filtered.map((intake) => {
              const user = userById(intake.userId);
              return (
                <DoctorCase
                  key={intake.id}
                  intake={intake}
                  user={user}
                  onAssessment={() => user && setAssessmentUser(user)}
                  onDecide={decideIntake}
                />
              );
            })
          )}
        </div>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-xs text-muted">
          <p>
            Prototype console — decisions update the patient&apos;s dashboard in
            this browser.
          </p>
          <button
            type="button"
            onClick={() => {
              if (!resetArmed) {
                setResetArmed(true);
                return;
              }
              resetDemo();
              setResetArmed(false);
            }}
            onBlur={() => setResetArmed(false)}
            className={cn(
              "transition hover:text-brand",
              resetArmed && "font-medium text-[#c25d5d]",
            )}
          >
            {resetArmed ? "Click again to reset the demo" : "Reset demo data"}
          </button>
        </footer>
      </main>

      <Modal
        open={Boolean(assessmentUser)}
        onClose={() => setAssessmentUser(null)}
        labelledBy="assessment-modal-title"
        className="sm:max-w-[620px]"
      >
        {assessmentUser ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                  Patient assessment
                </p>
                <h2
                  id="assessment-modal-title"
                  className="mt-2 font-serif text-[32px] leading-tight"
                >
                  {assessmentUser.name}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {assessmentUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssessmentUser(null)}
                className="rounded-full px-3 py-1.5 text-sm text-muted transition hover:bg-[#f2f4f5] hover:text-foreground"
              >
                Close
              </button>
            </div>

            {assessment ? (
              <div className="mt-6 space-y-5">
                <Section title="About">
                  <Row label="Full name" value={assessment.fullName} />
                  <Row label="Biological sex" value={assessment.sex} />
                  <Row
                    label="Height / weight"
                    value={[
                      assessment.heightCm ? `${assessment.heightCm} cm` : "",
                      assessment.weightKg ? `${assessment.weightKg} kg` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                </Section>

                <Section title="Medical basics">
                  <Row label="Date of birth" value={assessment.dateOfBirth} />
                  <Row label="Blood group" value={assessment.bloodGroup} />
                </Section>

                <Section title="Diagnosed conditions">
                  {assessment.conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {assessment.conditions.map((condition) => (
                        <span
                          key={condition}
                          className="rounded-full bg-mint-soft px-3 py-1 text-xs font-medium text-brand"
                        >
                          {condition}
                        </span>
                      ))}
                      {assessment.otherCondition ? (
                        <span className="rounded-full bg-[#f4f6f7] px-3 py-1 text-xs text-muted">
                          {assessment.otherCondition}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">None reported</p>
                  )}
                </Section>

                <Section title="Medications & allergies">
                  <Row label="Medications" value={assessment.medications} />
                  <Row label="Allergies" value={assessment.allergies} />
                </Section>

                <Section title="Lifestyle">
                  <Row label="Smoking / vaping" value={assessment.smoking} />
                  <Row label="Alcohol" value={assessment.alcohol} />
                  <Row label="Pregnancy" value={assessment.pregnancy} />
                </Section>

                <p className="border-t border-line pt-4 text-xs text-muted">
                  Completed {formatDate(assessment.completedAt)}
                </p>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">
                This patient hasn&apos;t completed an assessment yet.
              </p>
            )}

            <Button
              className="mt-6 w-full"
              onClick={() => setAssessmentUser(null)}
            >
              Done
            </Button>
          </>
        ) : null}
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-line px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1 font-serif text-[32px] leading-none">{value}</p>
    </div>
  );
}

function FilterButton({
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
        "rounded-full border px-4 py-2 text-sm transition",
        active
          ? "border-brand bg-brand text-white"
          : "border-line bg-white text-muted hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "ml-2 text-xs",
          active ? "text-white/70" : "text-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function DoctorCase({
  intake,
  user,
  onAssessment,
  onDecide,
}: {
  intake: IntakeRequest;
  user?: User;
  onAssessment: () => void;
  onDecide: (intakeId: string, decision: "approved" | "declined") => void;
}) {
  const { listingById } = useApp();
  const listings = intakeListings(intake);
  const status = displayStatus(intake);
  const pending = intake.status === "pending";
  const canDecide = pending && Boolean(intake.submittedAt);
  const answers = Object.entries(intake.additionalAnswers ?? {});

  return (
    <div className="rounded-[22px] border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              {intake.id}
            </span>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            {pending && !intake.submittedAt ? (
              <StatusBadge tone="neutral">Not submitted</StatusBadge>
            ) : null}
          </div>
          <h2 className="mt-3 font-serif text-[26px] leading-tight">
            {user?.name ?? "Unknown patient"}
          </h2>
          <p className="text-sm text-muted">{user?.email ?? "—"}</p>
        </div>
        <p className="text-sm text-muted">
          {intake.submittedAt
            ? `Submitted ${formatDate(intake.submittedAt)}`
            : `Created ${formatDate(intake.createdAt)}`}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {listings.map((listing) => (
          <span
            key={listing.id}
            className="rounded-full bg-[#f4f6f7] px-3 py-1.5 text-sm text-[#3f4649]"
          >
            {listing.name}
            <span className="text-muted"> · {listing.brand}</span>
          </span>
        ))}
      </div>

      {answers.length > 0 ? (
        <details className="mt-3 rounded-[14px] bg-[#f7f9fa] px-4 py-3 text-sm">
          <summary className="cursor-pointer text-muted">
            Additional info provided ({answers.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {answers.map(([key, value]) => {
              const [listingId, questionKey] = key.split(":");
              const listing = listingById(listingId);
              const question = listing?.additionalQuestions?.find(
                (item) => item.key === questionKey,
              );
              return (
                <li key={key}>
                  <span className="text-muted">
                    {question?.label ?? questionKey}:
                  </span>{" "}
                  {value}
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}

      {intake.doctorNote ? (
        <p className="mt-3 rounded-[14px] bg-[#fbfaf7] px-4 py-3 text-sm leading-relaxed text-[#6f6a5f]">
          <span className="font-medium">Note:</span> {intake.doctorNote}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={onAssessment}
          disabled={!user}
        >
          <DocIcon className="size-4" />
          View assessment
        </Button>

        {pending ? (
          <>
            <Button
              size="sm"
              disabled={!canDecide}
              onClick={() => onDecide(intake.id, "approved")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!canDecide}
              onClick={() => onDecide(intake.id, "declined")}
              className="border-[#efd0d0] text-[#b85252] hover:bg-[#fdf1f1]"
            >
              Decline
            </Button>
            {!canDecide ? (
              <p className="text-xs text-muted">
                Waiting for the patient to request review.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted">
            {intake.status === "approved" ? "Approved" : "Declined"}
            {intake.reviewedAt ? ` ${formatDate(intake.reviewedAt)}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line pt-4">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        {title}
      </h3>
      <div className="mt-2.5 space-y-2 text-sm">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="text-right">{value?.trim() || "—"}</span>
    </div>
  );
}
