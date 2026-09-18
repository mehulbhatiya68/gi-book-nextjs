# Ledgers APIs

This document defines the ledgers database schema and API endpoints.

## API Summary Table

**Middleware:** `auth:sanctum`, `user.only`, `business.selected`, `subscription.active`

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/ledgers` | POST | List ledgers (supports type filter, search, and pagination) | Yes |
| 2 | `/ledgers/store` | POST | Create a new ledger account | Yes |
| 3 | `/ledgers/{id}` | GET | Retrieve detailed information of a ledger | Yes |
| 4 | `/ledgers/{id}` | PUT | Update an existing ledger | Yes |
| 5 | `/ledgers/{id}` | DELETE | Delete a ledger | Yes |

---

## Database Schema: `ledgers`
```text
id(UUID) - Primary Key
business_id(UUID - Foreign Key) - Associated business profile
name(STRING) - Ledger account name
type(ENUM - customer, supplier, bank, cash, expense) - Category of ledger
opening_balance(DECIMAL) - Starting balance of ledger
opening_balance_type(ENUM - credit, debit) - Starting balance direction
current_balance(DECIMAL) - Running balance of ledger
gst_number(STRING - nullable) - GST number for customers/suppliers
billing_address(JSON - nullable) - Billing address block (street, city, state, pin)
shipping_address(JSON - nullable) - Shipping address block
contact_number(STRING - nullable) - Phone number for the party
country_code(INTEGER - nullable) - Country phone dialing code
timestamps
```
*Note: Stores different accounts/ledgers. Includes party details for customers/suppliers.*

---

## 1. List Ledgers
**Endpoint**: `POST /ledgers`

**Query Parameters**:
```json
{
    "page": 1,            /// optional, numeric, min:1
    "per_page": "10",     /// optional, string, allowed: 5, 10, 30, 50, 100, all
    "sort_by": "name",    /// optional, string, allowed: id, name, type, current_balance, created_at, updated_at
    "sort_dir": "asc",    /// optional, string, allowed: asc, desc
    "search": "",         /// optional, string
    "type": "customer"    /// optional, string, allowed: customer, supplier, bank, cash, expense
}
```

**Response Body**:
```json
{
    "message": "OK",
    "body": {
        "ledgers": [
            {
                "id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
                "name": "Cash Account",
                "type": "cash",
                "opening_balance": 1000.00,
                "opening_balance_type": "debit",
                "current_balance": 1500.00,
                "gst_number": null,
                "billing_address": null,
                "shipping_address": null,
                "contact_number": null,
                "country_code": null,
                "created_at": "2025-10-01T12:00:00.000000Z",
                "updated_at": "2025-10-05T08:30:00.000000Z"
            }
        ],
        "meta": {
            "current_page": 1,
            "per_page": 10,
            "total": 1,
            "last_page": 1
        },
        "allowed_sorts": ["id", "name", "type", "current_balance", "created_at", "updated_at"],
        "filter": {
            "type": ["customer", "supplier", "bank", "cash", "expense"]
        }
    }
}
```
*Note: `allowed_sorts` and `filter` are only included when `current_page == 1`.*

---

## 2. Create Ledger
**Endpoint**: `POST /ledgers/store`

**Request Body**:
```json
{
    "name": "Rajesh Traders",                         /// required, string, max:255
    "type": "customer",                               /// required, string, allowed: customer, supplier, bank, cash, expense
    "opening_balance": 5000.00,                       /// required, numeric, min:0
    "opening_balance_type": "debit",                  /// required, string, allowed: credit, debit
    "gst_number": "27AADCB2230M1ZP",                 /// optional, string, max:50
    "billing_address": {                              /// optional, array
        "street": "12, MG Road",                      /// optional, string, max:500
        "city": "Ahmedabad",                          /// optional, string, max:255
        "state": "Gujarat",                           /// optional, string, max:255
        "pin": "380001"                               /// optional, string, max:20
    },
    "shipping_address": {                             /// optional, array
        "street": "Plot 5, GIDC Industrial Estate",   /// optional, string, max:500
        "city": "Vadodara",                           /// optional, string, max:255
        "state": "Gujarat",                           /// optional, string, max:255
        "pin": "390020"                               /// optional, string, max:20
    },
    "contact_number": "9876543210",                   /// optional, string, max:20
    "country_code": 91                                /// optional, integer
}
```

**Response Body**:
```json
{
    "message": "Ledger created successfully.",
    "body": {
        "ledger": {
            "id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
            "name": "Rajesh Traders",
            "type": "customer",
            "opening_balance": 5000.00,
            "opening_balance_type": "debit",
            "current_balance": 5000.00,
            "gst_number": "27AADCB2230M1ZP",
            "billing_address": {
                "street": "12, MG Road",
                "city": "Ahmedabad",
                "state": "Gujarat",
                "pin": "380001"
            },
            "shipping_address": {
                "street": "Plot 5, GIDC Industrial Estate",
                "city": "Vadodara",
                "state": "Gujarat",
                "pin": "390020"
            },
            "contact_number": "9876543210",
            "country_code": 91,
            "created_at": "2025-10-01T12:00:00.000000Z",
            "updated_at": "2025-10-01T12:00:00.000000Z"
        }
    }
}
```

---

## 3. Get Ledger Details
**Endpoint**: `GET /ledgers/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
    "message": "OK",
    "body": {
        "ledger": {
            "id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
            "name": "Rajesh Traders",
            "type": "customer",
            "opening_balance": 5000.00,
            "opening_balance_type": "debit",
            "current_balance": 8500.00,
            "gst_number": "27AADCB2230M1ZP",
            "billing_address": {
                "street": "12, MG Road",
                "city": "Ahmedabad",
                "state": "Gujarat",
                "pin": "380001"
            },
            "shipping_address": {
                "street": "Plot 5, GIDC Industrial Estate",
                "city": "Vadodara",
                "state": "Gujarat",
                "pin": "390020"
            },
            "contact_number": "9876543210",
            "country_code": 91,
            "created_at": "2025-10-01T12:00:00.000000Z",
            "updated_at": "2025-10-05T08:30:00.000000Z"
        }
    }
}
```

---

## 4. Update Ledger
**Endpoint**: `PUT /ledgers/{id}`

**Request Body**:
```json
{
    "name": "Rajesh Traders Pvt Ltd",                 /// optional, string, max:255
    "type": "customer",                               /// optional, string, allowed: customer, supplier, bank, cash, expense
    "opening_balance": 6000.00,                       /// optional, numeric, min:0
    "opening_balance_type": "debit",                  /// optional, string, allowed: credit, debit
    "gst_number": "27AADCB2230M1ZP",                 /// optional, string, max:50
    "billing_address": {                              /// optional, array
        "street": "12, MG Road, Navrangpura",         /// optional, string, max:500
        "city": "Ahmedabad",                          /// optional, string, max:255
        "state": "Gujarat",                           /// optional, string, max:255
        "pin": "380009"                               /// optional, string, max:20
    },
    "shipping_address": {                             /// optional, array
        "street": "Plot 5, GIDC Industrial Estate",   /// optional, string, max:500
        "city": "Vadodara",                           /// optional, string, max:255
        "state": "Gujarat",                           /// optional, string, max:255
        "pin": "390020"                               /// optional, string, max:20
    },
    "contact_number": "9876543210",                   /// optional, string, max:20
    "country_code": 91                                /// optional, integer
}
```
*Note: If `opening_balance` is changed, `current_balance` is automatically recalculated by the difference.*

**Response Body**:
```json
{
    "message": "OK",
    "body": {
        "ledger": {
            "id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
            "name": "Rajesh Traders Pvt Ltd",
            "type": "customer",
            "opening_balance": 6000.00,
            "opening_balance_type": "debit",
            "current_balance": 9500.00,
            "gst_number": "27AADCB2230M1ZP",
            "billing_address": {
                "street": "12, MG Road, Navrangpura",
                "city": "Ahmedabad",
                "state": "Gujarat",
                "pin": "380009"
            },
            "shipping_address": {
                "street": "Plot 5, GIDC Industrial Estate",
                "city": "Vadodara",
                "state": "Gujarat",
                "pin": "390020"
            },
            "contact_number": "9876543210",
            "country_code": 91,
            "created_at": "2025-10-01T12:00:00.000000Z",
            "updated_at": "2025-10-10T14:20:00.000000Z"
        }
    }
}
```

---

## 5. Delete Ledger
**Endpoint**: `DELETE /ledgers/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
    "message": "Ledger deleted successfully."
}
```

---

## 6. Ledger Transactions
**Endpoint**: `POST /ledgers/{id}/transactions`

**Request Body**:
```json
{
    "page": 1,            /// optional, numeric, min:1
    "per_page": "10",     /// optional, string, allowed: 5, 10, 30, 50, 100, all
    "sort_by": "transaction_date",   /// optional, string, allowed: id, transaction_number, amount, type, transaction_date, created_at, updated_at
    "sort_dir": "desc",   /// optional, string, allowed: asc, desc
    "search": "",         /// optional, string
    "type": "payment_in"  /// optional, string, allowed: payment_in, payment_out, contra, journal
}
```

**Response Body**:
```json
{
    "message": "OK",
    "body": {
        "transactions": [
            {
                "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                "transaction_number": "TXN-000001",
                "payment_ledger_id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
                "party_ledger_id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
                "project_id": null,
                "site_id": null,
                "amount": 5000.00,
                "type": "payment_in",
                "remark": "Cash received from Rajesh Traders",
                "proof_image": null,
                "transaction_date": "2025-10-15",
                "payment_ledger": {
                    "id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
                    "name": "Cash Account",
                    "type": "cash"
                },
                "party_ledger": {
                    "id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
                    "name": "Rajesh Traders",
                    "type": "customer"
                },
                "created_at": "2025-10-15T10:30:00.000000Z",
                "updated_at": "2025-10-15T10:30:00.000000Z"
            }
        ],
        "meta": {
            "current_page": 1,
            "per_page": 10,
            "total": 1,
            "last_page": 1
        },
        "allowed_sorts": ["id", "transaction_number", "amount", "type", "transaction_date", "created_at", "updated_at"],
        "filter": {
            "type": ["payment_in", "payment_out", "contra", "journal"]
        }
    }
}
```
*Note: `allowed_sorts` and `filter` are only included when `current_page == 1`. Returns transactions where the ledger is either the payment or party account.*
