// Client-safe password policy (no bcrypt — safe to import in browser pages).
// Returns a professionally formatted bulleted list of every unmet requirement,
// or null when the password satisfies all rules.

function collectMissing(password: string, minLength: number): string[] {
  const missing: string[] = [];
  if (password.length < minLength) missing.push(`At least ${minLength} characters`);
  if (!/[A-Z]/.test(password)) missing.push("One uppercase letter (A-Z)");
  if (!/[a-z]/.test(password)) missing.push("One lowercase letter (a-z)");
  if (!/[0-9]/.test(password)) missing.push("One number (0-9)");
  if (!/[^A-Za-z0-9]/.test(password)) missing.push("One special character (!@#$%^&*)");
  return missing;
}

function formatList(missing: string[]): string | null {
  if (missing.length === 0) return null;
  return "Password must include:\n" + missing.map((m) => `•  ${m}`).join("\n");
}

export function validatePasswordStrength(password: string): string | null {
  return formatList(collectMissing(password, 10));
}

export function validateAdminPassword(password: string): string | null {
  return formatList(collectMissing(password, 12));
}