# Labelless Form-Field Wrapper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ngx-form-field-wrapper` collapse its reserved label space in standard, outline, and horizontal layouts when no `<label>` is projected, plus ship a demo page and e2e coverage that also exposes narrow-input error behavior.

**Architecture:** Pure-CSS detection via `:has(.ngx-signal-form-field-wrapper__label label)` scoped to the wrapper's internal label div. Three small rulesets in `form-field-wrapper.scss` — one per layout — collapse the label area. No TypeScript changes, no new public input. Demo page demonstrates labelless usage patterns and documents today's narrow-input behavior; e2e verifies both.

**Tech Stack:** Angular Signal Forms, SCSS, Vitest (jsdom + browser), Playwright, Nx monorepo with pnpm.

---

## File Structure

**Library (`packages/toolkit/form-field/`):**

- **Modify** `form-field-wrapper.scss` — append a `LABEL-LESS LAYOUT` section with three scoped rulesets
- **Create** `form-field-wrapper.labelless.browser.spec.ts` — browser tests for real CSS evaluation (`:has()`, computed styles) — jsdom can't resolve `:has()` or stylesheet-applied display/padding
- **Modify** `THEMING.md` — add "Rendering without a label" section

**Demo (`apps/demo/src/app/04-form-field-wrapper/labelless-fields/`):** new folder — one file per responsibility, mirroring `custom-controls/`

- `labelless-fields.model.ts` — form model types
- `labelless-fields.validations.ts` — validator schema
- `labelless-fields.form.ts` — form component (section by section)
- `labelless-fields.html` — template with 5 sections (search, grouped, amount, comparison grid, narrow inputs)
- `labelless-fields.page.ts` — page wrapper with appearance/orientation toggles
- `labelless-fields.content.ts` — `ExampleCardConfig` content for the example cards
- `index.ts` — barrel exports matching `custom-controls/index.ts`

**Routing / metadata:**

- `apps/demo/src/app/app.routes.ts` — add route
- `packages/demo-shared/src/lib/routes.metadata.ts` — add `labellessFields` path + nav entry

**E2E (`apps/demo-e2e/src/`):**

- `page-objects/labelless-fields.page.ts` — page object
- `forms/04-form-field-wrapper/labelless-fields.spec.ts` — spec file

---

## Task 1: Library — Write failing browser tests for labelless CSS

**Files:**

- Create: `packages/toolkit/form-field/form-field-wrapper.labelless.browser.spec.ts`

- [ ] **Step 1: Create the browser spec file with failing tests**

```typescript
import { signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

const mockField = () =>
  signal({
    invalid: () => false,
    touched: () => false,
    errors: () => [],
  });

describe('NgxFormFieldWrapper — without a label', () => {
  it('hides the label div in the standard layout', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <input id="anon" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const labelDiv = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__label',
    );
    expect(labelDiv).toBeTruthy();
    expect(getComputedStyle(labelDiv!).display).toBe('none');
  });

  it('collapses top padding on the outline content container', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" appearance="outline">
        <input id="anon-outline" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const content = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__content',
    );
    expect(content).toBeTruthy();
    const paddingTop = parseFloat(getComputedStyle(content!).paddingTop);
    // With a label the stack is label-line-height (16px) + gap (0) +
    // padding-vertical (4px) = 20px. Without a label we want only the
    // 4px vertical padding. Assert well below the labelled value.
    expect(paddingTop).toBeLessThan(10);
  });

  it('collapses the horizontal label column in the standard layout', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" orientation="horizontal">
        <input id="anon-h" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const host = container.querySelector<HTMLElement>('ngx-form-field-wrapper');
    const input = container.querySelector<HTMLInputElement>('#anon-h');
    expect(host && input).toBeTruthy();
    // With a reserved label column, the input would sit ~8rem (128px) to
    // the right of the host. Without it, the input is flush left.
    const hostLeft = host!.getBoundingClientRect().left;
    const inputLeft = input!.getBoundingClientRect().left;
    expect(inputLeft - hostLeft).toBeLessThan(24);
  });

  it('keeps existing label behavior when a label is projected', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <label for="labelled">Labelled</label>
        <input id="labelled" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const labelDiv = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__label',
    );
    expect(getComputedStyle(labelDiv!).display).not.toBe('none');
  });
});
```

- [ ] **Step 2: Run tests — verify they FAIL**

Run: `pnpm nx run toolkit:test-browser -- --run form-field-wrapper.labelless.browser`

Expected: all four tests fail. The first three fail because no CSS rule collapses the label space today; the fourth should pass (control test).

- [ ] **Step 3: Commit the failing tests**

```bash
git add packages/toolkit/form-field/form-field-wrapper.labelless.browser.spec.ts
git commit -m "test(toolkit): add failing browser tests for labelless form-field layout"
```

---

## Task 2: Library — Implement labelless CSS rulesets

**Files:**

- Modify: `packages/toolkit/form-field/form-field-wrapper.scss` (append after line 889, at end of file)

- [ ] **Step 1: Append the LABEL-LESS LAYOUT section**

Add this block at the end of `packages/toolkit/form-field/form-field-wrapper.scss`:

```scss
// ============================================================================
// LABEL-LESS LAYOUT
// ============================================================================
// Collapse reserved label space when no <label> is projected.
// Detection is scoped to the internal label slot so a stray <label> inside a
// prefix/suffix projection does not trip the selector.
// Selection controls (checkbox/switch/radio-group) require labels for
// accessibility and intentionally keep their own layout.

// Standard vertical: hide the empty label div. Flex gap only applies
// between rendered children, so removing the div removes the gap too.
:host(.ngx-signal-form-field-wrapper--textual):not(
    :has(.ngx-signal-form-field-wrapper__label label)
  )
  .ngx-signal-form-field-wrapper__label {
  display: none;
}

// Outline: hide the label div and drop the top-padding reservation that
// accommodates the floating label.
:host(.ngx-signal-forms-outline.ngx-signal-form-field-wrapper--textual):not(
  :has(.ngx-signal-form-field-wrapper__label label)
) {
  --_outline-min-height: var(
    --ngx-form-field-outline-min-height,
    var(
      --ngx-form-field-min-height,
      calc(var(--_input-outline-line-height) + var(--_padding-vertical) * 2)
    )
  );

  .ngx-signal-form-field-wrapper__label {
    display: none;
  }

  .ngx-signal-form-field-wrapper__content {
    padding-top: var(--_padding-vertical);
  }
}

// Horizontal: collapse the grid to a single content column.
:host(.ngx-signal-form-field-wrapper--horizontal):not(
  :has(.ngx-signal-form-field-wrapper__label label)
) {
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'content'
    'assistive';
}

:host(
  .ngx-signal-form-field-wrapper--horizontal.ngx-signal-form-field-wrapper--messages-top
):not(:has(.ngx-signal-form-field-wrapper__label label)) {
  grid-template-areas:
    'messages'
    'content'
    'assistive';
}
```

- [ ] **Step 2: Run tests — verify they PASS**

Run: `pnpm nx run toolkit:test-browser -- --run form-field-wrapper.labelless.browser`

Expected: all four tests pass.

- [ ] **Step 3: Run the full toolkit unit test suite to catch regressions**

Run: `pnpm nx run toolkit:test` then `pnpm nx run toolkit:test-browser`

Expected: entire toolkit suite passes — the new CSS must not change anything when a label IS present.

- [ ] **Step 4: Commit**

```bash
git add packages/toolkit/form-field/form-field-wrapper.scss
git commit -m "feat(toolkit): collapse reserved label space when no <label> is projected"
```

---

## Task 3: Library — Document labelless behavior in THEMING.md

**Files:**

- Modify: `packages/toolkit/form-field/THEMING.md` (append a new section before the final closing content)

- [ ] **Step 1: Add a "Rendering without a label" section**

Append this section to `packages/toolkit/form-field/THEMING.md` at the end of the file:

```markdown
## Rendering without a label

When no `<label>` is projected into `ngx-form-field-wrapper`, the reserved
label space collapses automatically in all three textual appearances:

- **Standard** — the label slot is removed (`display: none`); the flex gap
  above the input also collapses.
- **Outline** — the floating-label slot inside the bordered container is
  dropped; `--_outline-min-height` shrinks to match the input's own
  line-height plus vertical padding.
- **Horizontal** — the grid collapses to a single content column; the
  input is flush against the wrapper's left edge.

Detection is pure CSS (`:has()`), so there is no opt-in. Selection
controls (`checkbox`, `switch`, `radio-group`) keep their own layouts and
still require a visible label for accessibility.

### Why you might still want to render an empty label

If you need rows of fields to align vertically in a grid regardless of
whether each row has a visible label, project an explicit empty label:

\`\`\`html
<ngx-form-field-wrapper [formField]="form.quantity">
<label for="quantity"></label>
<input id="quantity" type="number" [formField]="form.quantity" />
</ngx-form-field-wrapper>
\`\`\`

An empty `<label>` element still occupies the reserved space. For
accessibility, prefer giving the `<input>` an `aria-label` or
`aria-labelledby` so screen readers have a name to announce.
```

- [ ] **Step 2: Commit**

```bash
git add packages/toolkit/form-field/THEMING.md
git commit -m "docs(toolkit): document labelless form-field rendering"
```

---

## Task 4: Demo — Scaffold form model and validators

**Files:**

- Create: `apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.model.ts`
- Create: `apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.validations.ts`

- [ ] **Step 1: Create the model**

Write `apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.model.ts`:

```typescript
/**
 * Form model for the labelless-fields demo. Each field demonstrates a
 * different pattern where a wrapper-level <label> would feel redundant
 * given the surrounding context (search bar, grouped fields, narrow
 * numeric inputs).
 */
export interface LabellessFieldsModel {
  /** Section 1 — search input. */
  searchQuery: string;

  /** Section 2 — grouped phone number parts under a single heading. */
  phoneCountry: string;
  phoneNumber: string;
  phoneExtension: string;

  /** Section 3 — amount input, labelled by its card heading. */
  amount: number;

  /** Section 4 — same field used twice (with/without label). */
  comparison: string;

  /** Section 5 — narrow inputs where errors must escape the input width. */
  age: number;
  zipCode: string;
  /** Six-character OTP entered as a single string. */
  otp: string;
}

export const initialLabellessFieldsModel: LabellessFieldsModel = {
  searchQuery: '',
  phoneCountry: '',
  phoneNumber: '',
  phoneExtension: '',
  amount: 0,
  comparison: '',
  age: 0,
  zipCode: '',
  otp: '',
};
```

- [ ] **Step 2: Create the validation schema**

Write `apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.validations.ts`:

```typescript
import {
  max,
  min,
  minLength,
  pattern,
  required,
  schema,
} from '@angular/forms/signals';
import type { LabellessFieldsModel } from './labelless-fields.model';

/**
 * Validation schema for the labelless-fields demo. The narrow-input
 * section intentionally uses messages longer than the input so that the
 * error text must render wider than the input itself.
 */
export const labellessFieldsSchema = schema<LabellessFieldsModel>((path) => {
  // Phone group — require each part so the shared error region lights up.
  required(path.phoneCountry, { message: 'Country code is required' });
  minLength(path.phoneNumber, 7, {
    message: 'Phone number must be at least 7 digits',
  });

  // Amount — enforces a positive number so "Amount must be greater than 0"
  // renders below the currency input.
  min(path.amount, 1, { message: 'Amount must be greater than 0' });

  // Narrow inputs — messages are intentionally longer than the input.
  required(path.age, { message: 'Age is required' });
  min(path.age, 18, { message: 'Must be 18 or older' });
  max(path.age, 120, { message: 'Invalid age' });

  pattern(path.zipCode, /^\d{5}(-\d{4})?$/, {
    message: 'Format: 12345 or 12345-6789',
  });

  pattern(path.otp, /^\d{6}$/, {
    message: 'Enter all six digits',
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.model.ts apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.validations.ts
git commit -m "feat(demo): add labelless-fields model and validators"
```

---

## Task 5: Demo — Form component and template sections

**Files:**

- Create: `apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.form.ts`
- Create: `apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.html`

- [ ] **Step 1: Create the form component**

Write `apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.form.ts`:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  createSubmittedStatusTracker,
  NgxSignalFormToolkit,
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { initialLabellessFieldsModel } from './labelless-fields.model';
import { labellessFieldsSchema } from './labelless-fields.validations';

/**
 * Labelless Fields Demo Form.
 *
 * Renders five sections, each demonstrating a legitimate UI pattern where
 * a per-wrapper <label> would feel redundant:
 * 1. Search input with an icon prefix (accessible name via aria-label).
 * 2. Grouped fields under a shared heading (phone number split).
 * 3. Amount input labelled by its card heading.
 * 4. Side-by-side "with vs without label" comparison across appearances.
 * 5. Narrow inputs whose error messages must wrap beyond the input width.
 */
@Component({
  selector: 'ngx-labelless-fields',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  templateUrl: './labelless-fields.html',
  styles: `
    :host {
      display: block;
    }

    .labelless-section {
      border: 1px solid rgb(0 0 0 / 0.08);
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .labelless-section h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.75rem;
    }

    .phone-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.5rem;
      align-items: start;
    }

    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }

    .comparison-grid > div > p {
      font-size: 0.75rem;
      color: rgb(0 0 0 / 0.6);
      margin: 0 0 0.25rem;
    }

    .narrow-age input[id='age'] {
      max-width: 5ch;
    }

    .narrow-zip input[id='zipCode'] {
      max-width: 9ch;
    }

    .otp-row {
      display: flex;
      gap: 0.5rem;
    }

    .otp-row input {
      max-width: 2.5ch;
      text-align: center;
    }
  `,
})
export class LabellessFieldsFormComponent {
  readonly #submitAttempted = signal(false);

  readonly #handleInvalidSubmission = createOnInvalidHandler();

  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('standard');
  readonly orientation = input<FormFieldOrientation>('vertical');

  readonly #model = signal(initialLabellessFieldsModel);

  readonly labellessForm = form(this.#model, labellessFieldsSchema, {
    submission: {
      action: async () => null,
      onInvalid: (formTree) => {
        this.#submitAttempted.set(true);
        this.#handleInvalidSubmission(formTree);
      },
    },
  });

  protected readonly submittedStatus = createSubmittedStatusTracker(
    this.labellessForm,
    this.#submitAttempted,
  );
}
```

- [ ] **Step 2: Create the template**

Write `apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.html`:

```html
<form
  [formRoot]="labellessForm"
  ngxSignalForm
  [errorStrategy]="errorDisplayMode()"
  class="form-container"
>
  <!-- Section 1: Search input with icon prefix -->
  <section class="labelless-section">
    <h3>1. Search input (label replaced by placeholder + aria-label)</h3>
    <ngx-form-field-wrapper
      [appearance]="appearance()"
      [orientation]="orientation()"
      [formField]="labellessForm.searchQuery"
    >
      <svg
        prefix
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        id="searchQuery"
        type="search"
        aria-label="Search"
        placeholder="Search…"
        [formField]="labellessForm.searchQuery"
      />
    </ngx-form-field-wrapper>
  </section>

  <!-- Section 2: Grouped fields under a shared heading -->
  <section class="labelless-section">
    <h3 id="phone-heading">
      2. Phone number (shared heading, no per-field labels)
    </h3>
    <div class="phone-row" role="group" aria-labelledby="phone-heading">
      <ngx-form-field-wrapper
        [appearance]="appearance()"
        [formField]="labellessForm.phoneCountry"
      >
        <input
          id="phoneCountry"
          type="text"
          aria-label="Country code"
          placeholder="+1"
          [formField]="labellessForm.phoneCountry"
        />
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper
        [appearance]="appearance()"
        [formField]="labellessForm.phoneNumber"
      >
        <input
          id="phoneNumber"
          type="tel"
          aria-label="Phone number"
          placeholder="555-0100"
          [formField]="labellessForm.phoneNumber"
        />
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper
        [appearance]="appearance()"
        [formField]="labellessForm.phoneExtension"
      >
        <input
          id="phoneExtension"
          type="text"
          aria-label="Extension"
          placeholder="ext"
          [formField]="labellessForm.phoneExtension"
        />
      </ngx-form-field-wrapper>
    </div>
  </section>

  <!-- Section 3: Amount input with currency suffix -->
  <section class="labelless-section">
    <h3>3. Amount (card heading provides the label)</h3>
    <ngx-form-field-wrapper
      appearance="outline"
      [formField]="labellessForm.amount"
    >
      <span prefix aria-hidden="true">$</span>
      <input
        id="amount"
        type="number"
        aria-label="Amount"
        [formField]="labellessForm.amount"
      />
      <span suffix aria-hidden="true">.00</span>
    </ngx-form-field-wrapper>
  </section>

  <!-- Section 4: Side-by-side with/without label -->
  <section class="labelless-section">
    <h3>4. With vs without label (selected appearance)</h3>
    <div class="comparison-grid">
      <div>
        <p>With label</p>
        <ngx-form-field-wrapper
          [appearance]="appearance()"
          [orientation]="orientation()"
          [formField]="labellessForm.comparison"
        >
          <label for="comparisonLabelled">Label</label>
          <input
            id="comparisonLabelled"
            type="text"
            [formField]="labellessForm.comparison"
          />
        </ngx-form-field-wrapper>
      </div>
      <div>
        <p>Without label</p>
        <ngx-form-field-wrapper
          [appearance]="appearance()"
          [orientation]="orientation()"
          [formField]="labellessForm.comparison"
        >
          <input
            id="comparisonLabelless"
            type="text"
            aria-label="Comparison value"
            [formField]="labellessForm.comparison"
          />
        </ngx-form-field-wrapper>
      </div>
    </div>
  </section>

  <!-- Section 5: Narrow inputs with wider error messages -->
  <section class="labelless-section">
    <h3>5. Narrow inputs (error text exceeds input width)</h3>

    <div class="narrow-age">
      <p>Age (must be 18–120):</p>
      <ngx-form-field-wrapper
        [appearance]="appearance()"
        [formField]="labellessForm.age"
      >
        <input
          id="age"
          type="number"
          aria-label="Age"
          [formField]="labellessForm.age"
        />
      </ngx-form-field-wrapper>
    </div>

    <div class="narrow-zip">
      <p>Zip code:</p>
      <ngx-form-field-wrapper
        [appearance]="appearance()"
        [formField]="labellessForm.zipCode"
      >
        <input
          id="zipCode"
          type="text"
          aria-label="Zip code"
          placeholder="12345"
          [formField]="labellessForm.zipCode"
        />
      </ngx-form-field-wrapper>
    </div>

    <div>
      <p>One-time passcode:</p>
      <ngx-form-field-wrapper
        [appearance]="appearance()"
        [formField]="labellessForm.otp"
      >
        <input
          id="otp"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          aria-label="One-time passcode"
          maxlength="6"
          [formField]="labellessForm.otp"
        />
      </ngx-form-field-wrapper>
    </div>
  </section>
</form>
```

- [ ] **Step 3: Build the demo to verify the component compiles**

Run: `pnpm nx build demo`

Expected: build succeeds. Any template/import errors fail here first.

- [ ] **Step 4: Commit**

```bash
git add apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.form.ts apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.html
git commit -m "feat(demo): add labelless-fields form component and template"
```

---

## Task 6: Demo — Page component, content, and barrel

**Files:**

- Create: `apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.content.ts`
- Create: `apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.page.ts`
- Create: `apps/demo/src/app/04-form-field-wrapper/labelless-fields/index.ts`

- [ ] **Step 1: Create the content file**

Write `apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.content.ts`:

```typescript
import type { ExampleCardConfig } from '../../shared/form-example.types';

export const LABELLESS_FIELDS_CONTENT: ExampleCardConfig = {
  demonstrated: {
    icon: '🏷️',
    title: 'Labelless form fields',
    sections: [
      {
        title: 'When a visible label is redundant',
        items: [
          'Search inputs where a placeholder plus icon already communicate purpose',
          'Grouped fields under a shared heading (phone number parts, date ranges)',
          'Compact numeric inputs labelled by their surrounding card',
        ],
      },
      {
        title: 'Layout collapse',
        items: [
          'Standard vertical layout removes the reserved label row',
          'Outline appearance drops the floating-label padding inside the bordered container',
          'Horizontal layout collapses the label column so the input is flush left',
        ],
      },
      {
        title: 'Narrow inputs',
        items: [
          'Constrain the <input> itself (via <code>max-width</code>), not the wrapper',
          'Error messages render at the wrapper width, so long validation copy still reads cleanly',
        ],
      },
    ],
  },
  learning: {
    title: 'Accessibility reminder',
    sections: [
      {
        title: 'Always provide an accessible name',
        items: [
          'Add <code>aria-label</code> to the input when no visible &lt;label&gt; is present',
          'For grouped fields, wrap the group in a <code>role="group"</code> element with <code>aria-labelledby</code>',
          'Selection controls (checkbox, switch, radio) still require a visible label — the collapse behavior intentionally excludes them',
        ],
      },
    ],
    nextStep: {
      text: 'Explore advanced submission patterns next →',
      link: '/advanced-scenarios/submission-patterns',
      linkText: 'Submission Patterns',
    },
  },
};
```

- [ ] **Step 2: Create the page component**

Write `apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.page.ts`:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import type {
  ErrorDisplayStrategy,
  FormFieldAppearance,
  FormFieldOrientation,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  AppearanceToggleComponent,
  DisplayControlsCardComponent,
  DisplayControlsSectionComponent,
  ExampleCardsComponent,
  OrientationToggleComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import {
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
} from '../../ui/error-display-mode-selector/error-display-mode-selector';
import { APPEARANCE_LABELS } from '../../ui/appearance-toggle';
import {
  getOrientationLabel,
  isOrientationDisabledForAppearance,
} from '../../ui/orientation-toggle';
import { LABELLESS_FIELDS_CONTENT } from './labelless-fields.content';
import { LabellessFieldsFormComponent } from './labelless-fields.form';

@Component({
  selector: 'ngx-labelless-fields-page',
  imports: [
    LabellessFieldsFormComponent,
    ErrorDisplayModeSelectorComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
    AppearanceToggleComponent,
    OrientationToggleComponent,
    DisplayControlsCardComponent,
    DisplayControlsSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-page-header
      title="Labelless Form Fields"
      subtitle="Wrapper collapses reserved label space when no <label> is projected"
    />

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <ngx-display-controls-card
        title="Appearance + orientation"
        description="Toggle to see the label-space collapse behavior across every layout the toolkit supports."
        [chips]="currentControlChips()"
        layout="split"
      >
        <ngx-error-display-mode-selector
          [(selectedMode)]="selectedMode"
          [embedded]="true"
          display-controls-primary
          class="block min-w-0"
        />

        <ngx-display-controls-section
          title="🎨 Wrapper styling"
          description="Switch appearance to verify standard, outline, and plain all cope with missing labels."
        >
          <ngx-appearance-toggle [(value)]="selectedAppearance" />
        </ngx-display-controls-section>

        <ngx-display-controls-section
          title="↔️ Label orientation"
          description="Horizontal layout collapses the label column when no label is projected."
        >
          <ngx-orientation-toggle
            [(value)]="selectedOrientation"
            [appearance]="selectedAppearance()"
          />
        </ngx-display-controls-section>
      </ngx-display-controls-card>

      <ngx-split-layout>
        <ngx-labelless-fields
          #formComponent
          [errorDisplayMode]="selectedMode()"
          [appearance]="selectedAppearance()"
          [orientation]="selectedOrientation()"
          left
        />
        @if (formComponent) {
          <div right>
            <ngx-signal-form-debugger
              [formTree]="formComponent.labellessForm"
            />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class LabellessFieldsPage {
  protected readonly formComponent =
    viewChild.required<LabellessFieldsFormComponent>('formComponent');

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('standard');
  protected readonly selectedOrientation =
    signal<FormFieldOrientation>('vertical');
  protected readonly currentControlChips = computed(() => [
    {
      label: 'Mode',
      value: ERROR_DISPLAY_MODE_LABELS[this.selectedMode()],
    },
    {
      label: 'Appearance',
      value: APPEARANCE_LABELS[this.selectedAppearance()],
    },
    {
      label: 'Orientation',
      value: getOrientationLabel(this.selectedOrientation()),
    },
  ]);

  protected readonly demonstratedContent =
    LABELLESS_FIELDS_CONTENT.demonstrated;
  protected readonly learningContent = LABELLESS_FIELDS_CONTENT.learning;

  constructor() {
    effect(() => {
      if (
        isOrientationDisabledForAppearance(
          this.selectedAppearance(),
          this.selectedOrientation(),
        )
      ) {
        this.selectedOrientation.set('vertical');
      }
    });
  }
}
```

- [ ] **Step 3: Create the barrel**

Write `apps/demo/src/app/04-form-field-wrapper/labelless-fields/index.ts`:

```typescript
export { LABELLESS_FIELDS_CONTENT } from './labelless-fields.content';
export { LabellessFieldsFormComponent } from './labelless-fields.form';
export type { LabellessFieldsModel } from './labelless-fields.model';
export { LabellessFieldsPage } from './labelless-fields.page';
```

- [ ] **Step 4: Build the demo to confirm compilation**

Run: `pnpm nx build demo`

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.content.ts apps/demo/src/app/04-form-field-wrapper/labelless-fields/labelless-fields.page.ts apps/demo/src/app/04-form-field-wrapper/labelless-fields/index.ts
git commit -m "feat(demo): add labelless-fields page component and content"
```

---

## Task 7: Register route and nav metadata

**Files:**

- Modify: `packages/demo-shared/src/lib/routes.metadata.ts`
- Modify: `apps/demo/src/app/app.routes.ts`

- [ ] **Step 1: Add the path + nav entry**

In `packages/demo-shared/src/lib/routes.metadata.ts`, add the new path to `DEMO_PATHS` (insert after `customControls`):

```typescript
customControls: '/form-field-wrapper/custom-controls',
labellessFields: '/form-field-wrapper/labelless-fields',
```

And add the matching nav link inside the `form-field-wrapper` category (insert after the `custom-controls` link):

```typescript
{
  path: '/form-field-wrapper/custom-controls',
  label: 'Custom Controls',
},
{
  path: '/form-field-wrapper/labelless-fields',
  label: 'Labelless Fields',
},
```

- [ ] **Step 2: Run the metadata spec to confirm the mapping is complete**

Run: `pnpm nx run demo-shared:test -- --run routes.metadata`

Expected: pass. The existing `routes.metadata.spec.ts` asserts every `DEMO_PATHS` value has a `DEMO_CATEGORIES` link, so this catches drift.

- [ ] **Step 3: Register the Angular route**

In `apps/demo/src/app/app.routes.ts`, inside the `form-field-wrapper` children array, add the new route after the `custom-controls` entry:

```typescript
{
  path: 'custom-controls',
  loadComponent: () =>
    import('./04-form-field-wrapper/custom-controls/custom-controls.page').then(
      (m) => m.CustomControlsPage,
    ),
  title: getRouteTitle('/form-field-wrapper/custom-controls'),
},
{
  path: 'labelless-fields',
  loadComponent: () =>
    import('./04-form-field-wrapper/labelless-fields/labelless-fields.page').then(
      (m) => m.LabellessFieldsPage,
    ),
  title: getRouteTitle('/form-field-wrapper/labelless-fields'),
},
```

- [ ] **Step 4: Serve the demo and smoke-test the route**

Run: `pnpm nx serve demo`

Navigate to `http://localhost:4200/form-field-wrapper/labelless-fields` and verify:

1. Page renders with header, toggles, and all five sections.
2. Toggling to `outline` does not leave ghost label padding.
3. Toggling to `horizontal` makes the input flush-left with no reserved column.

Stop the server when done (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add packages/demo-shared/src/lib/routes.metadata.ts apps/demo/src/app/app.routes.ts
git commit -m "feat(demo): register labelless-fields route"
```

---

## Task 8: E2E — Page object

**Files:**

- Create: `apps/demo-e2e/src/page-objects/labelless-fields.page.ts`

- [ ] **Step 1: Create the page object**

Write `apps/demo-e2e/src/page-objects/labelless-fields.page.ts`:

```typescript
import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import type { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Page Object for the Labelless Fields demo page.
 * Route: /form-field-wrapper/labelless-fields
 */
export class LabellessFieldsPage extends BaseFormPage {
  readonly route = DEMO_PATHS.labellessFields;

  readonly standardAppearanceButton: Locator;
  readonly outlineAppearanceButton: Locator;
  readonly horizontalOrientationButton: Locator;

  readonly searchInput: Locator;
  readonly ageInput: Locator;
  readonly zipInput: Locator;
  readonly comparisonLabelledWrapper: Locator;
  readonly comparisonLabellessWrapper: Locator;
  readonly labellessSearchWrapper: Locator;

  constructor(page: Page) {
    super(page);

    this.standardAppearanceButton = this.page.getByRole('button', {
      name: 'Standard',
    });
    this.outlineAppearanceButton = this.page.getByRole('button', {
      name: 'Outline',
    });
    this.horizontalOrientationButton = this.page.getByRole('button', {
      name: 'Horizontal',
    });

    this.searchInput = this.form.locator('#searchQuery');
    this.ageInput = this.form.locator('#age');
    this.zipInput = this.form.locator('#zipCode');
    this.comparisonLabelledWrapper = this.form
      .locator('ngx-form-field-wrapper')
      .filter({ has: this.page.locator('#comparisonLabelled') });
    this.comparisonLabellessWrapper = this.form
      .locator('ngx-form-field-wrapper')
      .filter({ has: this.page.locator('#comparisonLabelless') });
    this.labellessSearchWrapper = this.form
      .locator('ngx-form-field-wrapper')
      .filter({ has: this.searchInput });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.getFullUrl(this.route));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/demo-e2e/src/page-objects/labelless-fields.page.ts
git commit -m "test(demo-e2e): add labelless-fields page object"
```

---

## Task 9: E2E — Spec

**Files:**

- Create: `apps/demo-e2e/src/forms/04-form-field-wrapper/labelless-fields.spec.ts`

- [ ] **Step 1: Create the spec**

Write `apps/demo-e2e/src/forms/04-form-field-wrapper/labelless-fields.spec.ts`:

```typescript
import { expect, test } from '@playwright/test';
import { LabellessFieldsPage } from '../../page-objects/labelless-fields.page';

test.describe('Labelless Form Fields', () => {
  let page: LabellessFieldsPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new LabellessFieldsPage(playwrightPage);
    await page.goto();
  });

  test('hides the label slot when no <label> is projected (standard)', async () => {
    const labelSlot = page.labellessSearchWrapper.locator(
      '.ngx-signal-form-field-wrapper__label',
    );

    const display = await labelSlot.evaluate(
      (el) => getComputedStyle(el).display,
    );

    expect(display).toBe('none');
  });

  test('outline appearance shrinks when label is absent', async () => {
    await page.outlineAppearanceButton.click();

    // Amount wrapper is labelless outline; compare it to the labelled
    // comparison wrapper (also outline once the toggle is set).
    const labellessHeight = await page.comparisonLabellessWrapper.evaluate(
      (el) => (el as HTMLElement).offsetHeight,
    );
    const labelledHeight = await page.comparisonLabelledWrapper.evaluate(
      (el) => (el as HTMLElement).offsetHeight,
    );

    // Labelled must be taller — at least the label's line-height worth.
    expect(labelledHeight).toBeGreaterThan(labellessHeight + 8);
  });

  test('horizontal orientation collapses the label column', async () => {
    await page.horizontalOrientationButton.click();

    const { wrapperLeft, inputLeft } =
      await page.labellessSearchWrapper.evaluate((el) => {
        const wrapperRect = el.getBoundingClientRect();
        const input = el.querySelector('input') as HTMLInputElement;
        const inputRect = input.getBoundingClientRect();
        return {
          wrapperLeft: wrapperRect.left,
          inputLeft: inputRect.left,
        };
      });

    // Prefix icon is 16px + padding; input should still start within
    // a tight offset of the wrapper — nothing like an 8rem reserved
    // label column (128px).
    expect(inputLeft - wrapperLeft).toBeLessThan(64);
  });

  test('errors render wider than narrow inputs', async () => {
    // Trigger the age error (below min).
    await page.ageInput.fill('5');
    await page.ageInput.blur();

    const ageError = page.form.getByText('Must be 18 or older');
    await expect(ageError).toBeVisible();

    const { errorWidth, inputWidth, scrollWidth, clientWidth } =
      await ageError.evaluate((el) => {
        const input = document.getElementById('age') as HTMLInputElement;
        return {
          errorWidth: el.getBoundingClientRect().width,
          inputWidth: input.getBoundingClientRect().width,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        };
      });

    // Input constrained to 5ch (~50px). Error must be wider.
    expect(errorWidth).toBeGreaterThan(inputWidth);
    // And the error must not overflow its own box (no clipping).
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('snapshot: comparison grid and narrow inputs', async () => {
    // Settle layout by focusing then blurring the age input with an
    // invalid value so the narrow-input error is visible in the shot.
    await page.ageInput.fill('5');
    await page.ageInput.blur();

    await expect(page.comparisonSection).toHaveScreenshot(
      'labelless-comparison-grid.png',
    );
    await expect(page.narrowInputsSection).toHaveScreenshot(
      'labelless-narrow-inputs.png',
    );
  });
});
```

- [ ] **Step 2: Update snapshot baselines**

Run: `pnpm nx run demo-e2e:e2e -- --update-snapshots --grep "Labelless"`

Expected: snapshots are generated. Review them visually (`apps/demo-e2e/src/__screenshots__/...`) to confirm they capture the intended layout — the comparison grid showing a clear height difference, and the narrow inputs with visible error text extending past the inputs.

- [ ] **Step 3: Run the e2e suite for this spec**

Run: `pnpm nx run demo-e2e:e2e -- --grep "Labelless"`

Expected: all five tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/demo-e2e/src/forms/04-form-field-wrapper/labelless-fields.spec.ts apps/demo-e2e/src/__screenshots__
git commit -m "test(demo-e2e): add labelless-fields spec and snapshots"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run every workspace target the feature touches**

Run in parallel (separate invocations):

```bash
pnpm nx run toolkit:test
pnpm nx run toolkit:test-browser
pnpm nx run demo-shared:test
pnpm nx run demo:build
pnpm nx run demo-e2e:e2e -- --grep "Labelless"
```

Expected: all green. If any target fails, treat it as the task's failure — diagnose and fix before declaring done.

- [ ] **Step 2: Run format and lint**

Run:

```bash
pnpm format
pnpm nx run-many -t lint --projects=toolkit,demo,demo-shared,demo-e2e
```

Expected: no changes from formatter (or any fixups committed); lint clean.

- [ ] **Step 3: Review the full diff**

Run: `git log --oneline main..HEAD` and `git diff main..HEAD --stat`

Expected: commits are focused (one responsibility each), no accidental unrelated file changes.

- [ ] **Step 4: Final commit if formatter touched anything**

If `pnpm format` modified files:

```bash
git add -A
git commit -m "chore: apply formatter after labelless form-field feature"
```

Otherwise nothing to commit here.

---

## Self-Review Notes

**Spec coverage check:** spec sections map to tasks as follows.

- Problem + approach (spec §Problem, §Approach) → Task 1–2 (CSS + tests)
- Per-layout behavior (spec §Per-layout behavior) → Task 2 Step 1 covers all three
- THEMING.md note (spec §Files touched) → Task 3
- Demo sections 1–4 (spec §Demo) → Tasks 4–6 (model, form, page)
- Demo section 5 narrow inputs → Task 4 validators + Task 5 narrow-input template/styles
- Route registration + nav (spec §Files touched) → Task 7
- E2E 1–3 label collapse tests → Task 9 tests 1–3
- E2E 4 narrow-input errors → Task 9 test 4
- E2E 5 snapshots → Task 9 test 5
- Testing strategy (spec §Testing strategy) → Tasks 1, 9 use delta assertions and computed styles

**Placeholder scan:** no "TBD", "similar to", or "fill in" entries; every code block is complete; every command has an expected outcome.

**Type/name consistency:** `LabellessFieldsModel`, `labellessFieldsSchema`, `LabellessFieldsFormComponent`, `LabellessFieldsPage`, `LABELLESS_FIELDS_CONTENT`, `DEMO_PATHS.labellessFields` — consistent across tasks. Field ids used in tests (`#age`, `#zipCode`, `#searchQuery`, `#comparisonLabelled`, `#comparisonLabelless`) match the template in Task 5.
