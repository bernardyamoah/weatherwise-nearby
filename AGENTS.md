# Repository Guidelines

## Project Structure & Module Organization
- Application uses Next.js App Router. Routes live under `src/app`, with feature folders such as `favorites`, `map`, and `weather` containing pages, layouts, and route handlers.
- Reusable UI lives in `src/components` (with primitives in `src/components/ui`), shared hooks in `src/hooks`, shared helpers in `src/lib`, and global client state in `src/store` (Zustand).
- Static assets reside in `public`. Environment configuration belongs in `.env.local` (see README variables for Google Places and Text-to-Speech keys).

## Build, Test, and Development Commands
- `npm run dev` — Start the local Next.js dev server.
- `npm run build` — Create an optimized production build.
- `npm start` — Serve the production build locally.
- `npm run lint` — Run ESLint with the Next.js config; fix warnings before opening a PR.

## Coding Style & Naming Conventions
- Codebase is TypeScript-first. Prefer functional React components, typed props, and server/client boundaries that align with the App Router.
- Use 2-space indentation, descriptive names, and avoid abbreviations. Components and hooks use `PascalCase`/`camelCase`; files typically mirror component names (e.g., `WeatherCard.tsx`, `usePlaces.ts`).
- Styling relies on Tailwind CSS (v4) and utility helpers like `clsx` and `class-variance-authority`; keep class lists concise and ordered by layout → spacing → typography → state.
- Rely on ESLint for consistency. If formatting is needed, match existing patterns instead of introducing new tooling.

## Testing Guidelines
- No automated tests are currently included. When adding coverage, colocate specs near the code (`.test.tsx/.ts`) and prefer React Testing Library for UI behavior.
- Aim to cover new hooks and store updates with unit tests; keep fixtures small and deterministic.
- Run `npm run lint` as a quick sanity check before pushing changes.

## Commit & Pull Request Guidelines
- Existing history uses Conventional Commits (e.g., `feat: ...`). Continue with `feat|fix|chore|refactor|docs` scopes and imperative, concise summaries.
- Keep PRs focused and describe the user-facing change, rationale, and testing performed. Link issues or tickets; include screenshots/GIFs for UI updates when helpful.
- Ensure env keys are not committed. Include notes about new configuration, migrations, or manual steps in the PR description.

## Security & Configuration Tips
- Keep `PLACES_API_KEY` and `GOOGLE_TTS_API_KEY` in `.env.local`; do not log or expose them to the client unnecessarily. Server-side route handlers should proxy sensitive calls.
- Validate external inputs with `zod` where appropriate, and prefer safe defaults when handling geolocation or map parameters.
