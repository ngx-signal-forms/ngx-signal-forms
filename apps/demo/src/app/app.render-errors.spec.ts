import { Component, ErrorHandler } from '@angular/core';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from 'vitest';

import { AppComponent } from './app';
import { DemoErrorHandler } from './ui/render-error';
import { NgxPageControlsDirective } from './ui/page-controls';

/**
 * The app shell wraps the routed outlet and the right rail's page controls in
 * `@boundary` blocks. A page that throws while it renders must not blank the
 * demo until a reload: the visitor sees a fallback, and the next navigation
 * or "Try again" brings the page area back.
 *
 * These routes exist only in this spec. No production page throws.
 */

let pageShouldThrow = true;
let controlsShouldThrow = true;

function explode(what: string): string {
  throw new Error(`${what} failed to render`);
}

@Component({
  selector: 'ngx-throwing-page',
  template: `
    <h1 tabindex="-1">Throwing page</h1>
    <p>{{ content() }}</p>
  `,
})
class ThrowingPage {
  protected content(): string {
    return pageShouldThrow ? explode('Page') : 'Recovered page content';
  }
}

@Component({
  selector: 'ngx-healthy-page',
  template: `<h1 tabindex="-1">Healthy page</h1>`,
})
class HealthyPage {}

@Component({
  selector: 'ngx-throwing-controls-page',
  imports: [NgxPageControlsDirective],
  template: `
    <h1 tabindex="-1">Page with broken controls</h1>
    <ng-template ngxPageControls>
      <p>{{ controls() }}</p>
      <button type="button" disabled>Disabled control</button>
      <button type="button">Control</button>
    </ng-template>
  `,
})
class ThrowingControlsPage {
  protected controls(): string {
    return controlsShouldThrow
      ? explode('Page controls')
      : 'Recovered page controls';
  }
}

const routes = [
  { path: 'throws', component: ThrowingPage },
  { path: 'healthy', component: HealthyPage },
  { path: 'broken-controls', component: ThrowingControlsPage },
];

describe('AppComponent render-error boundaries', () => {
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    pageShouldThrow = true;
    controlsShouldThrow = true;
    // jsdom has no matchMedia; the shell reads two breakpoints on start.
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function setup(initialRoute: string) {
    const result = await render(AppComponent, {
      routes,
      initialRoute,
      providers: [{ provide: ErrorHandler, useClass: DemoErrorHandler }],
    });
    await result.fixture.whenStable();
    return result;
  }

  function pageFallbackHeading() {
    return screen.queryByRole('heading', {
      level: 1,
      name: 'This page could not be shown',
    });
  }

  it('shows the page fallback in place of a page that throws, and logs the error through onViewError', async () => {
    const onViewError = vi.spyOn(DemoErrorHandler.prototype, 'onViewError');

    await setup('/throws');

    expect(pageFallbackHeading()).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Recovered page content')).toBeNull();
    expect(onViewError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Page failed to render' }),
      expect.anything(),
    );
    // The error stays visible in the console during development.
    expect(consoleError).toHaveBeenCalled();
  });

  it('describes the fallback heading with the message, so focusing it announces both', async () => {
    await setup('/throws');

    const heading = pageFallbackHeading();
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(heading).toHaveAccessibleDescription(
      /Something went wrong while this page was rendering/u,
    );
  });

  it('renders the next route after navigation without a manual reset', async () => {
    const { fixture, navigate } = await setup('/throws');
    expect(pageFallbackHeading()).toBeInTheDocument();

    await navigate('/healthy');
    await fixture.whenStable();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Healthy page' }),
    ).toBeInTheDocument();
    expect(pageFallbackHeading()).toBeNull();
  });

  it('re-creates the page on "Try again" once the cause is gone', async () => {
    const { fixture } = await setup('/throws');
    expect(pageFallbackHeading()).toBeInTheDocument();

    pageShouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await fixture.whenStable();

    expect(screen.getByText('Recovered page content')).toBeInTheDocument();
    expect(pageFallbackHeading()).toBeNull();
    // The pressed button is gone, so focus moves to the page heading
    // instead of dropping to <body>.
    expect(
      screen.getByRole('heading', { level: 1, name: 'Throwing page' }),
    ).toHaveFocus();
  });

  it('shows the rail fallback for throwing page controls while the page itself still renders', async () => {
    const { fixture } = await setup('/broken-controls');

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Page with broken controls',
      }),
    ).toBeInTheDocument();
    expect(pageFallbackHeading()).toBeNull();

    // jsdom ignores the `width >= 1280px` media query that shows the rail,
    // so the rail counts as hidden here. Find it by its label and query
    // inside it with `hidden: true`.
    const rail = screen.getByLabelText('Page configuration');
    expect(rail).toHaveTextContent(
      'These display controls could not be shown.',
    );
    // The message appears after the rail is on screen and takes no focus, so
    // it announces itself.
    expect(within(rail).getByRole('alert', { hidden: true })).toHaveTextContent(
      'These display controls could not be shown.',
    );

    controlsShouldThrow = false;
    // jsdom refuses focus inside a `display: none` subtree, as browsers do.
    // Show the rail as the wide-viewport media query would, so the recovered
    // control can take focus.
    rail.style.display = 'block';
    await userEvent.click(
      within(rail).getByRole('button', { name: 'Try again', hidden: true }),
    );
    await fixture.whenStable();

    expect(rail).toHaveTextContent('Recovered page controls');
    // The pressed button is gone, so focus moves to the first recovered
    // control that accepts focus. The disabled control before it is skipped.
    expect(
      within(rail).getByRole('button', { name: 'Control', hidden: true }),
    ).toHaveFocus();
  });
});
