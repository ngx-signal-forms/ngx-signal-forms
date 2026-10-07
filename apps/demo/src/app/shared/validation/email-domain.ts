/**
 * Extracts a normalized domain from an email address.
 * This does not validate the email address format.
 */
export function getEmailDomain(email: string): string | null {
  const [, domain] = email.trim().toLowerCase().split('@');
  return domain || null;
}
