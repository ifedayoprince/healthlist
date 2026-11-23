import { apiFetch } from "./client";
import type { AssessmentResponse } from "./types";

export function getAssessment() {
  return apiFetch<AssessmentResponse>("/assessment");
}

export function submitAnswer(questionKey: string, answer: string[]) {
  return apiFetch<{ success: string }>("/assessment/submit_answer", {
    method: "POST",
    json: { questionKey, answer },
  });
}

export function updateAnswer(questionKey: string, answer: string[]) {
  return apiFetch<{ success: string }>("/assessment/update_answer", {
    method: "POST",
    json: { questionKey, answer },
  });
}
