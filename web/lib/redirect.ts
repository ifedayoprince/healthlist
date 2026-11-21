const REDIRECT_KEY = "healthlist.redirect";

export function rememberRedirect(path: string) {
  try {
    window.sessionStorage.setItem(REDIRECT_KEY, path);
  } catch {
    // Session storage can be unavailable in private browsing. Ignore.
  }
}

export function peekRedirect() {
  try {
    return window.sessionStorage.getItem(REDIRECT_KEY);
  } catch {
    return null;
  }
}

export function consumeRedirect() {
  const path = peekRedirect();
  try {
    window.sessionStorage.removeItem(REDIRECT_KEY);
  } catch {
    // Ignore.
  }
  return path;
}
