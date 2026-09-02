import type { ExampleCardConfig } from '../../shared/form-example.types';

export const BRAND_THEMING_CONTENT: ExampleCardConfig = {
  demonstrated: {
    icon: '🎨',
    title: 'Brand-token theming',
    sections: [
      {
        title: 'One class, a full re-theme',
        items: [
          'Toggling "Brand theme" swaps the wrapper\'s public <code>--ngx-form-field-color-*</code> semantic scale — nothing else in the template changes',
          'A distinct violet/lavender palette replaces the stock blue-on-white look, including a warmer surface and rounder corners',
          'Dark mode reuses the app-wide theme switcher in the header — the brand palette defines its own dark values rather than only shipping a light theme',
        ],
      },
      {
        title: 'The stateful colors, not just the happy path',
        items: [
          '<strong>Team name</strong> and <strong>Workspace URL</strong> start invalid (<code>errorStrategy="immediate"</code>) so the brand danger color is visible without any interaction',
          '<strong>Monthly budget</strong> turns into a non-blocking <code>warn:</code> message once it crosses $5,000 — the brand warning color, not the stock amber',
          '<strong>Legacy workspace ID</strong> is permanently disabled to show the brand disabled background/opacity',
          'Tab through the fields to see the brand focus ring on <code>--ngx-form-field-color-primary</code>',
        ],
      },
      {
        title: 'Overrides that fall apart if you skip them',
        items: [
          'A theme that only overrides <code>-color-primary</code> leaves error/warning/disabled on the stock palette — inconsistent and easy to miss',
          'A theme that hard-codes one set of hex values for both light and dark risks a contrast regression the moment the OS/app theme flips',
          'This page overrides the full semantic scale for both light and dark so every state stays legible',
        ],
      },
    ],
  },
  learning: {
    title: 'How the tokens are scoped',
    sections: [
      {
        title: 'Public API only — no internal tokens touched',
        items: [
          'Every override here is a documented <code>--ngx-form-field-color-*</code> / <code>--ngx-signal-form-error-*</code> / <code>--ngx-signal-form-warning-*</code> / <code>--ngx-form-field-hint-color</code> token — the full catalog, including the Bootstrap/Tailwind mapping recipes, lives in <a href="https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/form-field/THEMING.md">THEMING.md</a>',
          'The internal <code>--_field-*</code> / <code>--_*</code> tokens are never referenced — that is the layer the toolkit reserves for itself',
        ],
      },
      {
        title: 'Opt-in, not global',
        items: [
          "The palette lives on a single scoping class applied to this page's panel — other routes are untouched",
          'That keeps the rest of the demo (and its layout snapshots) on the stock theme while this page proves the override surface works end-to-end',
        ],
      },
    ],
    nextStep: {
      text: 'See a project-wide provider apply one configuration choice across every form in',
      link: '/advanced-scenarios/global-configuration',
      linkText: 'Global Configuration',
    },
  },
};
