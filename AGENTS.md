# Repository Guidelines

## Project Structure & Module Organization

My Recipe is a React 19, TypeScript, and Vite application for shared recipe management, backed by Supabase when configured.

- `src/pages/`: route-level screens, such as `RecipeListPage.tsx`.
- `src/features/recipes/` and `src/features/groups/`: feature APIs and recipe-specific components.
- `src/components/`: shared UI; `src/contexts/`: application state.
- `src/lib/`: Supabase setup, localStorage persistence, demo data, and error helpers.
- `src/types/database.ts`: shared database and form types.
- `src/assets/` and `public/`: bundled images and static assets.
- Styling uses Tailwind CSS v4. The theme (`@theme`) and global base styles live in `src/index.css`; shared class names live in `src/components/styles.ts` and `src/components/buttonStyles.ts`.
- `supabase/migrations/`: ordered SQL migrations; `docs/`: implementation and design plans.

## Build, Test, and Development Commands

Use mise to manage Node.js and npm. `mise.toml` specifies Node.js 22; run `mise install` to install the configured version. Run the commands below in a shell with mise activated, or prefix them with `mise exec --` (for example, `mise exec -- npm run build`). Keep Node.js version configuration in `mise.toml`.

- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite development server.
- `npm run build`: run TypeScript project checks and generate `dist/`.
- `npm run lint`: run Oxlint with React, TypeScript, and Oxc rules.
- `npm run preview`: serve the production build locally after building.

## Coding Style & Naming Conventions

Follow existing code: two-space indentation, single-quoted TypeScript strings, no semicolons, and trailing commas in multiline structures. Use PascalCase for React components and their files, camelCase for functions and variables, and `import type` for type-only imports. Keep feature logic within its feature directory and reusable UI in `src/components/`. Preserve snake_case database fields when mapping camelCase form values. Oxlint configuration is in `.oxlintrc.json`; no formatter is configured.

## Testing Guidelines

No automated test framework, test script, or coverage threshold is configured. Before submitting, run `npm run lint` and `npm run build`. Manually verify affected recipe and group flows. Check localStorage preview behavior without environment variables, connected Supabase behavior when relevant, and the read-only demo restrictions. Document verification steps in the pull request.

## Commit & Pull Request Guidelines

Recent commits use short, descriptive Japanese messages, such as `デモモードを追加`; no formal prefix convention is established. Keep commits focused. Pull requests should describe the behavior change, include verification results, link relevant issues, and attach screenshots for UI changes. Explain schema changes and required migrations.

## Configuration & Security

Copy `.env.example` to `.env.local` and set the Supabase URL and publishable key when needed. Never expose service-role keys through `VITE_*` variables. Keep local environment files untracked. Add schema changes as timestamped SQL migrations and preserve group access controls through RLS and RPC behavior.
