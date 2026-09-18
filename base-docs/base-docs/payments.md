# Payments APIs

*Note: Payments are essentially Ledger Transactions of type 'payment_in' or 'payment_out'. These endpoints act as specific wrappers/abstractions over the Ledger Transaction endpoints for payment management.*

## API Summary Table

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/payments` | GET | List payments (filter by type, ledger, date) | Yes |
| 2 | `/payments` | POST | Record a new payment (Payment In / Payment Out) | Yes |
| 3 | `/payments/{id}` | GET | Retrieve detailed information of a payment | Yes |
| 4 | `/payments/{id}` | PUT | Update an existing payment details | Yes |
| 5 | `/payments/{id}` | DELETE | Delete a payment record | Yes |

---

## Database Schema: `ledger_transactions` (Payments subset)
```text
id(UUID) - Primary Key
transaction_number(STRING) - Voucher or reference number (e.g. RCPT-001, PMT-001)
payment_ledger_id(UUID - Foreign Key) - Bank or Cash asset ledger
party_ledger_id(UUID - Foreign Key) - Customer or Supplier ledger
project_id(UUID - Foreign Key, nullable) - Optional linked project
site_id(UUID - Foreign Key, nullable) - Optional linked project site
amount(DECIMAL) - Total payment amount
type(ENUM - payment_in, payment_out) - Type of payment (inflow vs outflow)
remark(TEXT) - Internal memo or notes
proof_image(STRING - URL/nullable) - URL of receipt or proof image
transaction_date(DATE) - Execution date of the payment
timestamps
```
*Note: Records payments mapped between bank/cash asset accounts and party ledger accounts.*

---

## 1. List Payments
**Endpoint**: `GET /payments`

**Query Parameters**:
- `type=payment_in|payment_out` (optional)
- `party_ledger_id=uuid` (optional)
- `start_date=YYYY-MM-DD` (optional)
- `end_date=YYYY-MM-DD` (optional)

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "data": [
      {
        "id": "uuid",
        "transaction_number": "RCPT-001",
        "payment_ledger_id": "uuid",
        "party_ledger_id": "uuid",
        "project_id": "uuid",
        "site_id": null,
        "amount": 500.00,
        "type": "payment_in",
        "remark": "Received payment from customer",
        "proof_image": "https://example.com/receipt.jpg",
        "transaction_date": "2023-10-05"
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 15,
      "total": 1,
      "last_page": 1
    }
  }
}
```

---

## 2. Create Payment
**Endpoint**: `POST /payments`

**Request Body**:
```json
{
  "payment_ledger_id": "uuid",
  "party_ledger_id": "uuid",
  "project_id": "uuid",
  "site_id": "uuid",
  "amount": 500.00,
  "type": "payment_in",
  "remark": "Received payment from customer",
  "proof_image": "https://example.com/receipt.jpg",
  "transaction_date": "2023-10-05"
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "payment": {
      "id": "uuid",
      "transaction_number": "RCPT-001",
      "payment_ledger_id": "uuid",
      "party_ledger_id": "uuid",
      "amount": 500.00,
      "type": "payment_in",
      "remark": "Received payment from customer",
      "proof_image": "https://example.com/receipt.jpg",
      "transaction_date": "2023-10-05"
    }
  }
}
```

---

## 3. Get Payment Details
**Endpoint**: `GET /payments/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "payment": {
      "id": "uuid",
      "transaction_number": "RCPT-001",
      "payment_ledger_id": "uuid",
      "party_ledger_id": "uuid",
      "project_id": "uuid",
      "site_id": null,
      "amount": 500.00,
      "type": "payment_in",
      "remark": "Received payment from customer",
      "proof_image": "https://example.com/receipt.jpg",
      "transaction_date": "2023-10-05"
    }
  }
}
```

---

## 4. Update Payment
**Endpoint**: `PUT /payments/{id}`

**Request Body**:
```json
{
  "payment_ledger_id": "uuid",
  "party_ledger_id": "uuid",
  "project_id": "uuid",
  "site_id": "uuid",
  "amount": 600.00,
  "type": "payment_in",
  "remark": "Updated received payment amount",
  "proof_image": "https://example.com/receipt_revised.jpg",
  "transaction_date": "2023-10-06"
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "payment": {
      "id": "uuid",
      "transaction_number": "RCPT-001-REV",
      "payment_ledger_id": "uuid",
      "party_ledger_id": "uuid",
      "amount": 600.00,
      "type": "payment_in",
      "remark": "Updated received payment amount",
      "proof_image": "https://example.com/receipt_revised.jpg",
      "transaction_date": "2023-10-06"
    }
  }
}
```

---

## 5. Delete Payment
**Endpoint**: `DELETE /payments/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "OK",
  "body": {}
}
```
