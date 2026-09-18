# Permissions (end-user API)

User-scope permissions for `routes/api.php` only. Admin routes are not gated.

**Middleware:** `auth:sanctum`, `account.active`, `user.only`, `user.check.permission:{name}`

---

## How it works

| `type` | Permissions |
|--------|-------------|
| `user` | Every permission with `scope = user` |
| `staff` | Only ids on `user_has_permissions` |

Splash (`GET /splash`) returns the authenticated user's grouped permissions. It does not send `role`.

```json
{
  "message": "OK",
  "body": {
    "user": {
      "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "name": "Ravi",
      "email": "ravi@company.com",
      "type": "staff"
    },
    "permissions": {
      "ledger": [
        { "id": 15, "name": "view" },
        { "id": 16, "name": "create" }
      ],
      "item": [
        { "id": 19, "name": "view" }
      ]
    }
  }
}
```

Missing permission on a gated route:

```json
{
  "message": "Forbidden. Insufficient permission."
}
```

---

## Assign to staff

1. `GET /permissions` — catalog (ids)
2. `POST /staff/store` with `permission_ids` — set on create
3. `PUT /staff/{id}` with `permission_ids` — optional replace on update
4. `PUT /staff/{id}/permissions` — dedicated sync (required `permission_ids`)

Details: [staff.md](./staff.md)

---

## Seeded ids (`scope = user`)

| IDs | Module | Actions |
|-----|--------|---------|
| 1–4 | business | view, create, update, delete |
| 5–8 | staff | view, create, update, delete |
| 9–10 | subscription | view, create |
| 11–12 | payment | view, create |
| 13–14 | settings | view, update |
| 15–18 | ledger | view, create, update, delete |
| 19–22 | item | view, create, update, delete |
| 23–24, 115–116 | transaction | view, create, update, delete |
| 25–28 | invoice | view, create, update, delete |
| 29–32 | project | view, create, update, delete |
| 33–36 | site | view, create, update, delete |
| 37 | report | view |
| 38 | notification | view |
| 123 | notification | update |
| 124 | device_token | create | *(legacy — no API; FCM stored on login)* |
| 125 | device_token | delete | *(legacy — no API)* |

---

## Route → permission mapping

| Route | Method | Permission | Notes |
|-------|--------|------------|-------|
| `/notifications` | GET | `notification.view` | Business-scoped; marks all as read |
| `/notifications/test-push` | POST | `notification.update` | User-only; no business/subscription required |
| `/notification-preferences` | GET | `notification.view` | Business-scoped |
| `/notification-preferences` | PUT | `notification.update` | Business-scoped |
| `/notifications/unsubscribe-subscription/{subscription}` | GET | — | Public signed URL (from email) |

FCM token is saved on `POST /auth/login` and `POST /auth/register` (not a separate device-token API).

```bash
php artisan db:seed --class=PermissionSeeder
```
