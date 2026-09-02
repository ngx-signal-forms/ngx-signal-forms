import type { ExampleCardConfig } from '../../shared/form-example.types';

export const FIELD_IDENTITY_CONTENT: ExampleCardConfig = {
  demonstrated: {
    icon: '🪪',
    title: 'A wrapper that owns its field identity',
    sections: [
      {
        title: 'When the control id is not the field name',
        items: [
          'A third-party widget generates its own inner <code>id</code> (<code>p-inputtext-42</code>, <code>mat-input-7</code>)',
          'A <code>role="group"</code> cluster whose name belongs to the group, not to any one radio or checkbox',
          'Compose <code>NgxFieldIdentityProvider</code> via <code>hostDirectives</code> and expose its <code>fieldName</code> input',
        ],
      },
      {
        title: 'One channel, not all of them',
        items: [
          'The provider publishes the <strong>field name</strong> only',
          'Hint ids keep resolving through <code>NGX_SIGNAL_FORM_HINT_REGISTRY</code>',
          'Display timing keeps resolving through <code>NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY</code> — here, published by the <code>&lt;ngx-form-field-error&gt;</code> the wrapper renders',
        ],
      },
      {
        title: 'Controls that lose their layout box',
        items: [
          '<code>NgxSignalFormAutoAria</code> probes its own host element every render',
          'A collapsed <code>&lt;details&gt;</code>, an inactive tab, or a non-current wizard step drops <code>aria-invalid</code> instead of leaving it stale',
          'Bind <code>[open]</code> to a signal — a bare <code>&lt;details&gt;</code> toggles without telling Angular, so nothing re-probes',
        ],
      },
    ],
  },
  learning: {
    title: 'Reading the page',
    sections: [
      {
        title: '🧪 Try This',
        items: [
          '1. Look at the readout under the <strong>Email address</strong> field → <code>control id</code> is a generated <code>demo-widget-N</code>, but <code>aria-describedby</code> lists <code>emailAddress-hint</code> and <code>emailAddress-error</code>',
          '2. Every id in the readout is green with a ✓ — it resolves to an element that exists. A red ✗ would mean a dangling reference a screen reader announces as nothing',
          '3. Type a valid address → the error id drops out of <code>aria-describedby</code> while the hint id stays, because hints and errors travel on different channels',
          '4. Collapse <strong>Delivery instructions</strong> → <code>aria-invalid</code> in the readout under it turns to <code>(absent)</code> and <code>laid out</code> turns <code>false</code>',
          '5. Reopen it → <code>aria-invalid</code> is back at <code>true</code>. It was never stale in between',
          '6. Switch the error display mode to <strong>On Touch</strong> → the error id leaves <code>aria-describedby</code> until you touch the field, driven by the visibility registry the wrapper never writes to itself',
        ],
      },
      {
        title: 'Why not just use the id?',
        items: [
          'Auto-aria mints <code>{fieldName}-error</code> and <code>{fieldName}-warning</code>; if the name came from a generated id, those ids would change whenever the widget library changed its numbering',
          'Binding <code>fieldName</code> to <code>null</code> means "not resolvable yet" and skips ARIA wiring — it does not fall back to the control id',
          'Providing an identity claims the naming channel for the whole subtree, so publish a name or do not provide one',
        ],
      },
    ],
    nextStep: {
      text: 'See how custom controls integrate next →',
      link: '/form-field-wrapper/custom-controls',
      linkText: 'Custom Controls',
    },
  },
};
