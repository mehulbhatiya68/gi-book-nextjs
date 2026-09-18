# Items APIs

This document defines the items database schemas and API endpoints.

## API Summary Table

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/items` | POST | List items (supports search, type filter, and pagination) | Yes |
| 2 | `/items/store` | POST | Create a new item (product or service) | Yes |
| 3 | `/items/{id}` | GET | Retrieve detailed information of an item | Yes |
| 4 | `/items/{id}` | PUT | Update an existing item | Yes |
| 5 | `/items/{id}` | DELETE | Delete an item | Yes |
| 6 | `/items/{id}/adjust-stock` | POST | Adjust the stock quantity of an item | Yes |
| 7 | `/items/{id}/stock-adjustments` | POST | List stock adjustment history for an item | Yes |

---

## Database Schema: `items`
```text
id(UUID) - Primary Key
business_id(UUID - Foreign Key) - Associated business profile
item_name(STRING) - Product or service name
item_code(STRING - nullable) - SKU or barcode identifier
hsn_sac_code(STRING - nullable) - HSN or SAC code for tax purposes
item_type(ENUM - product, service) - Type of item
unit(STRING) - Unit of measurement (e.g., PCS, BOX, KG)
sales_price(DECIMAL) - Selling price per unit
sales_price_tax_type(ENUM - with_tax, without_tax) - Tax inclusion type
purchase_price(DECIMAL) - Cost price per unit
purchase_price_tax_type(ENUM - with_tax, without_tax) - Tax inclusion type
tax_rate(DECIMAL) - GST rate percentage (e.g., 18.00)
description(TEXT - nullable) - Brief detail of product or service
current_stock(DECIMAL) - Current stock quantity (auto-updated by transactions/adjustments)
min_stock_alert(DECIMAL - nullable) - Low stock threshold per item (user-managed)
max_stock_alert(DECIMAL - nullable) - High stock threshold per item (user-managed)
timestamps
```
*Note: Stores product and service items for invoicing.*

## Database Schema: `stock_adjustments`
```text
id(UUID) - Primary Key
item_id(UUID - Foreign Key) - Associated item
adjustment_type(ENUM - add, reduce) - Stock increase or decrease
quantity(DECIMAL) - Quantity to adjust
reason(STRING - nullable) - Reason for adjustment (e.g. stock count, damaged, correction)
adjustment_date(DATE) - Date of stock adjustment
created_by(UUID - Foreign Key) - User who made the adjustment
timestamps
```
*Note: Records every manual stock adjustment. Used to audit stock history.*

---

## 1. List Items
**Endpoint**: `POST /items`

**Request Body**:
```json
{
    "page": 1,                  /// optional, numeric, min:1
    "per_page": "10",           /// optional, string, allowed: 5, 10, 30, 50, 100, all
    "sort_by": "item_name",     /// optional, string, allowed: id, item_name, item_type, sales_price, current_stock, created_at, updated_at
    "sort_dir": "asc",          /// optional, string, allowed: asc, desc
    "search": "",               /// optional, string
    "item_type": "product"      /// optional, string, allowed: product, service
}
```

**Response Body**:
```json
{
    "message": "OK",
    "body": {
        "items": [
            {
                "id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
                "item_name": "Premium Widget",
                "item_code": "WGT-001",
                "hsn_sac_code": "8471",
                "item_type": "product",
                "unit": "PCS",
                "sales_price": 130.00,
                "sales_price_tax_type": "without_tax",
                "purchase_price": 100.00,
                "purchase_price_tax_type": "with_tax",
                "tax_rate": 18.00,
                "description": "High quality widget",
                "current_stock": 12.00,
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
        "allowed_sorts": ["id", "item_name", "item_type", "sales_price", "current_stock", "created_at", "updated_at"],
        "filter": {
            "item_type": ["product", "service"]
        }
    }
}
```
*Note: `allowed_sorts` and `filter` are only included when `current_page == 1`.*

---

## 2. Create Item
**Endpoint**: `POST /items/store`

**Request Body**:
```json
{
    "item_name": "Premium Widget",              /// required, string, max:255
    "item_code": "WGT-001",                     /// optional, string, max:255
    "hsn_sac_code": "8471",                     /// optional, string, max:255
    "item_type": "product",                     /// required, string, allowed: product, service
    "unit": "PCS",                              /// required, string, max:50
    "sales_price": 130.00,                      /// required, numeric, min:0
    "sales_price_tax_type": "without_tax",      /// required, string, allowed: with_tax, without_tax
    "purchase_price": 100.00,                   /// required, numeric, min:0
    "purchase_price_tax_type": "with_tax",      /// required, string, allowed: with_tax, without_tax
    "tax_rate": 18.00,                          /// required, numeric, min:0, max:100
    "description": "High quality widget",       /// optional, string, max:1000
    "current_stock": 12.00,                     /// required, numeric, min:0
    "min_stock_alert": 5.00,                    /// optional, numeric, min:0 — low stock threshold
    "max_stock_alert": 100.00                    /// optional, numeric, min:0 — high stock threshold
}
```

**Response Body**:
```json
{
    "message": "Item created successfully.",
    "body": {
        "item": {
            "id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
            "item_name": "Premium Widget",
            "item_code": "WGT-001",
            "hsn_sac_code": "8471",
            "item_type": "product",
            "unit": "PCS",
            "sales_price": 130.00,
            "sales_price_tax_type": "without_tax",
            "purchase_price": 100.00,
            "purchase_price_tax_type": "with_tax",
            "tax_rate": 18.00,
            "description": "High quality widget",
            "current_stock": 12.00,
            "created_at": "2025-10-01T12:00:00.000000Z",
            "updated_at": "2025-10-01T12:00:00.000000Z"
        }
    }
}
```

---

## 3. Get Item Details
**Endpoint**: `GET /items/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
    "message": "OK",
    "body": {
        "item": {
            "id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
            "item_name": "Premium Widget",
            "item_code": "WGT-001",
            "hsn_sac_code": "8471",
            "item_type": "product",
            "unit": "PCS",
            "sales_price": 130.00,
            "sales_price_tax_type": "without_tax",
            "purchase_price": 100.00,
            "purchase_price_tax_type": "with_tax",
            "tax_rate": 18.00,
            "description": "High quality widget",
            "current_stock": 12.00,
            "created_at": "2025-10-01T12:00:00.000000Z",
            "updated_at": "2025-10-05T08:30:00.000000Z"
        }
    }
}
```

---

## 4. Update Item
**Endpoint**: `PUT /items/{id}`

**Request Body**:
```json
{
    "item_name": "Premium Widget Updated",      /// optional, string, max:255
    "item_code": "WGT-001-REV",                 /// optional, string, max:255
    "hsn_sac_code": "8471",                     /// optional, string, max:255
    "item_type": "product",                     /// optional, string, allowed: product, service
    "unit": "PCS",                              /// optional, string, max:50
    "sales_price": 140.00,                      /// optional, numeric, min:0
    "sales_price_tax_type": "without_tax",      /// optional, string, allowed: with_tax, without_tax
    "purchase_price": 110.00,                   /// optional, numeric, min:0
    "purchase_price_tax_type": "with_tax",      /// optional, string, allowed: with_tax, without_tax
    "tax_rate": 18.00,                          /// optional, numeric, min:0, max:100
    "description": "Updated high quality widget" /// optional, string, max:1000
}
```
*Note: `current_stock` cannot be updated directly — use the Adjust Stock endpoint instead.*

**Response Body**:
```json
{
    "message": "Item updated successfully.",
    "body": {
        "item": {
            "id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
            "item_name": "Premium Widget Updated",
            "item_code": "WGT-001-REV",
            "hsn_sac_code": "8471",
            "item_type": "product",
            "unit": "PCS",
            "sales_price": 140.00,
            "sales_price_tax_type": "without_tax",
            "purchase_price": 110.00,
            "purchase_price_tax_type": "with_tax",
            "tax_rate": 18.00,
            "description": "Updated high quality widget",
            "current_stock": 12.00,
            "created_at": "2025-10-01T12:00:00.000000Z",
            "updated_at": "2025-10-10T14:20:00.000000Z"
        }
    }
}
```

---

## 5. Delete Item
**Endpoint**: `DELETE /items/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
    "message": "Item deleted successfully."
}
```

---

## 6. Adjust Stock
**Endpoint**: `POST /items/{id}/adjust-stock`

**Request Body**:
```json
{
    "adjustment_type": "add",                   /// required, string, allowed: add, reduce
    "quantity": 5.00,                           /// required, numeric, gt:0
    "reason": "Stock correction count",         /// optional, string, max:500
    "adjustment_date": "2025-10-10"             /// required, date, format: Y-m-d
}
```

**Response Body**:
```json
{
    "message": "Stock adjusted successfully.",
    "body": {
        "item_id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "adjustment_type": "add",
        "quantity": 5.00,
        "current_stock": 17.00
    }
}
```

---

## 7. Stock Adjustment History
**Endpoint**: `POST /items/{id}/stock-adjustments`

**Request Body**:
```json
{
    "page": 1,                      /// optional, numeric, min:1
    "per_page": "10",               /// optional, string, allowed: 5, 10, 30, 50, 100, all
    "sort_by": "adjustment_date",   /// optional, string, allowed: id, adjustment_type, quantity, adjustment_date, created_at, updated_at
    "sort_dir": "desc"              /// optional, string, allowed: asc, desc
}
```

**Response Body**:
```json
{
    "message": "OK",
    "body": {
        "stock_adjustments": [
            {
                "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                "item_id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
                "adjustment_type": "add",
                "quantity": 5.00,
                "reason": "Stock correction count",
                "adjustment_date": "2025-10-10",
                "created_by": "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
                "created_at": "2025-10-10T09:00:00.000000Z",
                "updated_at": "2025-10-10T09:00:00.000000Z"
            }
        ],
        "meta": {
            "current_page": 1,
            "per_page": 10,
            "total": 1,
            "last_page": 1
        },
        "allowed_sorts": ["id", "adjustment_type", "quantity", "adjustment_date", "created_at", "updated_at"]
    }
}
```
*Note: `allowed_sorts` are only included when `current_page == 1`.*
