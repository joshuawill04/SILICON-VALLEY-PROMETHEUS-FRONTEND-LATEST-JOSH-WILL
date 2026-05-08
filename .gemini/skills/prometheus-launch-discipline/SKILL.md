# Prometheus Launch Discipline

This skill enforces surgical development, workflow gates, skill routing, and a bias toward excellence for the Prometheus project. It is the mandatory governance layer for all engineering tasks.

## Skill Routing Protocol

Before any audit, diagnosis, or code modification, classify the task and activate/recommend the best skill stack:

1. **UI / UX / Frontend Visuals**
   - **Skills**: `ui-ux-pro-max`, `react-performance-optimization`, `nextjs-best-practices`
   - **Audit**: Visual hierarchy, spacing, responsiveness, premium "cinematic" feel, accessibility, animation restraint, no generic SaaS/template energy.

2. **Next.js / React / App Router / Route Handlers**
   - **Skills**: `nextjs-best-practices`, `react-performance-optimization`
   - **Audit**: Server/client boundaries, route handler safety, data fetching patterns, build safety, hydration issues, dependency risks.

3. **Supabase / Postgres / RLS / Metadata**
   - **Skills**: `supabase-postgres-best-practices`, `nextjs-best-practices`
   - **Audit**: `auth.uid()` ownership, RLS policies, safe migrations, JSONB shape, no service role abuse, query performance.

4. **R2 / Media Storage / Recovery**
   - **Skills**: `nextjs-best-practices`, `supabase-postgres-best-practices`
   - **Audit**: No secrets client-side, presigned URL safety, CORS, bucket/key structure, project ownership, recovery after refresh.

5. **Bug Diagnosis**
   - **Skills**: `systematic-debugging`, `triage`, plus domain-specific skills.
   - **Audit**: Exact failure point, reproduction steps, smallest safe fix, no blind patches.

6. **Product / Feature Planning**
   - **Skills**: `product-brainstorming`
   - **Audit**: Painkiller vs vitamin, customer trust/launch impact, smallest testable version, non-goals.

7. **Gemini API / AI Integration**
   - **Skills**: `gemini-api-dev`, `gemini-interactions-api`, `gemini-live-api-dev`
   - **Audit**: Structured output, model choice, latency/cost, fallback behavior, security.

8. **PRD / Issue Planning**
   - **Skills**: `triage`
   - **Output**: Customer problem, scope, non-goals, success criteria, risks, phases.

---

## Excellence Bias

For every task, do not merely satisfy the literal request. Ask:
- What would make this feel premium/cinematic?
- What would make this safer or more reliable?
- What would a senior product lead catch that was not explicitly asked for?
- **Small Surprising Improvements**: Find one small, relevant, low-risk improvement that increases quality without expanding scope.

---

## Mandatory Output Before Coding

Every response initiating a task must include:
1. **Task Classification**: (e.g., Bug Diagnosis, UI Frontend)
2. **Skill Stack Selected**: List of activated skills.
3. **Painkiller vs Vitamin Verdict**: Product reasoning.
4. **Branch Status**: Branch check result.
5. **Files to Inspect**: List of target files.
6. **Smallest Safe Plan**: Surgical implementation steps.
7. **Risks**: Potential side effects or regressions.
8. **Approval Request**: Explicitly wait for user "Go".

---

## The Workflow Gates

### 1. Business-Value Gate
- Is this a painkiller (fixes a critical leak) or a vitamin (nice to have)?
- What breaks if we do not build it?
- Does it increase launch readiness, trust, or infrastructure durability?

### 2. Git Gate
- Check current branch via `git branch --show-current`.
- **NEVER** code features on `main`.
- Create `feat/`, `fix/`, or `chore/` branches as required.
- Commit only intended files; merge only after full validation.

### 3. Architecture Gate
- Inspect and map files before editing.
- Smallest safe patch principle: avoid random rewrites or unrelated "cleanups."

### 4. Safety Gate
- **NO SECRETS**: Audit for `.env`, secrets, or service role keys in every diff.
- R2 secrets must remain server-side.
- Verify project ownership for all data/media access.

### 5. Validation Gate
- Run `npm run typecheck`, `npm run lint`, and `npm run build` after changes.
- Perform runtime verification for all media recovery or auth flows.

### 6. Product Direction
- Launch infrastructure and durable recovery over shiny complexity.
- Premium, Apple-like UI quality is the standard.

---

## Hard Stop Rules

**STOP AND ASK** before:
- Editing on `main`.
- Touching billing, security, or auth logic.
- Changing database schema or RLS policies.
- Adding new `npm` dependencies.
- Modifying large, complex editor files (e.g., `app/editor/[id]/page.tsx`).
- Committing or pushing.
- Committing `.env.local` or any sensitive credentials.
