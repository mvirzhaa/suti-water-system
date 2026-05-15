# Tech Stack & Build System

## Monorepo

- **Build system:** Turborepo (`turbo.json`) with npm workspaces
- **Package manager:** npm 11+ (enforced via `packageManager` field)
- **Node requirement:** >=18
- **Workspace packages:** `apps/api`, `apps/web`, `apps/docs`, `packages/ui`, `packages/eslint-config`, `packages/typescript-config`

## Backend — `apps/api`

| Concern          | Library                                                       |
| ---------------- | ------------------------------------------------------------- |
| Framework        | Express 5                                                     |
| Language         | TypeScript 5 (`commonjs` module, `ts-node-dev` for dev)       |
| ORM              | Prisma 7 with `@prisma/adapter-pg` (PostgreSQL)               |
| Auth             | JWT (`jsonwebtoken`), bcryptjs, Passport + Google OAuth 2.0   |
| Session          | Refresh tokens stored in DB (hashed); access tokens in-memory |
| Cache / sessions | Redis via `ioredis`                                           |
| File upload      | Multer + Cloudinary (`multer-storage-cloudinary`)             |
| Validation       | Zod 4                                                         |
| Security         | helmet, cors, express-rate-limit                              |
| Logging          | winston, morgan                                               |
| Environment      | dotenv (loaded from monorepo root `.env`)                     |

## Frontend — `apps/web`

| Concern     | Library                                                              |
| ----------- | -------------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router), React 19                                    |
| Language    | TypeScript 5                                                         |
| Styling     | Tailwind CSS (via globals.css), `clsx`, `tailwind-merge`             |
| State       | Zustand 5 with `persist` middleware (localStorage)                   |
| HTTP client | Axios with request/response interceptors for token refresh           |
| Forms       | React Hook Form 7 + `@hookform/resolvers` + Zod 4                    |
| Charts      | Recharts 3                                                           |
| Animations  | Framer Motion 12                                                     |
| Icons       | Lucide React                                                         |
| Dialogs     | SweetAlert2 (for confirmations/errors), custom `Modal.tsx` for forms |

## Database

- **PostgreSQL** managed via Prisma migrations
- Schema lives at `prisma/schema.prisma` (monorepo root)
- Prisma config at `prisma.config.ts` (monorepo root)

## Shared Packages

- `packages/typescript-config` — shared `tsconfig` presets (`base.json`, `nextjs.json`, `react-library.json`)
- `packages/eslint-config` — shared ESLint configs (`base.js`, `next.js`, `react-internal.js`)
- `packages/ui` — shared React component library

## Common Commands

```bash
# Run all apps in dev mode (via Turborepo)
npm run dev

# Run only the API in dev mode
npm run dev --workspace api

# Run only the web app in dev mode
npm run dev --workspace web

# Build all apps
npm run build

# Build only the web app
npm run build --workspace web

# Lint all apps
npm run lint

# Lint only the web app (quiet mode suppresses warnings)
npm run lint --workspace web -- --quiet

# Type-check all apps
npm run check-types

# Format all files
npm run format

# Prisma — generate client after schema changes
npx prisma generate

# Prisma — create and apply a new migration
npx prisma migrate dev --name <migration_name>

# Prisma — run seed
npx ts-node prisma/seed.ts
```

## Environment

All environment variables are in the root `.env` file. The API loads it explicitly via `dotenv.config({ path: path.resolve(__dirname, '../../../.env') })`. The web app uses `NEXT_PUBLIC_API_URL` for the backend base URL.

## Important Notes

- The API has **no `build`, `lint`, or `test` scripts** yet — only `dev`. Add these before production.
- Next.js 16 has breaking changes from earlier versions. Always read `node_modules/next/dist/docs/` before writing Next.js-specific code.
- Do not use `&&` as a command separator on Windows — use `&` (cmd) or `;` (PowerShell).
