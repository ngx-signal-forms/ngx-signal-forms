import {
  afterNextRender,
  computed,
  inject,
  Injectable,
  Injector,
  signal,
  type Signal,
} from '@angular/core';

/**
 * Per-form channel that lets an error summary and the field errors of the
 * same form find each other, so a submit announces through the summary
 * alone (issue #522, ADR-0012).
 *
 * `NgxSignalForm` provides one instance per `[ngxSignalForm]` host and
 * reports each submit attempt here. `NgxFormFieldErrorSummary` registers
 * whether it currently shows errors. `NgxFormFieldError` reads both to tell
 * "revealed by a submit, and a summary speaks for it" apart from "changed
 * while the user edits".
 *
 * `providedIn: null`: scoped to the form, never a global, so two forms on
 * one page do not silence each other.
 *
 * @internal
 */
@Injectable({ providedIn: null })
export class NgxSubmitAnnouncements {
  readonly #injector = inject(Injector);
  readonly #summaries = signal<readonly Signal<boolean>[]>([]);
  #submitRenderPending = false;

  /** True while at least one registered summary shows errors. */
  readonly summaryShowsErrors = computed(() =>
    this.#summaries().some((showsErrors) => showsErrors()),
  );

  /**
   * True from a submit attempt until the render that follows it has
   * finished. Errors that appear or change inside that window were revealed
   * by the submit. A plain flag, not a signal: readers only sample it when
   * their own errors change.
   */
  isSubmitRenderPending(): boolean {
    return this.#submitRenderPending;
  }

  /** Called by `NgxSignalForm` on every native submit of the form. */
  notifySubmitAttempt(): void {
    this.#submitRenderPending = true;
    afterNextRender(
      () => {
        this.#submitRenderPending = false;
      },
      { injector: this.#injector },
    );
  }

  /**
   * Registers a summary's "shows errors" state. Returns the unregister
   * function; call it when the summary is destroyed.
   */
  registerSummary(showsErrors: Signal<boolean>): () => void {
    this.#summaries.update((summaries) => [...summaries, showsErrors]);
    return () => {
      this.#summaries.update((summaries) =>
        summaries.filter((summary) => summary !== showsErrors),
      );
    };
  }
}
