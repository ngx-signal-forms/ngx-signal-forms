/**
 * Form model for the brand-theming demo. A small workspace-settings form with
 * one field per stateful color the theming guide calls out: two blocking
 * errors (required, then required + pattern), a non-blocking warning, and an
 * always-disabled field. There is no dedicated focus-only field — the fourth
 * stateful color, focus, is demonstrated by tabbing into any of these fields.
 */
export interface BrandThemingModel {
  /** Always required — exercises the blocking-error (danger) color. */
  teamName: string;
  /** Required + pattern-validated — a second blocking-error surface. */
  workspaceSlug: string;
  /** Non-blocking — exercises the warning color once the budget is high. */
  monthlyBudget: number | null;
  /** Always disabled — exercises the disabled background/opacity. */
  legacyWorkspaceId: string;
}

export const initialBrandThemingModel: BrandThemingModel = {
  teamName: '',
  workspaceSlug: '',
  monthlyBudget: null,
  legacyWorkspaceId: 'WS-1042',
};
