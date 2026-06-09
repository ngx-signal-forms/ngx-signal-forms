import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { createOnInvalidHandler } from '@ngx-signal-forms/toolkit';
import {
  createErrorMessageSignal,
  type ResolvedFieldError,
} from '@ngx-signal-forms/toolkit/headless';

interface PasswordModel {
  password: string;
}

const passwordSchema = schema<PasswordModel>((path) => {
  required(path.password);
  minLength(path.password, 8);

  validate(path.password, (ctx) => {
    const value = ctx.value();
    if (value && value.length > 0 && value.length < 12) {
      return {
        kind: 'warn:weak-password',
        message: 'Consider using 12+ characters for a stronger password',
      };
    }
    return null;
  });

  validate(path.password, (ctx) => {
    const value = ctx.value();
    if (value && value.length > 0 && !/[^a-zA-Z0-9]/u.test(value)) {
      return {
        kind: 'warn:no-special-chars',
        message: 'Adding symbols (!, @, #…) improves password strength',
      };
    }
    return null;
  });
});

const REGISTRY_VERBOSE = {
  required: 'Password is required — please enter a value',
  minLength: (params: Record<string, unknown>) =>
    `Password must be at least ${String(params['minLength'])} characters long`,
  'warn:weak-password': 'Weak password — consider using 12 or more characters',
  'warn:no-special-chars':
    'No special characters detected — adding symbols (!, @, #) improves security',
} as const;

const REGISTRY_TERSE = {
  required: 'Required',
  minLength: (params: Record<string, unknown>) =>
    `Min ${String(params['minLength'])} chars`,
  'warn:weak-password': 'Weak password',
  'warn:no-special-chars': 'Add symbols for strength',
} as const;

function ariaDescribedBy(errors: readonly ResolvedFieldError[]): string | null {
  const ids = errors.map((e) => e.id);
  return ids.length > 0 ? ids.join(' ') : null;
}

@Component({
  selector: 'ngx-error-message-signal',

  imports: [FormField, FormRoot],
  styles: `
    .demo-section {
      border: 1px solid var(--ngx-border-color, #e5e7eb);
      border-radius: 0.5rem;
      padding: 1rem;
      margin-block-start: 1rem;
    }

    .demo-section__title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--ngx-muted-color, #6b7280);
      margin-block-end: 0.5rem;
    }

    .error-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .error-item {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
    }

    .error-item--blocking {
      color: #dc2626;
      background: #fef2f2;
    }

    .error-item--warning {
      color: #d97706;
      background: #fffbeb;
    }

    :host-context(.dark) .error-item--blocking {
      color: #fca5a5;
      background: rgb(127 29 29 / 0.2);
    }

    :host-context(.dark) .error-item--warning {
      color: #fcd34d;
      background: rgb(120 53 15 / 0.2);
    }

    .registry-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .registry-badge--verbose {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .registry-badge--terse {
      background: #d1fae5;
      color: #065f46;
    }
  `,
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">createErrorMessageSignal</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        A reactive primitive that combines visibility gating, 3-tier message
        resolution, and stable per-error DOM IDs — without a directive.
      </p>

      <form [formRoot]="passwordForm" class="max-w-xl space-y-6">
        <!-- ── Registry toggle ───────────────────────────────────────── -->
        <div
          class="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600"
        >
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Registry:
            <span
              class="registry-badge"
              [class.registry-badge--verbose]="verboseRegistry()"
              [class.registry-badge--terse]="!verboseRegistry()"
            >
              {{ verboseRegistry() ? 'verbose' : 'terse' }}
            </span>
          </span>
          <button
            type="button"
            class="btn-secondary text-xs"
            data-testid="toggle-registry"
            (click)="toggleRegistry()"
          >
            Swap registry
          </button>
          <span class="text-xs text-gray-400 dark:text-gray-500">
            Messages re-resolve reactively
          </span>
        </div>

        <!-- ── Password input ────────────────────────────────────────── -->
        <div class="space-y-2">
          <label for="password" class="text-sm font-medium"> Password * </label>
          <input
            id="password"
            type="text"
            class="form-input"
            [formField]="passwordForm.password"
            placeholder="Enter a password…"
            autocomplete="new-password"
            data-testid="password-input"
            [attr.aria-invalid]="blockingErrors().length > 0 ? 'true' : null"
            [attr.aria-describedby]="ariaDescribedByBlocking()"
          />
        </div>

        <!-- ── Mode 1: blocking errors only (default) ────────────────── -->
        <div class="demo-section" data-testid="section-blocking">
          <p class="demo-section__title">
            Mode 1 — blocking errors only (default)
          </p>
          <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
            <code
              class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800"
            >
              createErrorMessageSignal(() =&gt; field())
            </code>
          </p>

          <ul class="error-list" role="list" aria-label="Blocking errors">
            @for (entry of blockingErrors(); track entry.kind) {
              <li
                [id]="entry.id"
                class="error-item error-item--blocking"
                role="alert"
                [attr.data-testid]="'blocking-error-' + entry.kind"
              >
                {{ entry.message }}
              </li>
            }
          </ul>

          @if (blockingErrors().length === 0) {
            <p class="text-xs text-gray-400 dark:text-gray-500">
              No blocking errors to display
            </p>
          }
        </div>

        <!-- ── Mode 2: blocking + warnings ──────────────────────────── -->
        <div class="demo-section" data-testid="section-all">
          <p class="demo-section__title">
            Mode 2 — blocking + warnings
            <code
              class="rounded bg-gray-100 px-1 py-0.5 text-xs normal-case dark:bg-gray-800"
            >
              includeWarnings: true
            </code>
          </p>

          <ul
            class="error-list"
            role="list"
            aria-label="All errors and warnings"
          >
            @for (entry of allErrors(); track entry.kind) {
              <li
                [id]="entry.id"
                class="error-item"
                [class.error-item--blocking]="!entry.kind.startsWith('warn:')"
                [class.error-item--warning]="entry.kind.startsWith('warn:')"
                [attr.data-testid]="'all-error-' + entry.kind"
              >
                {{ entry.message }}
              </li>
            }
          </ul>

          @if (allErrors().length === 0) {
            <p class="text-xs text-gray-400 dark:text-gray-500">
              No errors or warnings to display
            </p>
          }
        </div>

        <!-- ── Mode 3: warnings only in an aside ─────────────────────── -->
        <div class="demo-section" data-testid="section-warnings">
          <p class="demo-section__title">
            Mode 3 — warnings only
            <code
              class="rounded bg-gray-100 px-1 py-0.5 text-xs normal-case dark:bg-gray-800"
            >
              includeWarnings: 'only'
            </code>
          </p>

          <aside aria-label="Password warnings">
            <ul class="error-list" role="list">
              @for (entry of warningsOnly(); track entry.kind) {
                <li
                  [id]="entry.id"
                  class="error-item error-item--warning"
                  role="status"
                  aria-live="polite"
                  [attr.data-testid]="'warning-' + entry.kind"
                >
                  {{ entry.message }}
                </li>
              }
            </ul>

            @if (warningsOnly().length === 0) {
              <p class="text-xs text-gray-400 dark:text-gray-500">
                No warnings to display
              </p>
            }
          </aside>
        </div>

        <div class="flex gap-4">
          <button
            type="submit"
            class="btn-primary"
            [disabled]="passwordForm().submitting()"
          >
            @if (passwordForm().submitting()) {
              Submitting...
            } @else {
              Submit
            }
          </button>
          <button type="button" (click)="reset()" class="btn-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ErrorMessageSignalComponent {
  readonly #initialData: PasswordModel = { password: '' };
  readonly #model = signal(this.#initialData);

  readonly passwordForm = form(this.#model, passwordSchema, {
    submission: {
      action: async (data) => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 400);
        });
        console.log('Submitted:', data());
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  protected readonly verboseRegistry = signal(true);
  protected readonly activeRegistry = signal<
    typeof REGISTRY_VERBOSE | typeof REGISTRY_TERSE
  >(REGISTRY_VERBOSE);

  // 1. Blocking errors only (default)
  protected readonly blockingErrors = createErrorMessageSignal(
    () => this.passwordForm.password(),
    { fieldName: 'password', errorMessages: this.activeRegistry },
  );

  // 2. Blocking + warnings
  protected readonly allErrors = createErrorMessageSignal(
    () => this.passwordForm.password(),
    {
      fieldName: 'password-all',
      includeWarnings: true,
      errorMessages: this.activeRegistry,
    },
  );

  // 3. Warnings only
  protected readonly warningsOnly = createErrorMessageSignal(
    () => this.passwordForm.password(),
    {
      fieldName: 'password-warnings',
      includeWarnings: 'only',
      errorMessages: this.activeRegistry,
    },
  );

  // aria-describedby for the password input — derived from blocking error IDs
  protected readonly ariaDescribedByBlocking = computed(() =>
    ariaDescribedBy(this.blockingErrors()),
  );

  protected toggleRegistry(): void {
    const next = this.verboseRegistry() ? REGISTRY_TERSE : REGISTRY_VERBOSE;
    this.activeRegistry.set(next);
    this.verboseRegistry.update((v) => !v);
  }

  protected reset(): void {
    this.passwordForm().reset();
    this.#model.set(this.#initialData);
  }
}
