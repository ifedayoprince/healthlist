import { apiFetch } from "./client";
import type {
  IntakeListEntry,
  IntakeListPayload,
  IntakeSession,
  SubmitIntakeInput,
} from "./types";

export function getIntake(key: string) {
  return apiFetch<IntakeSession>(`/intake/${encodeURIComponent(key)}`);
}

export function submitIntake(input: SubmitIntakeInput) {
  return apiFetch<{ success: string }>("/intake/submit", {
    method: "POST",
    json: input,
  });
}

export async function listIntakes(): Promise<IntakeListEntry[]> {
  const payload = await apiFetch<IntakeListPayload>("/intake");

  if (Array.isArray(payload)) return payload;
  return payload.data ?? payload.intakes ?? payload.items ?? [];
}

export function intakeTitle(entry: IntakeListEntry) {
  const names = (entry.listings ?? [])
    .map((listing) => {
      const document = listing.documents?.[0];
      return document?.name || listing.name || listing.slug || listing.brand;
    })
    .filter((name): name is string => Boolean(name));

  return names.length > 0 ? names.join(", ") : "Intake request";
}

export function intakeSubtitle(entry: IntakeListEntry) {
  const names = (entry.listings ?? [])
    .map((listing) => listing.brand)
    .filter((brand): brand is string => Boolean(brand));

  return names.length > 0 ? [...new Set(names)].join(" · ") : "Sent by your assistant";
}

export function intakeStatusMeta(status: IntakeListEntry["status"]) {
  switch (status) {
    case "APPROVED":
      return { label: "Approved", tone: "success" as const };
    case "REJECTED":
      return { label: "Not approved", tone: "danger" as const };
    case "IN_REVIEW":
      return { label: "In review", tone: "pending" as const };
    case "PENDING":
    default:
      return { label: "Pending", tone: "pending" as const };
  }
}

export function intakeHint(status: IntakeListEntry["status"]) {
  switch (status) {
    case "APPROVED":
      return "Approved — your order is moving ahead";
    case "REJECTED":
      return "Not approved — open to see the doctor's note";
    case "IN_REVIEW":
      return "Submitted — waiting for a doctor";
    case "PENDING":
    default:
      return "Action needed — review and submit";
  }
}
