# Subscription APIs

End-user subscription management. Subscriptions are tied to **`users.id`**, not business profile ID. Feature usage is counted across all businesses owned by the user.

**Middleware:** `auth:sanctum`, `user.only`

Related: [payment_gateway.md](./payment_gateway.md) — testing-only checkout (not a live gateway)

---

## API Summary

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 1 | `/subscription/plans` | GET | List visible plans with computed prices |
| 2 | `/subscription/store` | POST | Activate a plan (creates subscription) |
| 3 | `/subscription` | POST | List user's subscriptions (paginated) |
| 4 | `/subscription/usage` | GET | Feature quota usage for active subscription |
| 5 | `/subscription/addon` | POST | Manual add-on purchase (disabled) |

---

## 1. List plans

**Endpoint:** `GET /subscription/plans`

**Request Body:** `None`

**Response Body:**
```json
{
  "message": "OK",
  "body": {
    "plans": [
      {
        "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
        "name": "Starter",
        "description": "Basic plan",
        "duration_type": "monthly",
        "status": "active",
        "is_visible": true,
        "final_price": 499.0,
        "features": [
          {
            "feature_id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
            "name": "Project",
            "slug": "project",
            "quantity": 5,
            "final_price": 50.0,
            "final_price_unlimited": null
          }
        ]
      }
    ]
  }
}
```

---

## 2. Activate subscription

**Endpoint:** `POST /subscription/store`

**Request Body:**
```json
{
  "plan_id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c"   /// required, uuid, exists:plans,id (status=active, visible to user)
}
```

**Response Body (201):**
```json
{
  "message": "Subscription activated successfully.",
  "body": {
    "subscription": {
      "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "plan_id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "status": "active",
      "starts_at": "2026-07-19T00:00:00.000000Z",
      "ends_at": "2026-08-19T00:00:00.000000Z"
    }
  }
}
```

---

## 3. List subscriptions

**Endpoint:** `POST /subscription`

**Request Body:**
```json
{
  "page": 1,                        /// optional, numeric, min:1
  "per_page": "10",                 /// optional, string, allowed: 5, 10, 30, 50, 100, all
  "sort_by": "created_at",          /// optional, string, allowed: id, status, started_at, expired_at, created_at
  "sort_dir": "desc",               /// optional, string, allowed: asc, desc
  "status": "active"                /// optional, string, allowed: active, expired, cancelled
}
```

**Response Body:**
```json
{
  "message": "OK",
  "body": {
    "subscriptions": [],
    "active_subscription_id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
    "meta": {
      "current_page": 1,
      "per_page": 10,
      "total": 1,
      "last_page": 1
    }
  }
}
```

---

## 4. Feature usage

**Endpoint:** `GET /subscription/usage`

**Request Body:** `None`

**Response Body:**
```json
{
  "message": "OK",
  "body": {
    "usages": [
      {
        "feature_id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
        "feature_name": "Project",
        "feature_slug": "project",
        "quota": 5,
        "used": 2,
        "remaining": 3
      },
      {
        "feature_id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
        "feature_name": "Site",
        "feature_slug": "site",
        "quota": -1,
        "used": 10,
        "remaining": -1
      }
    ]
  }
}
```

`quota` / `remaining` of `-1` means unlimited.

---

## Feature quota and expiry (end-user API)

Creates are counted live across **all businesses** owned by the user (not the stored `feature_usages.used` column). Staff inherit the parent's subscription.

| Feature slug | Gated create |
|---|---|
| `business` | `POST /business/store` |
| `staff` | `POST /staff/store` (`subscription.active`) |
| `project` | `POST /projects/store` |
| `site` | `POST /sites/store` |
| `item` | `POST /items/store` |
| `ledger` | `POST /ledgers/store` |
| `invoice` | `POST /invoices/store` |
| `transaction` | `POST /invoices/{id}/receive-payment` (new payment only) |

Over-quota returns `403` with `body.code` = `payment_gateway_required` (or `feature_not_included` when quantity is `0`).

Expired plans (`expired_at` in the past) are marked expired on the next gated request. Business-scoped modules, business store, and staff store return `403` / `subscription_expired`. `GET /subscription/usage` then returns no usages.

---

## 5. Add-on purchase

**Endpoint:** `POST /subscription/addon`

**Status:** Disabled — returns `403` with `manual_addon_disabled`.

**Request Body:**
```json
{
  "feature_id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",   /// required, uuid, exists:features,id
  "units": 5                                               /// required, integer, min:1
}
```
