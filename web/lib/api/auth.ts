import { apiFetch } from "./client";
import type {
  ApiUser,
  AuthenticateResponse,
  SigninInput,
  SignupInput,
} from "./types";

export function signIn(input: SigninInput) {
  return apiFetch<AuthenticateResponse>("/auth/signin", {
    method: "POST",
    json: input,
  });
}

export function signUp(input: SignupInput) {
  return apiFetch<AuthenticateResponse>("/auth/signup", {
    method: "POST",
    json: input,
  });
}

export function getSession() {
  return apiFetch<ApiUser>("/auth/session");
}

export function logout() {
  return apiFetch<{ success?: string }>("/auth/logout", {
    method: "POST",
  });
}
