# Reports APIs

Business-scoped report endpoints for the Reports screen.

**Middleware:** `auth:sanctum`, `user.only`, `business.selected`, `subscription.active`

Date filters use invoice `created_at` for sales, `transaction_date` for payments, and `adjustment_date` for stock movements. When `start_date` / `end_date` are omitted, the report covers all available data for the selected business.

Flutter opens the HTML URL in a WebView. Auth is the same as every other API: `Authorization: Bearer {token}` (your proxy can attach this header). Query string is only filters — never the token.

Example:

```
GET /api/reports/sales-overview/view?start_date=2026-08-01&end_date=2026-08-31
Authorization: Bearer {token}
```

JSON POST endpoints still return data plus `view_url`, `pdf_url`, and `excel_url`.

---

## API Summary Table

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/reports/sales-overview` | POST | Total sales, growth trends, and top-performing products | Yes |
| 2 | `/reports/purchase-expense` | POST | Purchases (supplier payments) and expenses over a period | Yes |
| 3 | `/reports/invoice-summary` | POST | Paid, unpaid, partially paid, and overdue invoice totals | Yes |
| 4 | `/reports/payment-activity` | POST | Incoming and outgoing payments with date-wise insights | Yes |
| 5 | `/reports/ledger-statement` | POST | Account-wise transaction summary and running balances | Yes |
| 6 | `/reports/profit-loss` | POST | Net profit by comparing income against expenses | Yes |
| 7 | `/reports/inventory-status` | POST | Stock levels, fast-moving items, and low-stock alerts | Yes |
| 8 | `/reports/stock-movement` | POST | Inventory in/out movement over a selected period | Yes |
| 9 | `/reports/customer-insights` | POST | Top customers, outstanding dues, and payment history | Yes |
| 10 | `/reports/{type}/view` | GET | HTML report document for Flutter WebView | Yes |
| 11 | `/reports/{type}/pdf` | GET | Download the report as PDF | Yes |
| 12 | `/reports/{type}/excel` | GET | Download the report as CSV/Excel | Yes |

---

## 1. Sales Overview

**Endpoint**: `POST /reports/sales-overview`

**Request Body**:
```json
{
  "start_date": "2026-08-01",   /// optional, date, format: Y-m-d
  "end_date": "2026-08-31",     /// optional, date, format: Y-m-d, after_or_equal: start_date
  "top_limit": 10               /// optional, integer, min:1, max:50, default: 10
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "period": {
      "start_date": "2026-08-01",
      "end_date": "2026-08-31"
    },
    "summary": {
      "total_sales": 25000.00,
      "invoice_count": 42,
      "average_invoice": 595.24,
      "previous_period_sales": 22000.00,
      "growth_percentage": 13.64
    },
    "sales_by_day": [
      {
        "date": "2026-08-01",
        "amount": 1200.00,
        "invoice_count": 3
      }
    ],
    "top_products": [
      {
        "item_id": "uuid",
        "item_name": "Cement Bag",
        "quantity_sold": 100.00,
        "revenue": 5000.00
      }
    ]
  }
}
```

---

## 2. Purchase / Expense Report

Tracks money going out via `payment_out` transactions to supplier and expense ledgers (there is no separate purchase-invoice module yet).

**Endpoint**: `POST /reports/purchase-expense`

**Request Body**:
```json
{
  "start_date": "2026-08-01",   /// optional, date, format: Y-m-d
  "end_date": "2026-08-31",     /// optional, date, format: Y-m-d, after_or_equal: start_date
  "type": "all"                 /// optional, string, allowed: all, purchase, expense, default: all
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "period": {
      "start_date": "2026-08-01",
      "end_date": "2026-08-31"
    },
    "summary": {
      "total_purchases": 8000.00,
      "total_expenses": 3000.00,
      "total": 11000.00
    },
    "by_party": [
      {
        "ledger_id": "uuid",
        "name": "Supplier ABC",
        "type": "supplier",
        "amount": 5000.00
      }
    ],
    "by_day": [
      {
        "date": "2026-08-05",
        "purchases": 2000.00,
        "expenses": 500.00,
        "total": 2500.00
      }
    ]
  }
}
```

---

## 3. Invoice Summary

**Endpoint**: `POST /reports/invoice-summary`

**Request Body**:
```json
{
  "start_date": "2026-08-01",   /// optional, date, format: Y-m-d
  "end_date": "2026-08-31",     /// optional, date, format: Y-m-d, after_or_equal: start_date
  "page": 1,                    /// optional, numeric, min:1
  "per_page": "10"              /// optional, string, allowed: 5, 10, 30, 50, 100, all
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "period": {
      "start_date": "2026-08-01",
      "end_date": "2026-08-31"
    },
    "summary": {
      "total_invoices": 40,
      "total_amount": 50000.00,
      "paid": { "count": 20, "amount": 25000.00 },
      "unpaid": { "count": 10, "amount": 12000.00 },
      "partially_paid": { "count": 5, "amount": 8000.00 },
      "overdue": { "count": 5, "amount": 5000.00, "balance_due": 4500.00 }
    },
    "overdue_invoices": [
      {
        "id": "uuid",
        "invoice_number": "INV-001",
        "ledger_name": "Acme Corp",
        "amount": 1200.00,
        "paid_amount": 200.00,
        "balance_due": 1000.00,
        "status": "partially_paid",
        "due_date": "2026-07-15"
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 10,
      "total": 5,
      "last_page": 1
    }
  }
}
```

---

## 4. Payment Activity

**Endpoint**: `POST /reports/payment-activity`

**Request Body**:
```json
{
  "start_date": "2026-08-01",   /// optional, date, format: Y-m-d
  "end_date": "2026-08-31",     /// optional, date, format: Y-m-d, after_or_equal: start_date
  "type": "all",                /// optional, string, allowed: all, payment_in, payment_out, default: all
  "page": 1,                    /// optional, numeric, min:1
  "per_page": "10",             /// optional, string, allowed: 5, 10, 30, 50, 100, all
  "sort_by": "transaction_date",/// optional, string, allowed: transaction_date, amount, created_at
  "sort_dir": "desc"            /// optional, string, allowed: asc, desc
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "period": {
      "start_date": "2026-08-01",
      "end_date": "2026-08-31"
    },
    "summary": {
      "total_in": 15000.00,
      "total_out": 7000.00,
      "net": 8000.00
    },
    "by_day": [
      {
        "date": "2026-08-05",
        "in": 2000.00,
        "out": 500.00,
        "net": 1500.00
      }
    ],
    "payments": [
      {
        "id": "uuid",
        "transaction_number": "RCPT-001",
        "type": "payment_in",
        "amount": 500.00,
        "transaction_date": "2026-08-05",
        "payment_ledger_name": "Cash",
        "party_ledger_name": "Acme Corp",
        "remark": "Invoice payment"
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 10,
      "total": 25,
      "last_page": 3
    }
  }
}
```

---

## 5. Ledger Statement

**Endpoint**: `POST /reports/ledger-statement`

**Request Body**:
```json
{
  "ledger_id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",   /// required, uuid, must exist in own business
  "start_date": "2026-08-01",   /// optional, date, format: Y-m-d
  "end_date": "2026-08-31",     /// optional, date, format: Y-m-d, after_or_equal: start_date
  "page": 1,                    /// optional, numeric, min:1
  "per_page": "10"              /// optional, string, allowed: 5, 10, 30, 50, 100, all
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "ledger": {
      "id": "uuid",
      "name": "Acme Corp",
      "type": "customer",
      "opening_balance": 1000.00,
      "current_balance": 2500.00
    },
    "period": {
      "start_date": "2026-08-01",
      "end_date": "2026-08-31"
    },
    "opening_balance": 1200.00,
    "closing_balance": 1800.00,
    "total_debit": 800.00,
    "total_credit": 200.00,
    "entries": [
      {
        "id": "uuid",
        "transaction_number": "RCPT-001",
        "transaction_date": "2026-08-05",
        "type": "payment_in",
        "remark": "Payment received",
        "debit": 0.00,
        "credit": 500.00,
        "balance": 700.00,
        "contra_ledger_name": "Cash"
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 10,
      "total": 12,
      "last_page": 2
    }
  }
}
```

---

## 6. Profit & Loss

**Endpoint**: `POST /reports/profit-loss`

**Request Body**:
```json
{
  "start_date": "2026-08-01",   /// optional, date, format: Y-m-d
  "end_date": "2026-08-31"      /// optional, date, format: Y-m-d, after_or_equal: start_date
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "period": {
      "start_date": "2026-08-01",
      "end_date": "2026-08-31"
    },
    "profit_loss": {
      "revenue": 25000.00,
      "cost_of_goods_sold": 8000.00,
      "gross_profit": 17000.00,
      "expenses": 3000.00,
      "net_profit": 14000.00
    }
  }
}
```

*Notes:*
- `revenue` = sum of sales invoice amounts in the period
- `cost_of_goods_sold` = sum of sold item quantity × item purchase price
- `expenses` = sum of `payment_out` to expense ledgers

---

## 7. Inventory Status

**Endpoint**: `POST /reports/inventory-status`

**Request Body**:
```json
{
  "low_stock_threshold": 10,    /// optional, numeric, min:0, default: 10
  "page": 1,                    /// optional, numeric, min:1
  "per_page": "10",             /// optional, string, allowed: 5, 10, 30, 50, 100, all
  "search": "",                 /// optional, string
  "sort_by": "current_stock",   /// optional, string, allowed: item_name, current_stock, sales_price, created_at
  "sort_dir": "asc"             /// optional, string, allowed: asc, desc
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "summary": {
      "total_products": 50,
      "out_of_stock": 3,
      "low_stock": 8,
      "in_stock": 39,
      "stock_value": 125000.00
    },
    "fast_moving": [
      {
        "item_id": "uuid",
        "item_name": "Cement Bag",
        "quantity_sold": 200.00,
        "current_stock": 15.00
      }
    ],
    "items": [
      {
        "id": "uuid",
        "item_name": "Cement Bag",
        "item_code": "CEM-01",
        "unit": "BAG",
        "current_stock": 5.00,
        "sales_price": 350.00,
        "purchase_price": 300.00,
        "stock_value": 1500.00,
        "stock_status": "low_stock"
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 10,
      "total": 50,
      "last_page": 5
    }
  }
}
```

`stock_status` values: `out_of_stock`, `low_stock`, `in_stock`.

---

## 8. Stock Movement

**Endpoint**: `POST /reports/stock-movement`

**Request Body**:
```json
{
  "start_date": "2026-08-01",   /// optional, date, format: Y-m-d
  "end_date": "2026-08-31",     /// optional, date, format: Y-m-d, after_or_equal: start_date
  "item_id": "uuid",            /// optional, uuid, must exist in own business
  "page": 1,                    /// optional, numeric, min:1
  "per_page": "10"              /// optional, string, allowed: 5, 10, 30, 50, 100, all
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "period": {
      "start_date": "2026-08-01",
      "end_date": "2026-08-31"
    },
    "summary": {
      "total_in": 100.00,
      "total_out": 75.00,
      "net": 25.00
    },
    "movements": [
      {
        "date": "2026-08-05",
        "item_id": "uuid",
        "item_name": "Cement Bag",
        "movement_type": "add",
        "quantity": 20.00,
        "direction": "in",
        "reference": "Stock adjustment",
        "reason": "New stock received"
      },
      {
        "date": "2026-08-06",
        "item_id": "uuid",
        "item_name": "Cement Bag",
        "movement_type": "sale",
        "quantity": 5.00,
        "direction": "out",
        "reference": "INV-001",
        "reason": null
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 10,
      "total": 40,
      "last_page": 4
    }
  }
}
```

`movement_type` values: `add`, `reduce`, `sale`.  
`direction` values: `in`, `out`.

---

## 9. Customer Insights

**Endpoint**: `POST /reports/customer-insights`

**Request Body**:
```json
{
  "start_date": "2026-08-01",   /// optional, date, format: Y-m-d
  "end_date": "2026-08-31",     /// optional, date, format: Y-m-d, after_or_equal: start_date
  "top_limit": 10,              /// optional, integer, min:1, max:50, default: 10
  "page": 1,                    /// optional, numeric, min:1
  "per_page": "10"              /// optional, string, allowed: 5, 10, 30, 50, 100, all
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "period": {
      "start_date": "2026-08-01",
      "end_date": "2026-08-31"
    },
    "summary": {
      "total_customers": 30,
      "customers_with_dues": 12,
      "total_receivables": 18500.00,
      "total_collected": 12000.00
    },
    "top_customers": [
      {
        "ledger_id": "uuid",
        "name": "Acme Corp",
        "total_sales": 8000.00,
        "invoice_count": 5,
        "outstanding": 1500.00
      }
    ],
    "customers": [
      {
        "ledger_id": "uuid",
        "name": "Acme Corp",
        "contact_number": "555-0102",
        "current_balance": 1500.00,
        "total_sales": 8000.00,
        "total_paid": 6500.00,
        "outstanding": 1500.00,
        "last_payment_date": "2026-08-10"
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 10,
      "total": 30,
      "last_page": 3
    }
  }
}
```

---

## HTML WebView (Flutter)

`{type}` is one of: `sales-overview`, `purchase-expense`, `invoice-summary`, `payment-activity`, `ledger-statement`, `profit-loss`, `inventory-status`, `stock-movement`, `customer-insights`.

| Action | URL |
|---|---|
| Open in WebView | `GET /reports/{type}/view?start_date=&end_date=` |
| PDF | `GET /reports/{type}/pdf?start_date=&end_date=` |
| Excel | `GET /reports/{type}/excel?start_date=&end_date=` |

Auth: `Authorization: Bearer {token}` (same as other APIs).  
`ledger-statement` also requires `ledger_id`. Invoice bill: `GET /invoices/{id}/view`.

GST, Balance Sheet, Cash & Bank, and purchase-invoice registers from the reference app are not included — this project has no GST/TDS/purchase-invoice tables. Those screens were used only as layout reference.
