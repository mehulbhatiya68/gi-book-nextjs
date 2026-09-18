# Gi-Book Main API Documentation

Documentation for **end-user APIs** defined in `routes/api.php`.

## Base URL

```
https://{APP_DOMAIN}/api
```

Example (local): `http://gibook.test/api`

Authentication uses **Laravel Sanctum** bearer tokens. Send `Authorization: Bearer {token}` on protected routes.

Postman collection: `docs/post-man/Gi-Book.postman_collection.json`

### Request body format

All POST/PUT request bodies use inline validation comments:

```json
{
  "email": "john@example.com",      /// required, string, email
  "password": "password123"         /// required, string, min:8
}
```

---

## Middleware Layers

| Middleware | Applies to | Effect |
|------------|------------|--------|
| `auth:sanctum` | All protected routes | Requires valid bearer token |
| `account.active` | Splash (when a token is present) and all protected routes | Inactive accounts receive `403` `account_inactive` and all sessions are revoked |
| `user.only` | Business, staff, subscription, payment | Blocks admin / white label accounts |
| `user.check.permission` | Business, staff, subscription, payment, settings, ledgers, items, transactions, invoices, projects, sites, reports, notifications, notification-preferences | Staff must hold permission; `user` accounts pass |
| `business.selected` | Settings, ledgers, items, transactions, invoices, projects, sites, reports, `GET /notifications`, notification-preferences | Requires an active business profile on the user |
| `subscription.active` | Business store, staff store, all business-scoped routes | Requires an active (not expired) end-user subscription |

`POST /notifications/test-push` is under `user.only` only — no business or subscription required.

**Typical flow for a new end user**

1. Register / login → get token  
2. List plans → `GET /subscription/plans`  
3. Activate subscription → `POST /subscription/store`  
4. Create business → `POST /business/store`  
5. Select business → `POST /business/select/{id}`  
6. Use business-scoped modules (ledgers, items, etc.)

Staff accounts (`user_staff`) inherit the parent user's subscription and business context.

---

## API Groups

| Group | Document | Middleware |
|-------|----------|------------|
| Auth | [auth.md](./auth.md) | Public + `auth:sanctum` |
| App info (about, policies, version) | [app_info.md](./app_info.md) | Public |
| Subscription | [subscription.md](./subscription.md) | `user.only` |
| Payment checkout (testing stub) | [payment_gateway.md](./payment_gateway.md) | `user.only` |
| Business profiles | [business.md](./business.md) | `user.only` (+ `subscription.active` on store) |
| Staff | [staff.md](./staff.md) | `user.only` (+ `subscription.active` on store, `user.check.permission`) |
| Permissions | [permissions.md](./permissions.md) | `user.only`, `user.check.permission` |
| Settings | [settings.md](./settings.md) | `user.only`, `business.selected`, `subscription.active` |
| Ledgers | [ledgers.md](./ledgers.md) | business-scoped |
| Items | [items.md](./items.md) | business-scoped |
| Transactions | [transactions.md](./transactions.md) | business-scoped |
| Projects & sites | [projects_sites.md](./projects_sites.md) | business-scoped |
| Invoices | [invoices.md](./invoices.md) | business-scoped |
| Reports | [reports.md](./reports.md) | business-scoped |
| Notifications | [notifications.md](./notifications.md) | `user.only` for test push; list + preferences are business-scoped |
| Architecture overview | [architecture.md](./architecture.md) | — |

### Planned / not yet routed

These placeholder docs exist for future modules. Routes are commented out in `api.php`:

- [parties.md](./parties.md)
- [payments.md](./payments.md)

---

## Admin & white label APIs

Platform and reseller APIs live on a **separate subdomain** and are documented in [../admin-docs/README.md](../admin-docs/README.md).

```
https://api.admin.{APP_DOMAIN}/api
```

Do not use the main-domain auth token on the admin subdomain (and vice versa).

---

## Response format

All endpoints return JSON:

```json
{
  "message": "OK",
  "body": { }
}
```

Errors:

```json
{
  "message": "Error description",
  "error_code": "optional_code"
}
```

List endpoints that support pagination include a `meta` object:

```json
{
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 42,
    "last_page": 5
  }
}
```

Common list body fields: `page`, `per_page` (`5`, `10`, `30`, `50`, `100`, `all`), `sort_by`, `sort_dir` (`asc` / `desc`), `search`.
