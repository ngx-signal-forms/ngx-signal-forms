import {
  DEMO_CATEGORIES,
  DEMO_PATHS,
  getExamplePath,
  getRouteTitle,
  SITE_NAME,
} from './routes.metadata';

describe('routes.metadata', () => {
  it('exposes a title for each registered demo path', () => {
    const registeredPaths = DEMO_CATEGORIES.flatMap((category) =>
      category.links.map((link) => link.path),
    );

    expect(new Set(registeredPaths)).toEqual(
      new Set(Object.values(DEMO_PATHS)),
    );

    for (const path of registeredPaths) {
      expect(getRouteTitle(path)).not.toBe(SITE_NAME);
      expect(getRouteTitle(path)).toMatch(/ · ngx-signal-forms$/u);
    }
  });

  it('falls back to the default title for unknown routes', () => {
    expect(getRouteTitle('/not-a-demo-route')).toBe(SITE_NAME);
  });

  it('advertises expected display controls for representative routes', () => {
    const advertised = Object.fromEntries(
      DEMO_CATEGORIES.flatMap((category) =>
        category.links.map((link) => [link.path, link.hasControls]),
      ),
    );

    expect(advertised[DEMO_PATHS.fieldsetAppearance]).toBe(true);
    expect(advertised[DEMO_PATHS.storeBinding]).toBe(true);
    expect(advertised[DEMO_PATHS.errorMessageSignal]).toBe(false);
    expect(advertised[DEMO_PATHS.singleModelWizard]).toBe(false);
  });

  it('maps a child route to the example that owns it', () => {
    expect(getExamplePath(`${DEMO_PATHS.routedSteps}/time-slot`)).toBe(
      DEMO_PATHS.routedSteps,
    );
    expect(getExamplePath(DEMO_PATHS.routedSteps)).toBe(DEMO_PATHS.routedSteps);
  });

  it('picks the longest example path when two examples share a prefix', () => {
    expect(getExamplePath(`${DEMO_PATHS.groupedFeedback}/child`)).toBe(
      DEMO_PATHS.groupedFeedback,
    );
    expect(getExamplePath(DEMO_PATHS.fieldsetAppearance)).toBe(
      DEMO_PATHS.fieldsetAppearance,
    );
  });

  it('returns an unknown path unchanged', () => {
    expect(getExamplePath('/not-a-demo-route/child')).toBe(
      '/not-a-demo-route/child',
    );
    // A shared text prefix is not ownership.
    expect(getExamplePath(`${DEMO_PATHS.autosave}-draft`)).toBe(
      `${DEMO_PATHS.autosave}-draft`,
    );
  });
});
