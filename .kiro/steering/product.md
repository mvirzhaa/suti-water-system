# Suti Water System — Product Overview

Suti Water System is an internal inventory management web application for a water product business (e.g., gallon/carton water distribution). It is used by internal staff to manage stock, transactions, master data, and reporting.

## Core Business Domain

- **Stock In (Barang Masuk):** Record incoming stock from suppliers, including quantity, price per unit, total cost, and optional nota (receipt) upload.
- **Stock Out (Barang Keluar):** Record outgoing stock to agents or buyers, with optional discount application and nota upload.
- **Master Data:** Manage products, categories, suppliers, agents, and users.
- **Discounts:** Define percentage or nominal discounts, scoped to all products or specific products, with date ranges and minimum quantity rules.
- **Dashboard:** KPI summary (total agents, total stock, total revenue), top buyers, top products, stock movement chart, low-stock alerts, and recent transactions.
- **Audit Logs:** Track all significant create/update/delete actions with old/new values.

## User Roles

| Role          | Description                                            |
| ------------- | ------------------------------------------------------ |
| `SUPER_ADMIN` | Full access to all features including user management  |
| `PIMPINAN`    | Management-level access, can view reports and all data |
| `STAFF`       | Operational access for daily stock transactions        |

## Auth

- JWT-based auth with access token (in-memory via Zustand) and refresh token (HttpOnly cookie).
- Google OAuth supported.
- All protected routes require a valid JWT; role-based middleware restricts sensitive operations.

## Language

The codebase uses **Indonesian** for comments, variable names in business logic, UI labels, and internal documentation. Code identifiers (function names, TypeScript types) use English.
