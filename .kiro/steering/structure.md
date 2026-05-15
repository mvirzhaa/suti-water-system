# Project Structure

## Root Layout

```
suti-water-system/
├── apps/
│   ├── api/          # Express backend
│   ├── web/          # Next.js frontend
│   └── docs/         # Next.js docs app (minimal, not primary)
├── packages/
│   ├── eslint-config/       # Shared ESLint configs
│   ├── typescript-config/   # Shared tsconfig presets
│   └── ui/                  # Shared React component library
├── prisma/
│   ├── schema.prisma        # Single source of truth for DB schema
│   ├── seed.ts
│   └── migrations/
├── .env                     # All env vars for all apps (monorepo root)
├── package.json             # Root workspace + shared devDependencies
├── turbo.json               # Turborepo pipeline config
└── prisma.config.ts
```

## Backend — `apps/api/src/`

```
src/
├── app.ts                   # Express app entry: middleware, routes, server start
├── config/
│   ├── database.ts          # Prisma client singleton
│   ├── redis.ts             # Redis client
│   ├── cloudinary.ts        # Cloudinary config
│   └── passport.ts          # Google OAuth strategy
├── middlewares/
│   ├── auth.middleware.ts   # verifyJWT — attaches req.user
│   ├── role.middleware.ts   # requireRole(...roles) — RBAC guard
│   ├── validate.middleware.ts # Zod schema validation
│   ├── upload.middleware.ts  # Multer/Cloudinary upload handlers
│   ├── rateLimit.middleware.ts
│   └── error.middleware.ts  # Global error handler (must be last)
├── modules/                 # Feature modules (one folder per domain)
│   └── <module>/
│       ├── <module>.routes.ts      # Express Router + middleware chain
│       ├── <module>.controller.ts  # Request/response handling only
│       ├── <module>.service.ts     # Business logic + Prisma queries
│       └── <module>.schema.ts      # Zod schemas for request validation
└── utils/
    ├── ApiResponse.ts       # Standardised JSON response helpers
    ├── ApiError.ts          # Custom error class with static factory methods
    ├── generateToken.ts     # JWT generation, refresh token helpers
    ├── auditLog.ts          # Audit log writer helper
    └── logger.ts            # Winston logger
```

### API Module Conventions

- Each module follows the **routes → controller → service** pattern.
- Controllers only call service methods and use `ApiResponse` to send responses.
- Services contain all business logic and Prisma queries; they throw `ApiError` on failure.
- Route files wire up middleware: `verifyJWT` first, then `requireRole`, then `validate(schema)`, then the controller method.
- All API routes are prefixed `/api/v1/<resource>`.
- Response shape is always `{ success, message, data, meta? }` via `ApiResponse`.
- Errors are always `{ success: false, message, code, errors? }` via `ApiError` + `errorMiddleware`.

### Current Modules

`auth`, `users`, `categories`, `products`, `suppliers`, `agents`, `stock-in`, `stock-out`, `discounts`, `dashboard`, `audit-logs`

## Frontend — `apps/web/src/`

```
src/
├── app/                     # Next.js App Router pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Root redirect
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── auth/callback/       # Google OAuth callback
│   └── dashboard/
│       ├── layout.tsx       # Protected dashboard layout (auth guard)
│       ├── page.tsx         # Dashboard home
│       ├── master/          # Master data pages (products, suppliers, agents, users)
│       ├── stock-in/
│       ├── stock-out/
│       ├── discounts/
│       └── reports/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx      # Nav sidebar with mobile drawer
│   │   └── Header.tsx
│   └── ui/
│       └── Modal.tsx        # Reusable modal wrapper for forms
├── services/                # One file per API resource
│   └── <resource>.service.ts  # Thin wrappers around `api` axios instance
├── store/
│   └── useAuthStore.ts      # Zustand auth store (user, accessToken, isAuthenticated)
├── lib/
│   ├── axios.ts             # Axios instance with JWT + auto-refresh interceptors
│   └── api-error.ts         # Frontend error parsing helper
└── types/
    └── api.ts               # Shared TypeScript types mirroring API response shapes
```

### Frontend Conventions

- **Services** (`src/services/`) are plain objects with async methods that call the shared `api` axios instance. No business logic — just HTTP calls.
- **Stores** use Zustand. Only `useAuthStore` exists currently; add new stores in `src/store/`.
- **Types** in `src/types/api.ts` mirror backend response shapes. Keep them in sync with Prisma models and API responses.
- **Forms** use React Hook Form + Zod resolver. Define the Zod schema in the same file as the form component.
- **Dialogs:** use `SweetAlert2` for confirmations and success/error toasts; use `Modal.tsx` for form modals. Do not mix `window.alert` with SweetAlert2.
- **Styling:** Tailwind utility classes directly in JSX. Use `clsx`/`tailwind-merge` for conditional classes. Avoid inline `style` props.
- **Images:** prefer `next/image` over `<img>` tags.
- Auth guard lives in `dashboard/layout.tsx` — it checks `useAuthStore.isAuthenticated` and redirects to `/login` if false.

## Prisma / Database Conventions

- All model field names use `camelCase` in Prisma; mapped to `snake_case` in PostgreSQL via `@map`.
- All tables are mapped to `snake_case` plural names via `@@map`.
- Soft delete uses `deletedAt DateTime?` — always filter `deletedAt: null` in queries.
- UUIDs are used for all primary keys (`@id @default(uuid())`).
- Decimal fields use `@db.Decimal(12, 2)` for prices and `@db.Decimal(14, 2)` for totals.
- Always use `select` in Prisma queries to avoid returning sensitive fields (e.g., `password`, `tokenHash`).
