# Parties APIs (Customers/Suppliers)

*Note: Parties are essentially Ledgers of type 'customer' or 'supplier'. These endpoints act as specific wrappers/abstractions over the Ledger endpoints for party management.*

## API Summary Table

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/parties` | GET | List parties (supports type filter and pagination) | Yes |
| 2 | `/parties` | POST | Add a new customer or supplier party | Yes |
| 3 | `/parties/{id}` | GET | Retrieve detailed information of a party | Yes |
| 4 | `/parties/{id}` | PUT | Update an existing party's details | Yes |
| 5 | `/parties/{id}` | DELETE | Delete a party | Yes |
| 6 | `/parties/{id}/transactions` | GET | List transaction history and invoices for a party | Yes |

---

## Database Schema: `ledgers` (Parties)
```text
id(UUID) - Primary Key
business_id(UUID - Foreign Key) - Associated business profile
name(STRING) - Party/ledger name
type(ENUM - customer, supplier, bank, cash, expense) - Parties use customer or supplier
opening_balance(DECIMAL) - Starting balance
opening_balance_type(ENUM - credit, debit) - Starting balance type
current_balance(DECIMAL) - Current running balance
gst_number(STRING - nullable) - Tax registration number
billing_address(JSON - nullable) - billing details (street, city, state, pincode)
shipping_address(JSON - nullable) - shipping details
contact_number(STRING - nullable) - Contact phone number
country_code(INTEGER - nullable) - Dialing code
timestamps
```
*Note: Stores different accounts/ledgers. Parties use type = 'customer' or 'supplier'.*

---

## 1. List Parties
**Endpoint**: `GET /parties`

**Query Parameters**:
- `type=customer|supplier` (optional - defaults to returning all parties if omitted)

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "data": [
      {
        "id": "uuid",
        "name": "Acme Corp",
        "type": "customer",
        "opening_balance": 0.00,
        "opening_balance_type": "credit",
        "current_balance": 1500.00,
        "gst_number": "GST12345",
        "billing_address": {
          "street": "789 Client Road",
          "city": "Mumbai",
          "state": "MH",
          "pincode": "400001"
        },
        "shipping_address": {
          "street": "123 Warehouse St",
          "city": "Mumbai",
          "state": "MH",
          "pincode": "400001"
        },
        "contact_number": "555-0102",
        "country_code": 91
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 15,
      "total": 5,
      "last_page": 1
    }
  }
}
```

---

## 2. Add New Party
**Endpoint**: `POST /parties`

**Request Body**:
```json
{
  "name": "Acme Corp",
  "type": "customer",
  "opening_balance": 0.00,
  "opening_balance_type": "credit",
  "gst_number": "GST12345",
  "billing_address": {
    "street": "789 Client Road",
    "city": "Mumbai",
    "state": "MH",
    "pincode": "400001"
  },
  "shipping_address": {
    "street": "123 Warehouse St",
    "city": "Mumbai",
    "state": "MH",
    "pincode": "400001"
  },
  "contact_number": "555-0102",
  "country_code": 91
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "party": {
      "id": "uuid",
      "name": "Acme Corp",
      "type": "customer",
      "opening_balance": 0.00,
      "opening_balance_type": "credit",
      "current_balance": 0.00,
      "gst_number": "GST12345",
      "billing_address": {
        "street": "789 Client Road",
        "city": "Mumbai",
        "state": "MH",
        "pincode": "400001"
      },
      "shipping_address": {
        "street": "123 Warehouse St",
        "city": "Mumbai",
        "state": "MH",
        "pincode": "400001"
      },
      "contact_number": "555-0102",
      "country_code": 91
    }
  }
}
```

---

## 3. Get Party Details
**Endpoint**: `GET /parties/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "party": {
      "id": "uuid",
      "name": "Acme Corp",
      "type": "customer",
      "opening_balance": 0.00,
      "opening_balance_type": "credit",
      "current_balance": 1500.00,
      "gst_number": "GST12345",
      "billing_address": {
        "street": "789 Client Road",
        "city": "Mumbai",
        "state": "MH",
        "pincode": "400001"
      },
      "shipping_address": {
        "street": "123 Warehouse St",
        "city": "Mumbai",
        "state": "MH",
        "pincode": "400001"
      },
      "contact_number": "555-0102",
      "country_code": 91
    }
  }
}
```

---

## 4. Update Party
**Endpoint**: `PUT /parties/{id}`

**Request Body**:
```json
{
  "name": "Acme Corp Updated",
  "type": "customer",
  "opening_balance": 100.00,
  "opening_balance_type": "credit",
  "gst_number": "GST54321",
  "billing_address": {
    "street": "111 Business Road",
    "city": "Pune",
    "state": "MH",
    "pincode": "411001"
  },
  "shipping_address": {
    "street": "111 Business Road",
    "city": "Pune",
    "state": "MH",
    "pincode": "411001"
  },
  "contact_number": "555-0999",
  "country_code": 91
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "party": {
      "id": "uuid",
      "name": "Acme Corp Updated",
      "type": "customer",
      "opening_balance": 100.00,
      "opening_balance_type": "credit",
      "current_balance": 1600.00,
      "gst_number": "GST54321",
      "billing_address": {
        "street": "111 Business Road",
        "city": "Pune",
        "state": "MH",
        "pincode": "411001"
      },
      "shipping_address": {
        "street": "111 Business Road",
        "city": "Pune",
        "state": "MH",
        "pincode": "411001"
      },
      "contact_number": "555-0999",
      "country_code": 91
    }
  }
}
```

---

## 5. Delete Party
**Endpoint**: `DELETE /parties/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "OK",
  "body": {}
}
```

---

## 6. Get Party Transactions
**Endpoint**: `GET /parties/{id}/transactions`

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
        "amount": 500.00,
        "type": "payment_in",
        "remark": "Payment received",
        "transaction_date": "2023-10-05"
      },
      {
        "id": "uuid",
        "invoice_number": "INV-001",
        "amount": 1200.50,
        "type": "sales_invoice",
        "status": "unpaid",
        "due_date": "2023-11-01"
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 15,
      "total": 2,
      "last_page": 1
    }
  }
}
```

