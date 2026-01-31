## Plan: Demo vs toolkit coverage audit

TL;DR: Validate toolkit exports against demo usages, then document concrete gaps and mismatches with file-based evidence, and propose focused demo additions or README corrections. This avoids speculative conclusions and aligns with Angular 21+ conventions in the repo.

**Steps**

1. Enumerate toolkit public exports in `packages/toolkit/*/index.ts` and `public_api.ts` to confirm the authoritative feature list.
2. Map each export to demo usage by scanning `apps/demo/src/app/**` and matching imports/usages.
3. Verify documentation consistency by checking demo READMEs for library naming, API references, and features.
4. Produce a gap list (missing demos) and mismatch list (incorrect demos/docs), referencing exact files.
5. Propose specific demo additions or README edits to resolve each gap/mismatch. And come up with actual form use cases for missing features. Either by improving existing demo form components or suggesting new ones.
6. Make sure to use existing Angular 21+ patterns in the demo code, avoiding legacy approaches.
7. Compile findings into a report with actionable next steps.

**Verification**

- Manual checks: confirm each reported gap by searching for import or selector usage in `apps/demo/src/app/**`.
- Cross-check docs in `apps/demo/README.md` and sub-readmes for naming/API accuracy.

**Decisions**

- Treat demo “usage” as actual template or TS imports, not just README mentions.
- Only flag gaps when no usage is found anywhere in `apps/demo`.
