/**
 * Representative form model — text + select + checkbox covers the renderer
 * slots, control semantics opt-ins, and warnings rendering called out in PRD #40.
 */
export interface ProfileFormModel {
  email: string;
  role: string;
  newsletter: boolean;
}

export interface RoleOption {
  readonly label: string;
  readonly value: string;
}

export const ROLE_OPTIONS: readonly RoleOption[] = [
  { label: 'Frontend developer', value: 'frontend' },
  { label: 'Backend developer', value: 'backend' },
  { label: 'Designer', value: 'designer' },
  { label: 'Product manager', value: 'product' },
];
