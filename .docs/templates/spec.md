# <Feature title>

> One-line summary: what this changes and for whom.

Before using this template, read `.agents/references/artifact-layers.md` to confirm this belongs as a spec and not as a plan, runbook, ADR, or concept doc.

- **Status:** Draft <!-- Draft | In review | Approved | Implemented; set Implemented when the plan is archived, naming what was left out -->
- **Author:** <name>
- **Date:** YYYY-MM-DD
- **Spec ID:** `<YYYY-MM-DD>-<slug>`

## Goal

One paragraph. What problem does this solve? What does success look like?

## Non-goals

- Explicit scope cuts. Things readers might assume are in scope but aren't.

## User stories

Numbered, Given/When/Then.

1. **As a** _\<role\>_ **I want** _\<capability\>_ **so that** _\<outcome\>_.
   - **Given** _\<context\>_
   - **When** _\<action\>_
   - **Then** _\<observable result\>_

## Data model deltas

New / changed tables. Inline zod schemas where they apply.

```sql
-- example
create table if not exists public.example (
  id uuid primary key default gen_random_uuid(),
  ...
);
```

```ts
// example zod schema
export const exampleSchema = z.object({
  id: z.string().uuid(),
});
```

## API surface

| Method   | Path / action name | Auth | Body schema     | Response          |
| -------- | ------------------ | ---- | --------------- | ----------------- |
| `POST`   | `/api/example`     | user | `exampleSchema` | `{ ok: true }`    |
| `action` | `createExample`    | user | `exampleSchema` | `Result<Example>` |

## External integrations

One row per service outside this app that the feature calls or depends on: AI providers (Anthropic, OpenAI), Microsoft Graph / Outlook, WhatsApp, e-mail, transcription, and the Vercel and Supabase platform limits. Write `None` and the reason when nothing outside the app is involved.

These limits surfaced only in tests or production before: the meeting recorder sent 10-minute chunks that took about 5 minutes to transcribe, while the edge function gave OpenAI 140 s; Vercel rejects request bodies above 4.5 MB.

| Service     | What we send | What comes back | Limits (size, time, rate, cost) | When it fails or times out          | Retry                       |
| ----------- | ------------ | --------------- | ------------------------------- | ----------------------------------- | --------------------------- |
| `<service>` | ...          | ...             | ...                             | What the user sees, what is logged. | How many times, idempotent? |

## UI surface

- Screens / routes affected (with paths).
- Key components added / modified.
- i18n keys introduced (under what namespace).

## Non-functional requirements

Numbers, not adjectives. Write `n/a` and the reason for a line that does not apply.

- **Response time:** what the user waits for and the ceiling (e.g. the AI answer starts within 5 s).
- **AI cost:** model per call, expected tokens per use, monthly ceiling per organization.
- **Volume:** largest realistic input (rows, file size, meeting length) and what happens above it.
- **Security and privacy:** who can see the data (RLS, profile, portal) and what must never reach the client or the AI context.
- **Accessibility and mobile:** keyboard path, screen-reader labels, smallest screen width.

## Edge cases & error states

- Empty / loading / error / unauthorized / forbidden / rate-limited / offline.
- Idempotency on retries.

## Rollout / migration plan

- Feature flag? Phased rollout? Backfill?
- Reversibility plan.

## Acceptance criteria

Numbered, testable, written so a black-box test could decide pass/fail. The plan maps every number to at least one slice (`npm run check:plan-format` enforces it).

1. ...
2. ...
3. ...

## Open questions

- [ ] Question 1
- [ ] Question 2

## Out of scope

- Things we considered but explicitly punted.

## References

- Linked plans: `.plans/<...>.html`
- Linked ADRs: `.docs/decisions/<...>.md`
- Related rules: `.agents/rules/<...>.md`
