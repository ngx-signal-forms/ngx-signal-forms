import { DEMO_CATEGORIES, DEMO_PATHS, getRouteTitle } from './routes.metadata';

describe('routes.metadata', () => {
  it('exposes a title for each registered demo path', () => {
    const registeredPaths = DEMO_CATEGORIES.flatMap((category) =>
      category.links.map((link) => link.path),
    );

    expect(new Set(registeredPaths)).toEqual(
      new Set(Object.values(DEMO_PATHS)),
    );

    for (const path of registeredPaths) {
      expect(getRouteTitle(path)).not.toBe('NgxSignalForms Toolkit');
    }
  });

  it('falls back to the default title for unknown routes', () => {
    expect(getRouteTitle('/not-a-demo-route')).toBe('NgxSignalForms Toolkit');
  });
});
