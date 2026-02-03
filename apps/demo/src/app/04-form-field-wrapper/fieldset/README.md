# Fieldsets & Aggregated Errors

## Overview

When dealing with groups of fields (like "Shipping Address"), you often want to treat them as a unit. 

This demo introduces the **Fieldset Wrapper** (`NgxSignalFormFieldset`), which provides semantic grouping and error aggregation.

## Feature Spotlight: `NgxSignalFormFieldset`

### Semantic HTML
Renders a `<fieldset>` with a `<legend>`, ensuring screen readers understand these fields belong together.

### Error Aggregation
What if the user skips the whole section? Instead of showing 5 individual "Required" errors, the fieldset can show a **Group Error** (e.g., "Please complete your shipping address").

It can also summarize errors: "3 errors in this section".

## Feature Spotlight: Recursive Validity

The toolkit tracks validity up the tree.
`form.shippingAddress.invalid()` is huge: it's true if *any* child (street, city, zip) is invalid. The Fieldset uses this signal to style the entire border or legend red.

## Key Files

-   [fieldset.form.html](fieldset.form.html): Usage of the fieldset component.
-   [fieldset.validations.ts](fieldset.validations.ts): Group-level schema.

## How to Test

1.  **Skip Section**: Leave the address empty. Click submit.
2.  **Aggregated Feedback**: Notice the Fieldset legend might turn red, or a summary error appears, highlighting the whole block as problematic.
