export function requireValue<T>(value: T | null, label: string): T {
  if (value === null) {
    throw new Error(`Expected ${label} to be available.`);
  }

  return value;
}
