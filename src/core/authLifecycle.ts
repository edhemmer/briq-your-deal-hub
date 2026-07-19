export type AuthMode = "sign_in" | "sign_up" | "reset_request" | "reset_complete" | "change_password";

export type AuthValidationResult = {
  isValid: boolean;
  fields: Partial<Record<"email" | "password" | "passwordConfirm" | "currentPassword" | "fullName", string>>;
  summary: string[];
};

export type SafeAuthError = {
  kind: "invalid_credentials" | "rate_limited" | "offline" | "network" | "session_expired" | "workspace" | "unknown";
  message: string;
};

export function validateAuthInput(input: { email: string; password: string; passwordConfirm?: string; currentPassword?: string; fullName?: string }, mode: AuthMode): AuthValidationResult {
  const fields: AuthValidationResult["fields"] = {};
  const summary: string[] = [];
  const email = input.email.trim();

  const requiresEmail = mode !== "reset_complete" && mode !== "change_password";

  if (requiresEmail && !email) {
    fields.email = "Enter your email address.";
  } else if (requiresEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fields.email = "Enter a valid email address.";
  }

  if (mode === "change_password" && !input.currentPassword) {
    fields.currentPassword = "Enter your current password.";
  }

  if (mode === "reset_request") {
    // Email-only flow.
  } else if (!input.password) {
    fields.password = "Enter your password.";
  } else if ((mode === "sign_up" || mode === "reset_complete" || mode === "change_password") && input.password.length < 8) {
    fields.password = "Use at least 8 characters.";
  }

  if (mode === "reset_complete" || mode === "change_password") {
    if (!input.passwordConfirm) {
      fields.passwordConfirm = "Confirm your new password.";
    } else if (input.password && input.passwordConfirm !== input.password) {
      fields.passwordConfirm = "Passwords must match.";
    }
  }

  if (mode === "sign_up" && !input.fullName?.trim()) {
    fields.fullName = "Enter your name.";
  }

  if (fields.email) summary.push(fields.email);
  if (fields.fullName) summary.push(fields.fullName);
  if (fields.currentPassword) summary.push(fields.currentPassword);
  if (fields.password) summary.push(fields.password);
  if (fields.passwordConfirm) summary.push(fields.passwordConfirm);

  return { isValid: summary.length === 0, fields, summary };
}

export function safeAuthError(error: unknown): SafeAuthError {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return {
      kind: "offline",
      message: "You appear to be offline. Your form is still here. Reconnect and try again.",
    };
  }

  const rawMessage = getMessage(error).toLowerCase();

  if (rawMessage.includes("invalid") || rawMessage.includes("credentials") || rawMessage.includes("login")) {
    return {
      kind: "invalid_credentials",
      message: "Email or password is incorrect.",
    };
  }

  if (rawMessage.includes("rate") || rawMessage.includes("too many") || rawMessage.includes("429")) {
    return {
      kind: "rate_limited",
      message: "Too many attempts. Wait a few minutes, then try again.",
    };
  }

  if (isSessionFailure(error)) {
    return {
      kind: "session_expired",
      message: "Your session has expired. Sign in again to continue.",
    };
  }

  if (rawMessage.includes("fetch") || rawMessage.includes("network") || rawMessage.includes("failed to")) {
    return {
      kind: "network",
      message: "BRIX could not reach the authentication service. Try again when your connection is stable.",
    };
  }

  if (rawMessage.includes("workspace")) {
    return {
      kind: "workspace",
      message: "BRIX could not prepare your workspace. Retry setup to continue.",
    };
  }

  return {
    kind: "unknown",
    message: "BRIX could not complete that authentication step. Try again.",
  };
}

export function isSessionFailure(error: unknown) {
  const rawMessage = getMessage(error).toLowerCase();
  const status = typeof error === "object" && error !== null && "status" in error ? Number((error as { status?: unknown }).status) : undefined;
  return (
    status === 401 ||
    status === 403 ||
    rawMessage.includes("jwt") ||
    rawMessage.includes("expired") ||
    rawMessage.includes("revoked") ||
    rawMessage.includes("refresh token") ||
    rawMessage.includes("sign in before") ||
    rawMessage.includes("violates foreign key constraint") ||
    rawMessage.includes("auth.users") ||
    rawMessage.includes("session changed")
  );
}

function getMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  if (typeof error === "string") return error;
  return "";
}
