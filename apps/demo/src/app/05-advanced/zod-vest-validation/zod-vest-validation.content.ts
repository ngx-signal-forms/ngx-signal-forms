export const ZOD_VEST_VALIDATION_CONTENT = {
  demonstrated: {
    icon: '🧩',
    title: 'Zod + Vest Layered Validation',
    sections: [
      {
        title: 'Two rule layers working together',
        items: [
          '• <strong>Zod:</strong> Handles structural rules such as required fields, email format, password length, and allowed enums.',
          '• <strong>Vest:</strong> Adds business rules such as company email policy, VAT requirements, and password/name checks.',
          '• <strong>Single form tree:</strong> Angular Signal Forms merges both layers into the same field state and error flow.',
          '• <strong>Single Vest pass:</strong> The toolkit&apos;s first-class Vest adapter maps blocking errors and warnings from one suite execution.',
          '• <strong>Shared rendering:</strong> The toolkit wrappers render blocking errors and advisory Vest warnings through the same assistive UI.',
        ],
      },
      {
        title: 'Suggested experiments',
        items: [
          '• Leave required fields empty to see <strong>Zod</strong> produce the first layer of errors.',
          '• Choose <strong>Business</strong> and use a <code>gmail.com</code> address to trigger a <strong>Vest</strong> policy error.',
          '• Put your first or last name inside the password to see business validation extend the Zod baseline.',
        ],
      },
    ],
  },
  learning: {
    title: 'How to split responsibilities',
    sections: [
      {
        title: 'A practical layering model',
        items: [
          '• Keep generated or shared contract rules in <strong>Zod</strong>.',
          '• Add higher-order business policy in <strong>Vest</strong>.',
          '• Let the toolkit stay focused on rendering, timing, and accessibility.',
          '• Let the first-class adapter expose both Vest errors and <code>warn()</code> guidance without extra adapter code.',
          '• Reserve <code>warn()</code> for suggestions such as password quality or formatting guidance that should not block completion.',
        ],
      },
      {
        title: 'Good fit for real projects',
        items: [
          '• OpenAPI-generated Zod schemas with extra frontend business policy.',
          '• Signup or checkout forms where backend shape validation is already defined elsewhere.',
          '• Teams that want to reuse business rules without duplicating basic schema logic.',
          '• Flows that want native Angular <code>submit()</code> while still teaching users through non-blocking warnings.',
        ],
      },
    ],
    nextStep: {
      text: 'Compare this with a pure Vest suite →',
      link: '/advanced-scenarios/vest-validation',
      linkText: 'Vest-Only Validation',
    },
  },
} as const;
