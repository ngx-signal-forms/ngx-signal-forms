# Error Messages Demo

## Overview

This demo showcases the **Error Message Fallback Registry** (Item #5) with 3-tier message priority system.

## When to Use This Feature

**Use `provideErrorMessages()` when you need:**

- ✅ **Multi-language support** - Dynamic messages based on user's locale (LOCALE_ID, ngx-translate, @angular/localize)
- ✅ **Centralized consistency** - Same error messages across all forms in your application (DRY principle)
- ✅ **Brand-specific messaging** - Match your company's tone/voice (e.g., friendly vs. formal)
- ✅ **Design system requirements** - Comply with specific UX guidelines
- ✅ **Custom validator messages** - Friendly messages for domain-specific validation

**Don't use `provideErrorMessages()` when:**

- ❌ **Using Standard Schema libraries** (Zod, Valibot, ArkType) - They provide excellent messages
- ❌ **Simple apps** - Toolkit's defaults are production-ready
- ❌ **Single language** - No i18n needed, validator messages work great

**Decision flowchart:**

```text
Do you use Zod/Valibot/ArkType?
  ├─ Yes → Use schema messages (zero-config) ✅
  └─ No → Do you need i18n?
      ├─ Yes → Use provideErrorMessages() with locale injection 🌍
      └─ No → Do you have 10+ forms?
          ├─ Yes → Consider provideErrorMessages() for consistency 📋
          └─ No → Use validator messages or defaults ✅
```

## 3-Tier Message Priority

The toolkit resolves error messages in this order:

1. **Tier 1: Validator Message** (`error.message` property)
   - Highest priority
   - Example: `email(path.email, { message: 'Valid email required' })`
   - ✅ **Recommended** for most use cases

2. **Tier 2: Registry Override** (from `provideErrorMessages()`)
   - Fallback if no validator message
   - Example: `provideErrorMessages({ required: 'This field is required' })`
   - Use for centralized messages or i18n

3. **Tier 3: Default Toolkit Fallback**
   - Final fallback for built-in Angular validators
   - Example: `required` → "This field is required"
   - Automatically provided by toolkit

## Features Demonstrated

### Zero-Config Pattern (Recommended)

```typescript
email(path.email, { message: 'Valid email required' });
```

**Benefits:**

- No provider configuration needed
- Messages close to validation logic
- Standard Schema libraries (Zod, Valibot, ArkType) work perfectly

### Centralized Registry Pattern

```typescript
provideErrorMessages({
  required: 'This field is required',
  email: 'Please enter a valid email address',
  minLength: (params: Record<string, unknown>) =>
    `Minimum ${(params as { minLength: number }).minLength} characters required`,
});
```

**Use Cases:**

- Centralizing messages across multiple forms
- i18n integration (LOCALE_ID, ngx-translate, @angular/localize)
- Brand-specific messaging
- Design system requirements

### Default Toolkit Fallbacks

Built-in validators that don't have validator messages or registry overrides use toolkit defaults:

| Validator   | Default Message                           |
| ----------- | ----------------------------------------- |
| `required`  | "This field is required"                  |
| `email`     | "Please enter a valid email address"      |
| `minLength` | "Minimum {minLength} characters required" |
| `maxLength` | "Maximum {maxLength} characters allowed"  |
| `min`       | "Minimum value is {min}"                  |
| `max`       | "Maximum value is {max}"                  |
| `pattern`   | "Invalid format"                          |

## Form Implementation

### Email Field (Tier 1 - Validator Message)

```typescript
required(path.email); // No message
email(path.email, { message: 'Valid email required' }); // Has message - Tier 1!
```

**Result:** Uses "Valid email required" from validator

### Password Field (Tier 2 - Registry Override)

```typescript
required(path.password); // No message
minLength(path.password, 8); // No message
```

**Provider:**

```typescript
provideErrorMessages({
  minLength: (params) => `Minimum ${params.minLength} characters required`,
});
```

**Result:** Uses registry message "Minimum 8 characters required"

### Bio Field (Tier 3 - Default Fallback)

```typescript
required(path.bio); // No message
```

**No provider entry for `required`**

**Result:** Uses toolkit default "This field is required"

## i18n Integration Patterns

See [packages/toolkit/README.md](../../../packages/toolkit/README.md#error-message-configuration) for complete i18n examples:

- JSON files with LOCALE_ID injection
- ngx-translate integration
- @angular/localize integration
- TypeScript message files

## Testing

All error message features are tested:

```bash
pnpm nx test toolkit --testFile=error-messages.provider.spec.ts
```

**Test Coverage:**

- ✅ Static configuration (string messages, factory functions)
- ✅ Dynamic providers (locale injection, environment-based)
- ✅ Zero-config (empty registry)
- ✅ Type safety (TypeScript compilation)
- ✅ Edge cases (undefined values, special characters)

## Architecture

**Provider:**

- `packages/toolkit/core/providers/error-messages.provider.ts`
- `NGX_ERROR_MESSAGES` injection token
- `provideErrorMessages()` function

**Component Integration:**

- `packages/toolkit/core/components/form-error.component.ts`
- `#resolveErrorMessage()` - 3-tier priority logic
- `#getDefaultMessage()` - Built-in validator fallbacks
- `resolvedErrors` / `resolvedWarnings` computed signals

**Tests:**

- `packages/toolkit/core/providers/error-messages.provider.spec.ts`
- 16 tests across 5 suites
- All tests passing ✅

## Related Documentation

- [Toolkit README - Error Message Configuration](../../../packages/toolkit/README.md#error-message-configuration)
- [Signal Forms Instructions](../../../.github/instructions/signal-forms.instructions.md)
- [Toolkit Instructions](../../../.github/instructions/signal-forms-toolkit.instructions.md)
