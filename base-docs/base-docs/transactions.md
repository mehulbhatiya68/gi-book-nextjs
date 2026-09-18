# Ledger Transactions APIs

List and create ledger transactions scoped to the selected business.

**Middleware:** `auth:sanctum`, `user.only`, `business.selected`, `subscription.active`

Creating a transaction also consumes the `transaction` feature quota.

---

## Database Schema: `ledger_transactions`

```text
id(UUID) - Primary Key
transaction_number(STRING) - Unique voucher number (auto-generated if omitted)
payment_ledger_id(UUID) - From / cash-bank side
party_ledger_id(UUID) - To / party side
project_id(UUID - nullable) - Optional linked project
site_id(UUID - nullable) - Optional linked site
sales_invoice_id(UUID - nullable) - Optional sales invoice (payment_in only)
amount(DECIMAL) - Transaction amount
type(ENUM - payment_in, payment_out, contra, journal)
remark(TEXT - nullable)
proof_image(STRING - nullable)
transaction_date(DATE)
timestamps
```

---

## Balance calculations

Each create updates **both** ledger `current_balance` values:

| Type | `payment_ledger_id` | `party_ledger_id` | Effect |
|------|---------------------|-------------------|--------|
| `payment_in` | bank or cash (increases) | customer / supplier / expense (decreases) | Money received into cash/bank |
| `payment_out` | bank or cash (decreases) | customer / supplier / expense (increases) | Money paid from cash/bank |
| `contra` | source bank or cash (decreases) | destination bank or cash (increases) | Transfer between cash/bank accounts |
| `journal` | from ledger (decreases) | to ledger (increases) | Adjustment between any two ledgers |

If `sales_invoice_id` is sent on `payment_in`, the amount is capped at the invoice balance due, the party ledger must be the invoice customer, and invoice `status` is recalculated (`unpaid` / `partially_paid` / `paid`).

---

## API Summary Table

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/transactions` | POST | List transactions (filter by ledger, project, site) | Yes |
| 2 | `/transactions/store` | POST | Create a transaction of any type and apply ledger balances | Yes |
| 3 | `/transactions/{id}` | PUT | Update a transaction and recalculate ledger balances | Yes |
| 4 | `/transactions/{id}` | DELETE | Delete a transaction and reverse ledger balances | Yes |

---

## 1. List Transactions

**Endpoint**: `POST /transactions`

**Request Body**:
```json
{
  "type": "ledger",                 /// required, string, allowed: ledger, project, site
  "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",   /// required, uuid, must exist for given type in own business
  "page": 1,                        /// optional, numeric, min:1
  "per_page": "10",                 /// optional, string, allowed: 5, 10, 30, 50, 100, all
  "sort_by": "transaction_date",    /// optional, string, allowed: id, transaction_number, amount, type, transaction_date, created_at, updated_at
  "sort_dir": "desc",               /// optional, string, allowed: asc, desc
  "search": "payment",              /// optional, string
  "transaction_type": "payment_in"  /// optional, string, allowed: payment_in, payment_out, contra, journal
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "transactions": [
      {
        "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
        "transaction_number": "RCPT-001",
        "payment_ledger_id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "party_ledger_id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
        "project_id": null,
        "site_id": null,
        "sales_invoice_id": null,
        "amount": 5000.00,
        "type": "payment_in",
        "remark": "Cash received",
        "proof_image": null,
        "transaction_date": "2026-07-20",
        "payment_ledger": {
          "id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
          "name": "Cash Account",
          "type": "cash",
          "current_balance": 15000.00
        },
        "party_ledger": {
          "id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
          "name": "Rajesh Traders",
          "type": "customer",
          "current_balance": 0.00
        },
        "project": null,
        "site": null,
        "sales_invoice": null,
        "created_at": "2026-07-20T10:30:00.000000Z",
        "updated_at": "2026-07-20T10:30:00.000000Z"
      }
    ],
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

## 2. Create Transaction

**Endpoint**: `POST /transactions/store`

**Request Body** (`payment_in` / `payment_out`):
```json
{
  "type": "payment_in",             /// required, string, allowed: payment_in, payment_out, contra, journal
  "payment_ledger_id": "uuid",      /// required, uuid, bank/cash ledger in selected business (also the from-ledger for journal)
  "party_ledger_id": "uuid",        /// required, uuid, other ledger in selected business, must differ from payment_ledger_id
  "amount": 5000.00,                /// required, numeric, min:0.01
  "transaction_date": "2026-08-16", /// required, date, format: Y-m-d
  "transaction_number": "RCPT-001", /// optional, string, max:255, unique; auto-generated if omitted
  "remark": "Cash received",        /// optional, string, max:1000
  "proof_image": null,              /// optional, string, max:2048
  "project_id": null,               /// optional, uuid, must belong to selected business
  "site_id": null,                  /// optional, uuid, must belong to a project in the selected business
  "sales_invoice_id": null          /// optional, uuid, payment_in only; invoice in selected business, amount cannot exceed balance due
}
```

**Contra** uses two bank/cash ledgers — `payment_ledger_id` is the source (money leaves), `party_ledger_id` is the destination (money enters).

**Journal** may use any two ledgers — `payment_ledger_id` is the from-account (decreases), `party_ledger_id` is the to-account (increases).

If `site_id` is sent without `project_id`, `project_id` is taken from the site.

Auto voucher prefixes: `RCPT` (`payment_in`), `PMT` (`payment_out`), `CNTR` (`contra`), `JRNL` (`journal`).

**Response Body**:
```json
{
  "message": "Transaction created successfully.",
  "body": {
    "transaction": {
      "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "transaction_number": "RCPT-001",
      "payment_ledger_id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "party_ledger_id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
      "project_id": null,
      "site_id": null,
      "sales_invoice_id": null,
      "amount": 5000.00,
      "type": "payment_in",
      "remark": "Cash received",
      "proof_image": null,
      "transaction_date": "2026-08-16",
      "payment_ledger": {
        "id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "name": "Cash Account",
        "type": "cash",
        "current_balance": 15000.00
      },
      "party_ledger": {
        "id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
        "name": "Rajesh Traders",
        "type": "customer",
        "current_balance": 0.00
      },
      "created_at": "2026-08-16T10:30:00.000000Z",
      "updated_at": "2026-08-16T10:30:00.000000Z"
    },
    "ledger_effects": {
      "payment_ledger": {
        "id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "delta": 5000.00,
        "current_balance": 15000.00
      },
      "party_ledger": {
        "id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
        "delta": -5000.00,
        "current_balance": 0.00
      }
    }
  }
}
```

---

## 3. Update Transaction

**Endpoint**: `PUT /transactions/{id}`

Same body as create (all fields required). Reverses the previous ledger effects, applies the new ones, and recalculates balances. When linked to a sales invoice, amount is capped at balance due plus the transaction's current amount on that invoice.

**Response Body**:
```json
{
  "message": "Transaction updated successfully.",
  "body": {
    "transaction": { "...same shape as create..." },
    "ledger_effects": { "...same shape as create..." }
  }
}
```

---

## 4. Delete Transaction

**Endpoint**: `DELETE /transactions/{id}`

Reverses ledger balance effects. If the transaction was linked to a sales invoice, invoice status is recalculated.

**Response Body**:
```json
{
  "message": "Transaction deleted successfully."
}
```
