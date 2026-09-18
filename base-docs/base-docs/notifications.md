# Notifications APIs

This document defines the notifications database schema, metadata for frontend navigation, Firebase push, and API endpoints.

## API Summary Table

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/notifications` | GET | List notifications (with pagination) and mark all as read | Yes |
| 2 | `/notifications/test-push` | POST | Test Firebase push (title, description, image, metadata; uses login FCM token if omitted) | Yes (user only) |
| 3 | `/notification-preferences` | GET | List user notification preferences | Yes |
| 4 | `/notification-preferences` | PUT | Update notification preferences | Yes |
| 5 | `/notifications/unsubscribe-subscription/{subscription}` | GET | Public signed link — turn off plan reminders (from email) | No (signed URL) |

### Admin / White Label (`/api/admin`)

| # | Endpoint | Method | Description |
|---|---|---|---|
| 1 | `/scheduled-notifications` | POST | List scheduled notifications |
| 2 | `/scheduled-notifications/store` | POST | Create notification (draft/scheduled) |
| 3 | `/scheduled-notifications/{id}` | PUT | Update notification |
| 4 | `/scheduled-notifications/{id}` | DELETE | Delete notification |
| 5 | `/scheduled-notifications/{id}/cancel` | POST | Cancel scheduled notification |
| 6 | `/scheduled-notifications/{id}/send` | POST | Send immediately |
| 7 | `/notification-settings/subscription-expiry` | GET | Get expiry reminder settings |
| 8 | `/notification-settings/subscription-expiry` | PUT | Save expiry reminder settings |
| 9 | `/notification-settings/subscription-addon` | GET | Get addon/limit reminder settings |
| 10 | `/notification-settings/subscription-addon` | PUT | Save addon/limit reminder settings |

Admin notification APIs: [../admin-docs/notifications.md](../admin-docs/notifications.md)

---

## Database Schema: `notifications`

```text
id(UUID) - Primary Key
user_id(UUID - Foreign Key) - Associated user notification target
title(STRING) - Short notification title
message(TEXT) - Detailed notification message body
metadata(JSON - nullable) - Frontend action and related entity IDs
is_read(BOOLEAN) - Read state flag (defaults to false)
timestamps
```

*Note: Stores in-app notifications. Created automatically on business events (invoice, staff, subscription, stock, etc.).*

### `users` (FCM)

```text
fcm_token(STRING - nullable) - Firebase device token (set on login/register)
fcm_platform(STRING - nullable) - android, ios, web
```

### `subscriptions` (marketing opt-out)

```text
notify_marketing(BOOLEAN - default true) - When false, no expiry/addon email or push for this plan
```

New subscription on purchase sets `notify_marketing = true` again.

---

### `metadata` shape

Used by the mobile/web app to navigate when the user taps a notification.

| Field | Type | Description |
|-------|------|-------------|
| `action` | string | Frontend route action (see actions below) |
| `invoice_id` | uuid | Open a specific invoice |
| `staff_id` | uuid | Open a specific staff member |
| `subscription_id` | uuid | Open subscription / renew flow |
| `item_id` | uuid | Open a specific item |
| `transaction_id` | uuid | Open a transaction |
| `ledger_id` | uuid | Open a ledger |
| `business_id` | uuid | Business context |
| `feature_id` | uuid | Feature for addon purchase |
| `feature_slug` | string | Feature slug (e.g. `invoice`, `item`) |
| `actor_user_id` | uuid | User who triggered the action (staff) |
| `days_until_expiry` | string | Days until subscription expires |
| `units_needed` | string | Addon units required |
| `units` | string | Addon units purchased |
| `dedupe_key` | string | Internal dedupe for scheduled reminders |

### Supported `action` values

| Action | Frontend use |
|--------|----------------|
| `invoice.view` | Open invoice detail (`invoice_id`) |
| `invoice.list` | Open invoice list |
| `staff.view` | Open staff detail (`staff_id`) |
| `staff.list` | Open staff list |
| `subscription.view` | Open subscription (`subscription_id`) |
| `subscription.addon` | Open addon purchase (`subscription_id`, `feature_slug`) |
| `subscription.activated` | Subscription activated (`subscription_id`) |
| `subscription.expiring` | Renew before expiry (`subscription_id`, `days_until_expiry`) |
| `subscription.expired` | Subscription expired — renew (`subscription_id`) |
| `subscription.feature_limit` | Feature limit reached |
| `subscription.addon_purchased` | Addon purchased successfully |
| `item.view` | Open item detail (`item_id`) |
| `item.list` | Open item list |
| `stock.alert` | Low / out of stock (`item_id`) |
| `transaction.view` | Open transaction (`transaction_id`) |
| `ledger.view` | Open ledger (`ledger_id`) |
| `general` | Show message only, no navigation |

---

## Automatic notification triggers

| Event | Action | Metadata IDs |
|-------|--------|--------------|
| Invoice created / updated / payment | `invoice.view` | `invoice_id`, `business_id`, `actor_user_id` |
| Invoice deleted | `invoice.list` | `invoice_id`, `business_id` |
| Staff created / updated | `staff.view` | `staff_id`, `actor_user_id` |
| Staff deleted | `staff.list` | `staff_id` |
| Subscription activated | `subscription.activated` | `subscription_id` |
| Subscription expiring (configured days) | `subscription.expiring` | `subscription_id`, `days_until_expiry` |
| Subscription expired | `subscription.expired` | `subscription_id` |
| Feature limit / addon needed | `subscription.addon` | `subscription_id`, `feature_id`, `feature_slug` |
| Addon auto-purchased | `subscription.addon_purchased` | `subscription_id`, `feature_id`, `units` |
| Stock adjusted | `item.view` | `item_id`, `business_id` |
| Out of stock | `stock.alert` | `item_id`, `business_id` |
| Transaction created / deleted | `transaction.view` | `transaction_id`, `business_id` |
| Ledger created / deleted | `ledger.view` | `ledger_id`, `business_id` |

Staff actions notify the **account owner** (`user`), not the staff member. `actor_user_id` identifies who performed the action.

Subscription expiry/addon reminders also send **email** with an unsubscribe button (signed URL).

Scheduled commands:

- `notifications:process-scheduled` — every minute
- `notifications:subscription-expiry-reminders` — daily at 10:00
- `subscriptions:expire` — daily (also sends `subscription.expired` when `notify_marketing` is true)

---

## Unread Count (Splash)

`GET /splash` includes `notifications_count` for authenticated end users.

- Authenticated: unread notification count for the logged-in user
- Unauthenticated / non end-user: `null`

---

## 1. List Notifications

**Endpoint**: `GET /notifications`

Calling this endpoint lists the authenticated user's notifications and marks **all** of their notifications as read.

**Query Params** (optional):

- `page` — page number (default: 1)
- `per_page` — `5`, `10`, `15`, `30`, `50`, `100`, or `all` (default: `15`)

**Permission**: `notification.view`

---

## 2. Test Firebase Push

**Endpoint**: `POST /notifications/test-push`

Sends a test push to the given FCM token or the token stored on the authenticated user from login/register.

**Permission**: `notification.update`

**No business / subscription required** (user-only route).

### Full example payload

```json
{
  "fcm_token": "device-fcm-token-here",
  "title": "Subscription expiring soon",
  "description": "Your Gi Book plan expires in 3 days. Renew now to avoid interruption.",
  "image_url": "https://example.com/images/push-banner.png",
  "data": {
    "action": "subscription.expiring",
    "subscription_id": "019f671c-0947-735c-842a-85d884bc0f2e",
    "screen": "subscription_detail"
  },
  "metadata": {
    "source": "api_test"
  }
}
```

### Minimal payload (uses login FCM token)

If you logged in with `fcm_token`, you can send an empty body or only content fields:

```json
{
  "title": "Gi Book test",
  "description": "Firebase push is working."
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `fcm_token` | No* | Omit to use `fcm_token` saved on the authenticated user from login/register |
| `title` | No | Default: `Gi Book test notification` |
| `description` | No | Default: `Firebase push is working.` (`message` is accepted as alias) |
| `image_url` | No | HTTPS image URL shown in the push notification |
| `data` | No | Key-value FCM data payload (values sent as strings) |
| `metadata` | No | Alias for `data`; merged together (`data` wins on duplicate keys) |

\*Required unless the authenticated user already has `fcm_token` from login/register.

**Response** (success):

```json
{
  "message": "Push notification sent successfully.",
  "body": {
    "success": true,
    "message": "Push notification sent successfully.",
    "payload": {
      "title": "Subscription expiring soon",
      "description": "Your Gi Book plan expires in 3 days. Renew now to avoid interruption.",
      "image_url": "https://example.com/images/push-banner.png",
      "data": {
        "action": "subscription.expiring",
        "subscription_id": "019f671c-0947-735c-842a-85d884bc0f2e",
        "screen": "subscription_detail",
        "source": "api_test"
      },
      "fcm_token_source": "request"
    }
  }
}
```

---

## 3. FCM token on login / register

FCM is stored on the **user** record (not admin). Pass on login or register:

```json
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123",
  "fcm_token": "device-fcm-token",
  "fcm_platform": "android"
}
```

```json
POST /auth/register
{
  "name": "John",
  "email": "user@example.com",
  "password": "password123",
  "mobile_number": "9876543210",
  "country_code": 91,
  "fcm_token": "device-fcm-token",
  "fcm_platform": "android"
}
```

If the same `fcm_token` is used on another account, it is cleared from the previous user.

Push is sent when in-app notifications are created if `push_enabled` preference is on and `fcm_token` is set.

---

## 4. Subscription email opt-out

**Endpoint**: `GET /notifications/unsubscribe-subscription/{subscription}?signature=...`

Public signed URL (from subscription reminder emails). Sets `subscriptions.notify_marketing = false` for that plan only. Disables email + push reminders for that subscription until a new plan is purchased.

---

## Firebase setup

Place the service account JSON at:

```
storage/app/firebase/gi-book-5a437-firebase-adminsdk-fbsvc-132811444f.json
```

Optional `.env`:

```env
FIREBASE_PROJECT_ID=gi-book-5a437
# FIREBASE_CREDENTIALS=  # override path only if needed
```

`project_id` is read from the JSON when `FIREBASE_PROJECT_ID` is omitted.

**Server deploy:** run `composer install` so `firebase/php-jwt` is installed (required for FCM HTTP v1 auth).

---

## User notification preferences

| Key | Description |
|-----|-------------|
| `push_enabled` | Master push toggle |
| `staff_invoice` | Staff invoice actions |
| `staff_stock` | Staff stock adjustments |
| `staff_transaction` | Staff transactions |
| `staff_ledger` | Staff ledger changes |
| `staff_delete` | Staff deletions |
| `stock_alerts` | Min/max/out-of-stock alerts |
| `subscription_marketing` | Legacy preference key (subscription opt-out uses `notify_marketing` on plan) |
| `large_payment` | Large payment alerts (`config.min_amount`) |

**GET** `/notification-preferences` — returns all keys with `is_enabled` and `config`.

**PUT** `/notification-preferences`:

```json
{
  "business_id": "uuid",
  "preferences": {
    "push_enabled": { "is_enabled": true },
    "stock_alerts": { "is_enabled": true },
    "large_payment": { "is_enabled": true, "config": { "min_amount": 50000 } }
  }
}
```

---

## Item stock alerts

Per-item `min_stock_alert` and `max_stock_alert` fields. Alerts use `stock_alerts` user preference.

---

## Scheduled notifications (admin)

Single `scheduled_notifications` table — status history (`draft`, `scheduled`, `sent`, `cancelled`) with `sent_at` and `recipients_count`. See [admin notifications](../admin-docs/notifications.md).

---

## Subscription notification settings (admin)

Key-value settings stored in `settings` table (not separate rule tables). Admin/WL configure expiry and addon reminders via `/notification-settings/*`.
