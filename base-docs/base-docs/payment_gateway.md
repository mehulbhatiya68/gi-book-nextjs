# Payment Gateway APIs (Testing stub)

**TEMPORARY — local/testing only.** This is not a live payment gateway.

Direct checkout is on when `APP_ENV` is `local` or `testing`, or when `PAYMENT_TESTING_DIRECT_CHECKOUT=true`. In production it returns `501` until a real gateway is integrated.

**Middleware:** `auth:sanctum`, `user.only`

Related: [subscription.md](./subscription.md)

---

## API Summary

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 1 | `/payment/status` | GET | Whether testing checkout is enabled |
| 2 | `/payment/subscription/checkout` | POST | Testing: create subscription + credit admin/WL wallets |
| 3 | `/payment/addon/checkout` | POST | Testing: purchase extra feature units |

---

## Wallet credits (testing)

When testing checkout is enabled, plan total is stored on the subscription and wallets are credited:

| Recipient | Credit |
|-----------|--------|
| Admin | Base feature prices (`subscription_commission`) |
| White label | Configured margin only (`subscription_commission`) |

---

## 1. Gateway status

**Endpoint:** `GET /payment/status`

**Request Body:** `None`

**Response (testing enabled):**
```json
{
  "message": "OK",
  "body": {
    "available": true,
    "provider": "direct"
  }
}
```

**Response (production / flag off):** `available` is `false`, `provider` is `null`.

---

## 2. Subscription checkout (testing)

**Endpoint:** `POST /payment/subscription/checkout`

When the testing flag is **off**: `501` — `payment_gateway_pending`.

When **on**: creates an active subscription at the plan total price. Previous active subscription is expired.

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
      "duration_type": "monthly",
      "price": 499.0,
      "currency": "INR",
      "status": "active",
      "started_at": "2026-07-19T00:00:00.000000Z",
      "expired_at": "2026-08-19T00:00:00.000000Z",
      "is_active": true
    }
  }
}
```

---

## 3. Add-on checkout (testing)

**Endpoint:** `POST /payment/addon/checkout`

When the testing flag is **off**: `501` — `payment_gateway_pending`.

Requires an active subscription. Feature must already be included in the plan and not unlimited.

**Request Body:**
```json
{
  "feature_id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",   /// required, uuid, exists:features,id
  "units": 5                                               /// required, integer, min:1
}
```

**Response Body (201):**
```json
{
  "message": "Add-on purchased successfully.",
  "body": {
    "addon_purchase": {
      "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "subscription_id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "feature_id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "units": 5,
      "unit_price": 50.0,
      "total_price": 250.0
    }
  }
}
```
