let globalUniqueIdCounter = 0;

export function createUniqueId(prefix: string): string {
  return `${prefix}-${++globalUniqueIdCounter}`;
}
