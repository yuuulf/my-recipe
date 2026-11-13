# Repository Guidelines

## Project Structure & Module Organization

My Recipe is a React 19, TypeScript, and Vite application for shared recipe management, backed by Supabase when configured.

- `src/pages/`: route-level screens, such as `RecipeListPage.tsx`.
- `src/features/recipes/` and `src/features/groups/`: feature APIs and recipe-specific components.
- `src/components/`: shared UI; `src/contexts/`: application state.
- `src/lib/`: Supabase setup, demo data, and error helpers.
- `src/types/database.ts`: shared database and form types.
- `src/assets/` and `public/`: bundled images and static assets.
- Styling uses Tailwind CSS v4. The theme (`@theme`) and global base styles live in `src/index.css`; shared class names live in `src/components/styles.ts` and `src/components/buttonStyles.ts`.
- `supabase/migrations/`: ordered SQL migrations; `supabase/seed.sql`: sample data for Supabase Local; `supabase/config.toml`: Supabase Local settings; `supabase/functions/`: Supabase Edge Functions (`recipe-draft` calls OpenRouter for AI recipe drafts; its draft cleaning lives in `draft.ts` so Vitest can test it); `supabase/tests/`: pgTAP database tests; `docs/`: implementation and design plans.

## Build, Test, and Development Commands

Use mise to manage Node.js and npm. `mise.toml` specifies Node.js 22; run `mise install` to install the configured version. Run the commands below in a shell with mise activated, or prefix them with `mise exec --` (for example, `mise exec -- npm run build`). Keep Node.js version configuration in `mise.toml`.

- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite development server.
- `npm run build`: run TypeScript project checks and generate `dist/`.
- `npm run lint`: run Oxlint with React, TypeScript, and Oxc rules.
- `npm test`: run the Vitest unit and component tests once (`npm run test:watch` to rerun on changes). Needs no Supabase.
- `npm run preview`: serve the production build locally after building.
- `npm run db:start` / `db:stop`: start or stop Supabase Local (needs Docker; OrbStack is used).
- `npm run db:reset`: recreate the local database and apply migrations and `supabase/seed.sql`.
- `npm run db:status`: show the local API URL, publishable key, and Studio URL.
- `npm run db:test`: run the pgTAP tests in `supabase/tests/` against Supabase Local (must be running).

## Coding Style & Naming Conventions

Follow existing code: two-space indentation, single-quoted TypeScript strings, no semicolons, and trailing commas in multiline structures. Use PascalCase for React components and their files, camelCase for functions and variables, and `import type` for type-only imports. Keep feature logic within its feature directory and reusable UI in `src/components/`. Preserve snake_case database fields when mapping camelCase form values. Oxlint configuration is in `.oxlintrc.json`; no formatter is configured.

## Testing Guidelines

Unit and component tests use Vitest with React Testing Library (jsdom). Put them next to the code as `*.test.ts` or `*.test.tsx`, import `describe`, `it`, and `expect` from `vitest`, and render components with `AppContext.Provider` (see `src/test/appContextValue.ts`) and `MemoryRouter` instead of `AppProvider`, so tests never call Supabase. Test files are type-checked by `tsconfig.test.json` during `npm run build`. Database tests use pgTAP in `supabase/tests/*.test.sql`: each file runs in a transaction that is rolled back, creates its own data instead of relying on `supabase/seed.sql`, and acts as a user with `set local role authenticated` and `request.jwt.claims`. No coverage threshold is configured.

GitHub Actions (`.github/workflows/ci.yml`) runs lint, build, and Vitest, and the pgTAP tests against a fresh Supabase Local, on every pull request. Before submitting, run `npm run lint`, `npm run build`, `npm test`, and `npm run db:test`, and add tests for logic, components, RLS, and RPC changes. Automated tests do not replace manual checks: manually verify affected recipe and group flows against Supabase Local, including RLS and RPC behavior, and the read-only demo restrictions. Do not verify against the production Supabase project; production behavior is checked on Vercel deployments. Document verification steps in the pull request.

## Commit & Pull Request Guidelines

Recent commits use short, descriptive Japanese messages, such as `デモモードを追加`; no formal prefix convention is established. Keep commits focused. Pull requests should describe the behavior change, include verification results, link relevant issues, and attach screenshots for UI changes. Explain schema changes and required migrations.

## Configuration & Security

Copy `.env.example` to `.env.local` and set `API_URL` and `PUBLISHABLE_KEY` from `npm run db:status` (never `SECRET_KEY`). Keep production connection values only in Vercel. Put the Google OAuth client ID and secret for Supabase Local in `supabase/.env`, and the OpenRouter API key and model in `supabase/functions/.env`; both are untracked. Production Edge Function secrets are set with `npx supabase secrets set`. Never send the OpenRouter key to the browser; only Edge Functions read it. Never expose service-role keys through `VITE_*` variables. Keep local environment files untracked. Add schema changes as timestamped SQL migrations, keep `supabase/seed.sql` working with them (`npm run db:reset`), and preserve group access controls through RLS and RPC behavior.
