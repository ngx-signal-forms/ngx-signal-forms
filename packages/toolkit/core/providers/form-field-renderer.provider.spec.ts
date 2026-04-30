import {
  Component,
  createEnvironmentInjector,
  EnvironmentInjector,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  NGX_FORM_FIELD_ERROR_RENDERER,
  NGX_FORM_FIELD_HINT_RENDERER,
} from '../tokens';
import {
  provideFormFieldErrorRenderer,
  provideFormFieldErrorRendererForComponent,
  provideFormFieldHintRenderer,
  provideFormFieldHintRendererForComponent,
} from './form-field-renderer.provider';

@Component({
  selector: 'stub-error',
  template: 'STUB-ERROR',
  standalone: true,
})
class StubErrorComponent {}

@Component({
  selector: 'stub-hint',
  template: 'STUB-HINT',
  standalone: true,
})
class StubHintComponent {}

@Component({
  selector: 'override-error',
  template: 'OVERRIDE-ERROR',
  standalone: true,
})
class OverrideErrorComponent {}

@Component({
  selector: 'override-hint',
  template: 'OVERRIDE-HINT',
  standalone: true,
})
class OverrideHintComponent {}

const createInjector = (
  providers: Parameters<typeof createEnvironmentInjector>[0],
  parent: EnvironmentInjector = TestBed.inject(EnvironmentInjector),
) => createEnvironmentInjector(providers, parent);

describe('provideFormFieldErrorRenderer (environment scope)', () => {
  it('registers the supplied component class', () => {
    const injector = createInjector([
      provideFormFieldErrorRenderer({ component: StubErrorComponent }),
    ]);

    expect(injector.get(NGX_FORM_FIELD_ERROR_RENDERER).component).toBe(
      StubErrorComponent,
    );
  });

  it('child injector overrides parent', () => {
    const parent = createInjector([
      provideFormFieldErrorRenderer({ component: StubErrorComponent }),
    ]);
    const child = createInjector(
      [provideFormFieldErrorRenderer({ component: OverrideErrorComponent })],
      parent,
    );

    expect(child.get(NGX_FORM_FIELD_ERROR_RENDERER).component).toBe(
      OverrideErrorComponent,
    );
    expect(parent.get(NGX_FORM_FIELD_ERROR_RENDERER).component).toBe(
      StubErrorComponent,
    );
  });
});

describe('provideFormFieldErrorRendererForComponent (component scope)', () => {
  it('inherits the parent environment renderer when override is empty', () => {
    @Component({
      template: '',
      standalone: true,
      providers: [provideFormFieldErrorRendererForComponent({})],
    })
    class HostComponent {}

    TestBed.configureTestingModule({
      providers: [
        provideFormFieldErrorRenderer({ component: StubErrorComponent }),
      ],
    });

    const fixture = TestBed.createComponent(HostComponent);
    expect(
      fixture.debugElement.injector.get(NGX_FORM_FIELD_ERROR_RENDERER)
        .component,
    ).toBe(StubErrorComponent);
  });

  it('component override wins over environment scope', () => {
    @Component({
      template: '',
      standalone: true,
      providers: [
        provideFormFieldErrorRendererForComponent({
          component: OverrideErrorComponent,
        }),
      ],
    })
    class HostComponent {}

    TestBed.configureTestingModule({
      providers: [
        provideFormFieldErrorRenderer({ component: StubErrorComponent }),
      ],
    });

    const fixture = TestBed.createComponent(HostComponent);
    expect(
      fixture.debugElement.injector.get(NGX_FORM_FIELD_ERROR_RENDERER)
        .component,
    ).toBe(OverrideErrorComponent);
  });
});

describe('provideFormFieldHintRenderer (environment scope)', () => {
  it('registers the supplied component class', () => {
    const injector = createInjector([
      provideFormFieldHintRenderer({ component: StubHintComponent }),
    ]);

    expect(injector.get(NGX_FORM_FIELD_HINT_RENDERER).component).toBe(
      StubHintComponent,
    );
  });

  it('child injector overrides parent', () => {
    const parent = createInjector([
      provideFormFieldHintRenderer({ component: StubHintComponent }),
    ]);
    const child = createInjector(
      [provideFormFieldHintRenderer({ component: OverrideHintComponent })],
      parent,
    );

    expect(child.get(NGX_FORM_FIELD_HINT_RENDERER).component).toBe(
      OverrideHintComponent,
    );
    expect(parent.get(NGX_FORM_FIELD_HINT_RENDERER).component).toBe(
      StubHintComponent,
    );
  });
});

describe('provideFormFieldHintRendererForComponent (component scope)', () => {
  it('inherits the parent environment renderer when override is empty', () => {
    @Component({
      template: '',
      standalone: true,
      providers: [provideFormFieldHintRendererForComponent({})],
    })
    class HostComponent {}

    TestBed.configureTestingModule({
      providers: [
        provideFormFieldHintRenderer({ component: StubHintComponent }),
      ],
    });

    const fixture = TestBed.createComponent(HostComponent);
    expect(
      fixture.debugElement.injector.get(NGX_FORM_FIELD_HINT_RENDERER).component,
    ).toBe(StubHintComponent);
  });

  it('component override wins over environment scope', () => {
    @Component({
      template: '',
      standalone: true,
      providers: [
        provideFormFieldHintRendererForComponent({
          component: OverrideHintComponent,
        }),
      ],
    })
    class HostComponent {}

    TestBed.configureTestingModule({
      providers: [
        provideFormFieldHintRenderer({ component: StubHintComponent }),
      ],
    });

    const fixture = TestBed.createComponent(HostComponent);
    expect(
      fixture.debugElement.injector.get(NGX_FORM_FIELD_HINT_RENDERER).component,
    ).toBe(OverrideHintComponent);
  });
});
