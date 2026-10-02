import type { WizardDraft, WizardStepData } from '../../schemas/wizard.schemas';

/** Deep equality for plain draft data (the data is JSON-safe). */
export function isSameData(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * The `computation` of a draft slice that follows the committed data.
 *
 * - When a saved draft loads, the draft takes its in-progress value, or the
 *   committed value when the draft has none.
 * - Otherwise the draft follows the committed value. If the committed value
 *   equals what the draft holds, the draft keeps its object. A new object
 *   would reset the form field the user is in.
 */
export function linkDraft<K extends keyof WizardStepData>(key: K) {
  return (
    {
      committed,
      saved,
    }: { committed: WizardStepData[K]; saved: WizardDraft | undefined },
    previous?: {
      source: { saved: WizardDraft | undefined };
      value: WizardStepData[K];
    },
  ): WizardStepData[K] => {
    if (previous && previous.source.saved === saved) {
      return isSameData(previous.value, committed)
        ? previous.value
        : structuredClone(committed);
    }
    return structuredClone(saved?.inProgress?.[key] ?? committed);
  };
}
