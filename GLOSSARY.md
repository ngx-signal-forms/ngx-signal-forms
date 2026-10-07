# ngx-signal-forms Glossary

This glossary defines the domain language used by the toolkit and its demo.

## Validation

**Built-in validation error**:
A validation error produced by Angular's built-in validators.

**Custom validation error**:
A validation error produced by an application validator or an external validation library.

**Warning**:
A non-blocking validation message. _Avoid_: soft error

## Vest

**Bound path**:
The form path to which a Vest validation suite is attached. It determines where errors appear and which value the suite receives. _Avoid_: field path

**Suite input**:
The value a Vest validation suite receives. It is the value at the bound path. _Avoid_: form value

**Vest field name**:
A field name used by a Vest test, relative to the suite input.

**Virtual Vest field name**:
A Vest field name that intentionally does not identify a field in the suite input. It is used to report a form-level error.

## Accessibility

**WCAG 2.2 AA**:
The accessibility conformance level this project targets.

**A11y baseline**:
The set of known accessibility violations accepted for a demo app. _Avoid_: known violations list

## Form fields and styling

**Public token**:
A documented CSS custom property that consumers can use to theme the toolkit. Its name and default are part of the public API.

**Private token**:
A CSS custom property reserved for internal styling. Consumers should use a documented public token instead.

**Selection row**:
The layout of one checkbox or switch and its label. _Avoid_: inline control row

**Selection group**:
The layout surface for a group of radios or checkboxes. _Avoid_: selection cluster, radio list

**Container-owned spacing**:
The space between fields, owned by the parent layout rather than by each field. _Avoid_: field margin

## Demo application

**Example**:
One use case shown by the demo app. It has an overview and a live example. _Avoid_: demo page, demo shell

**Example overview**:
The explanatory part of an example. _Avoid_: intro page

**Live example**:
The working form or flow shown by an example. _Avoid_: playground

**App shell**:
The persistent frame around examples, including navigation and shared page regions. _Avoid_: layout
