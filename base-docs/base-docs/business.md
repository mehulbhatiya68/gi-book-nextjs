# Business Profile APIs

This document defines the business profile database schema and API endpoints.

## API Summary Table

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/business` | POST | List all business profiles | Yes |
| 2 | `/business/store` | POST | Create a new business profile | Yes |
| 3 | `/business/{id}` | GET | Retrieve a specific business profile | Yes |
| 4 | `/business/{id}` | POST | Update a specific business profile | Yes |
| 5 | `/business/{id}` | DELETE | Delete a specific business profile | Yes |
| 6 | `/business/select/{id}` | POST | Select a business profile as active | Yes |

---

## Database Schema: `business_profiles`
```text
id(UUID) - Primary Key
user_id(UUID - Foreign Key) - Associated owner user
business_name(STRING) - Legal business name
business_logo(STRING - URL/nullable) - URL of uploaded logo
business_type(STRING - nullable) - Business industry type
address(TEXT) - Physical or billing address
gst_number(STRING - nullable) - GST identification number
pan_number(STRING - nullable) - PAN card number
cin(STRING - nullable) - Corporate Identification Number
tin(STRING - nullable) - Taxpayer Identification Number
contact_email(STRING) - Contact email address
contact_phone(STRING) - Contact phone number
country_code(INTEGER) - Dialing code (e.g., 91)
timestamps
```
*Note: A user can have multiple business profiles.*

---

## 1. List Business Profiles
**Endpoint**: `POST /business`

**Request Body**:
```json
{
  "page": 1,   /// optional, numeric, min:1
  "per_page": "10",   /// optional, string, allowed: 5, 10, 30, 50, 100, all
  "sort_by": "created_at",   /// optional, string, allowed: id, business_name, created_at, updated_at
  "sort_dir": "desc",   /// optional, string, allowed: asc, desc
  "search": ""   /// optional, string
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "business_profiles": [
      {
        "id": "9e1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "business_name": "My Business",
        "business_logo": "https://example.com/logo.png",
        "business_type": "Agency",
        "address": "123 Business St",
        "gst_number": "GSTIN123456",
        "pan_number": "ABCDE1234F",
        "cin": "L12345MH2000PLC123456",
        "tin": "12345678901",
        "contact_email": "business@example.com",
        "contact_phone": "1234567890",
        "country_code": 91
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 10,
      "total": 1,
      "last_page": 1
    },
    "allowed_sorts": ["id", "business_name", "created_at", "updated_at"],
    "filter": []
  }
}
```

---

## 2. Create Business Profile
**Endpoint**: `POST /business/store`

**Request Body**:
```json
{
  "business_name": "My Business",   /// required, string, max:255
  "business_logo": "https://example.com/logo.png",   /// optional, string, max:2048, nullable
  "business_type": "Agency",   /// optional, string, max:255, nullable
  "address": "123 Business St",   /// required, string, max:1000
  "gst_number": "GSTIN123456",   /// optional, string, max:50, nullable
  "pan_number": "ABCDE1234F",   /// optional, string, max:50, nullable
  "cin": "L12345MH2000PLC123456",   /// optional, string, max:50, nullable
  "tin": "12345678901",   /// optional, string, max:50, nullable
  "contact_email": "business@example.com",   /// required, string, email, max:255
  "contact_phone": "1234567890",   /// required, integer, max_digits:20
  "country_code": 91   /// required, integer
}
```

**Response Body**:
```json
{
  "message": "Business profile created successfully.",
  "body": {
    "business": {
      "id": "9e1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "business_name": "My Business",
      "business_logo": "https://example.com/logo.png",
      "business_type": "Agency",
      "address": "123 Business St",
      "gst_number": "GSTIN123456",
      "pan_number": "ABCDE1234F",
      "cin": "L12345MH2000PLC123456",
      "tin": "12345678901",
      "contact_email": "business@example.com",
      "contact_phone": "1234567890",
      "country_code": 91
    }
  }
}
```

---

## 3. Get Business Details
**Endpoint**: `GET /business/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "business": {
      "id": "9e1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "business_name": "My Business",
      "business_logo": "https://example.com/logo.png",
      "business_type": "Agency",
      "address": "123 Business St",
      "gst_number": "GSTIN123456",
      "pan_number": "ABCDE1234F",
      "cin": "L12345MH2000PLC123456",
      "tin": "12345678901",
      "contact_email": "business@example.com",
      "contact_phone": "1234567890",
      "country_code": 91
    }
  }
}
```

---

## 4. Update Business Details
**Endpoint**: `POST /business/{id}`

**Request Body**:
```json
{
  "business_name": "My Business Updated",   /// optional, string, max:255
  "business_logo": "https://example.com/logo.png",   /// optional, string, max:2048, nullable
  "business_type": "Agency",   /// optional, string, max:255, nullable
  "address": "456 New Business Ave",   /// optional, string, max:1000
  "gst_number": "GSTIN123456",   /// optional, string, max:50, nullable
  "pan_number": "ABCDE1234F",   /// optional, string, max:50, nullable
  "cin": "L12345MH2000PLC123456",   /// optional, string, max:50, nullable
  "tin": "12345678901",   /// optional, string, max:50, nullable
  "contact_email": "business_new@example.com",   /// optional, string, email, max:255
  "contact_phone": "0987654321",   /// optional, string, max_digits:15
  "country_code": 91   /// optional, integer
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "business": {
      "id": "9e1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "business_name": "My Business Updated",
      "business_logo": "https://example.com/logo.png",
      "business_type": "Agency",
      "address": "456 New Business Ave",
      "gst_number": "GSTIN123456",
      "pan_number": "ABCDE1234F",
      "cin": "L12345MH2000PLC123456",
      "tin": "12345678901",
      "contact_email": "business_new@example.com",
      "contact_phone": "0987654321",
      "country_code": 91
    }
  }
}
```

---

## 5. Delete Business Profile
**Endpoint**: `DELETE /business/{id}`

**Request Body**:
```json
{
  "password": "password123"   /// required, string
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {}
}
```

---

## 6. Select Business Profile
**Endpoint**: `POST /business/select/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "business": {
      "id": "9e1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "business_name": "My Business",
      "business_logo": "https://example.com/logo.png",
      "business_type": "Agency",
      "address": "123 Business St",
      "gst_number": "GSTIN123456",
      "pan_number": "ABCDE1234F",
      "cin": "L12345MH2000PLC123456",
      "tin": "12345678901",
      "contact_email": "business@example.com",
      "contact_phone": "1234567890",
      "country_code": 91
    }
  }
}
```
