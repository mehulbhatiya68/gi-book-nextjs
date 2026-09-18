# Sales Invoice APIs

This document defines the sales invoice database schemas and API endpoints.

## API Summary Table

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/invoices` | POST | List invoices (supports filters/pagination) | Yes |
| 2 | `/invoices/store` | POST | Create a new sales invoice | Yes |
| 3 | `/invoices/{id}` | GET | Retrieve detailed information of an invoice | Yes |
| 4 | `/invoices/{id}` | PUT | Update an existing invoice (items, dates, charges) | Yes |
| 5 | `/invoices/{id}` | DELETE | Delete an invoice | Yes |
| 6 | `/invoices/{id}/status` | PATCH | Update payment status of an invoice | Yes |
| 7 | `/invoices/{id}/receive-payment` | POST | Create or update a payment received against an invoice | Yes |
| 8 | `/invoices/{id}/payments/{paymentId}` | DELETE | Delete a payment received against an invoice | Yes |
| 9 | `/invoices/{id}/pdf` | GET | Generate invoice PDF and return `pdf_url` + `view_url` | Yes |
| 10 | `/invoices/{id}/view` | GET | HTML invoice bill for Flutter WebView | Yes |
| 11 | `/invoices/{id}/pdf/file` | GET | Download the invoice PDF file | Yes |

---

## Database Schema: `sales_invoices`
```text
id(UUID) - Primary Key
business_id(UUID - Foreign Key) - Associated business profile
ledger_id(UUID - Foreign Key) - Associated customer ledger
invoice_number(STRING) - Unique invoice number code
amount(DECIMAL) - Net invoice total amount
discount_percentage(DECIMAL - nullable) - Percentage discount
discount_amount(DECIMAL - nullable) - Calculated absolute discount amount
additional_charges(DECIMAL - nullable) - Shipping, delivery or extra charges
round_off_amount(DECIMAL - nullable) - Cash round-off adjustment
note(TEXT - nullable) - Invoice notes or terms
status(ENUM - paid, unpaid, partially_paid) - Invoice payment status
due_date(DATE) - Invoice payment due date
timestamps
```
*Note: `paid_amount` and `balance_due` in API responses are calculated dynamically from linked `ledger_transactions` (type `payment_in`).*

## Database Schema: `sales_invoice_items`
```text
id(UUID) - Primary Key
sales_invoice_id(UUID - Foreign Key) - Associated sales invoice
item_id(UUID - Foreign Key) - Reference to stock item/service
quantity(DECIMAL) - Quantity sold
rate(DECIMAL) - Price per unit
amount(DECIMAL) - Total line item amount (quantity * rate)
timestamps
```
*Note: Maps the sold items/services and their quantities to a sales invoice.*

---

## 1. List Invoices
**Endpoint**: `POST /invoices`

**Request Body**:
```json
{
  "page": 1,   /// optional, numeric, min:1
  "per_page": "10",   /// optional, string, allowed: 5, 10, 30, 50, 100, all
  "sort_by": "created_at",   /// optional, string, allowed: id, invoice_number, amount, status, due_date, created_at, updated_at
  "sort_dir": "desc",   /// optional, string, allowed: asc, desc
  "search": "",   /// optional, string
  "status": "unpaid",   /// optional, string, allowed: paid, unpaid, partially_paid
  "ledger_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",   /// optional, uuid
  "start_date": "2023-10-01",   /// optional, date, format: Y-m-d
  "end_date": "2023-11-01"   /// optional, date, format: Y-m-d, after_or_equal: start_date
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "invoices": [
      {
        "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "ledger_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "ledger": {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "name": "ABC Traders",
          "type": "customer"
        },
        "invoice_number": "INV-001",
        "amount": 1200.50,
        "paid_amount": 0.00,
        "balance_due": 1200.50,
        "discount_percentage": 10.00,
        "discount_amount": 120.05,
        "additional_charges": 50.00,
        "round_off_amount": -0.50,
        "note": "Thank you for your business",
        "status": "unpaid",
        "due_date": "2023-11-01",
        "created_at": "2023-10-15T10:30:00.000000Z",
        "updated_at": "2023-10-15T10:30:00.000000Z"
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 10,
      "total": 1,
      "last_page": 1
    },
    "allowed_sorts": ["id", "invoice_number", "amount", "status", "due_date", "created_at", "updated_at"],
    "filter": {
      "status": ["paid", "unpaid", "partially_paid"]
    }
  }
}
```

---

## 2. Create Invoice
**Endpoint**: `POST /invoices/store`

**Request Body**:
```json
{
  "ledger_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",   /// required, uuid, must exist in ledgers scoped to selected business
  "invoice_number": "INV-001",   /// required, string, max:255
  "amount": 1200.50,   /// required, numeric, min:0
  "discount_percentage": 10.00,   /// optional, numeric, min:0, max:100, nullable
  "discount_amount": 120.05,   /// optional, numeric, min:0, nullable
  "additional_charges": 50.00,   /// optional, numeric, min:0, nullable
  "round_off_amount": -0.45,   /// optional, numeric, nullable
  "note": "Thank you for your business",   /// optional, string, max:1000, nullable
  "status": "unpaid",   /// required, string, allowed: paid, unpaid, partially_paid
  "due_date": "2023-11-01",   /// required, date, format: Y-m-d
  "items": [   /// required, array, min:1
    {
      "item_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",   /// required, uuid, must exist in items scoped to selected business
      "quantity": 2,   /// required, numeric, min:0.01
      "rate": 600.25,   /// required, numeric, min:0
      "amount": 1200.50   /// required, numeric, min:0
    }
  ]
}
```

**Response Body**:
```json
{
  "message": "Invoice created successfully.",
  "body": {
    "invoice": {
      "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
      "ledger_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "invoice_number": "INV-001",
      "amount": 1200.50,
      "discount_percentage": 10.00,
      "discount_amount": 120.05,
      "additional_charges": 50.00,
      "round_off_amount": -0.45,
      "note": "Thank you for your business",
      "status": "unpaid",
      "due_date": "2023-11-01",
      "created_at": "2023-10-15T10:30:00.000000Z",
      "updated_at": "2023-10-15T10:30:00.000000Z"
    }
  }
}
```

---

## 3. Get Invoice Details
**Endpoint**: `GET /invoices/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "invoice": {
      "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
      "ledger_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "invoice_number": "INV-001",
      "amount": 1200.50,
      "discount_percentage": 10.00,
      "discount_amount": 120.05,
      "additional_charges": 50.00,
      "round_off_amount": -0.45,
      "note": "Thank you for your business",
      "status": "unpaid",
      "due_date": "2023-11-01",
      "created_at": "2023-10-15T10:30:00.000000Z",
      "updated_at": "2023-10-15T10:30:00.000000Z",
      "items": [
        {
          "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
          "item_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          "item_name": "Service A",
          "quantity": 2.00,
          "rate": 600.25,
          "amount": 1200.50
        }
      ]
    }
  }
}
```

---

## 4. Update Invoice
**Endpoint**: `PUT /invoices/{id}`

**Request Body**:
```json
{
  "ledger_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",   /// optional, uuid, must exist in ledgers scoped to selected business
  "invoice_number": "INV-001-REV",   /// optional, string, max:255
  "amount": 1400.00,   /// optional, numeric, min:0
  "discount_percentage": 5.00,   /// optional, numeric, min:0, max:100, nullable
  "discount_amount": 70.00,   /// optional, numeric, min:0, nullable
  "additional_charges": 100.00,   /// optional, numeric, min:0, nullable
  "round_off_amount": 0.00,   /// optional, numeric, nullable
  "note": "Updated invoice items and billing info.",   /// optional, string, max:1000, nullable
  "status": "partially_paid",   /// optional, string, allowed: paid, unpaid, partially_paid
  "due_date": "2023-11-15",   /// optional, date, format: Y-m-d
  "items": [   /// optional, array, min:1 (replaces all existing items when provided)
    {
      "item_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",   /// required, uuid, must exist in items scoped to selected business
      "quantity": 2,   /// required, numeric, min:0.01
      "rate": 700.00,   /// required, numeric, min:0
      "amount": 1400.00   /// required, numeric, min:0
    }
  ]
}
```

**Response Body**:
```json
{
  "message": "Invoice updated successfully.",
  "body": {
    "invoice": {
      "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
      "ledger_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "invoice_number": "INV-001-REV",
      "amount": 1400.00,
      "discount_percentage": 5.00,
      "discount_amount": 70.00,
      "additional_charges": 100.00,
      "round_off_amount": 0.00,
      "note": "Updated invoice items and billing info.",
      "status": "partially_paid",
      "due_date": "2023-11-15",
      "created_at": "2023-10-15T10:30:00.000000Z",
      "updated_at": "2023-10-20T14:00:00.000000Z"
    }
  }
}
```

---

## 5. Delete Invoice
**Endpoint**: `DELETE /invoices/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "Invoice deleted successfully."
}
```

---

## 6. Update Invoice Status
**Endpoint**: `PATCH /invoices/{id}/status`

**Request Body**:
```json
{
  "status": "paid"   /// required, string, allowed: paid, unpaid, partially_paid
}
```

**Response Body**:
```json
{
  "message": "Invoice status updated successfully.",
  "body": {
    "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
    "status": "paid"
  }
}
```

---

## 7. Receive / Update Invoice Payment
**Endpoint**: `POST /invoices/{id}/receive-payment`

Creates or updates a `payment_in` ledger transaction for the invoice.

- **Create**: omit `payment_id` — records a new payment, updates ledger balances, and recalculates invoice totals.
- **Update**: include `payment_id` — reverses the old ledger effect, applies the new values, and recalculates invoice totals.

**Request Body**:
```json
{
  "payment_id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",   /// optional, uuid — include to update an existing payment for this invoice
  "payment_ledger_id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",   /// required, uuid, bank or cash ledger in selected business
  "amount": 500.00,   /// required, numeric, min:0.01 — create: cannot exceed balance_due; update: cannot exceed balance_due + current payment amount
  "transaction_date": "2026-08-09",   /// required, date, format: Y-m-d
  "transaction_number": "RCPT-001",   /// optional, string, max:255, unique (ignored for current payment on update)
  "remark": "Partial payment for INV-001",   /// optional, string, max:1000, nullable
  "proof_image": null   /// optional, string, max:2048, nullable
}
```

**Status calculation** (from sum of `ledger_transactions` where `sales_invoice_id` matches):
- total paid `= 0` → `unpaid`
- `0 < total paid < amount` → `partially_paid`
- `total paid >= amount` → `paid`

**Response Body**:
```json
{
  "message": "Payment received successfully.",
  "body": {
    "invoice": {
      "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
      "ledger_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "ledger": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "ABC Traders",
        "type": "customer"
      },
      "invoice_number": "INV-001",
      "amount": 1200.50,
      "paid_amount": 500.00,
      "balance_due": 700.50,
      "status": "partially_paid",
      "due_date": "2023-11-01",
      "created_at": "2023-10-15T10:30:00.000000Z",
      "updated_at": "2023-10-20T14:00:00.000000Z"
    },
    "payment": {
      "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "transaction_number": "RCPT-001",
      "payment_ledger_id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "party_ledger_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "sales_invoice_id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
      "amount": 500.00,
      "type": "payment_in",
      "remark": "Partial payment for INV-001",
      "transaction_date": "2026-08-09"
    }
  }
}
```

---

## 8. Delete Invoice Payment
**Endpoint**: `DELETE /invoices/{id}/payments/{paymentId}`

Deletes a `payment_in` ledger transaction linked to the invoice, reverses ledger balances, and recalculates invoice `balance_due` and `status`.

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "Payment deleted successfully.",
  "body": {
    "invoice": { "...": "same shape as receive-payment response" }
  }
}
```

---

## 9. Download Invoice PDF
**Endpoint**: `GET /invoices/{id}/pdf`

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "pdf_url": "https://example.com/storage/invoices/INV-001.pdf",
    "view_url": "https://example.com/api/invoices/{id}/view"
  }
}
```

Flutter WebView: open `GET /invoices/{id}/view` with `Authorization: Bearer {token}`. PDF button on that page hits `/invoices/{id}/pdf/file`.

---

## 10. Invoice HTML Bill (WebView)

**Endpoint**: `GET /invoices/{id}/view`

Auth: `Authorization: Bearer {token}` (same as other APIs).

Returns HTML (invoice bill layout).

---

## 11. Invoice PDF File

**Endpoint**: `GET /invoices/{id}/pdf/file`

Streams the generated PDF download.
