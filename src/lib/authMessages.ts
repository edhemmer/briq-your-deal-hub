type AuthLikeError = {
  message?: string;
  status?: number;
  code?: string;
};

export function getAuthMessage(error: AuthLikeError | Error | null | undefined): string {
  const message = String(error?.message ?? "").trim();
  const status = typeof (error as AuthLikeError | undefined)?.status === "number" ? (error as AuthLikeError).status : undefined;
  const code = String((error as AuthLikeError | undefined)?.code ?? "").toLowerCase();
  const lower = message.toLowerCase();

  if (status === 429 || code.includes("rate") || lower.includes("rate") || lower.includes("too many")) {
    return "Too many attempts. Wait a few minutes before trying again.";
  }

  if (lower.includes("invalid") || lower.includes("credentials")) {
    return "The email or password was not accepted. Check the password or use password reset.";
  }

  if (lower.includes("email not confirmed") || lower.includes("confirm your email")) {
    return "Confirm your email address, then sign in again.";
  }

  if (lower.includes("already") || lower.includes("registered") || lower.includes("exists")) {
    return "That email already has a BRIX account. Sign in or use password reset.";
  }

  if (lower.includes("expired") || lower.includes("invalid refresh token") || lower.includes("invalid token")) {
    return "That secure link expired. Request a new password reset email.";
  }

  if (lower.includes("failed to fetch") || lower.includes("network") || lower.includes("offline")) {
    return "Network connection failed. Check internet access and try again.";
  }

  return message || "Something went wrong. Try again or contact support.";
}
