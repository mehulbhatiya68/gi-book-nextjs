# Settings & Preferences APIs

This document defines the settings and preferences database schema and API endpoints.

## API Summary Table

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/settings` | GET | Retrieve user settings and preferences | Yes |
| 2 | `/settings` | POST | Update user settings and preferences | Yes |

---

## Database Schema: `user_settings`
```text
id(UUID) - Primary Key
user_id(UUID - Foreign Key) - Associated user
business_id(UUID - Foreign Key) - Associated business profile
currency(STRING) - Default billing currency (e.g., "INR")
timezone(STRING) - User local timezone (e.g., "Asia/Kolkata")
language(STRING) - Language selection code (e.g., "en")
thermal_printer_size(ENUM - 2_inch, 3_inch) - Print format sizing
invoice_prefix(STRING) - Default prefix code for invoice generation (e.g., "INV")
invoice_theme_color(STRING) - UI theme primary color hex code
show_gst_column(BOOLEAN) - Flag to show/hide tax column in invoices
timestamps
```
*Note: Stores personal, print, and theme preference parameters for individual users and their businesses.*

---

## 1. Get Settings
**Endpoint**: `GET /settings`

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "settings": {
      "id": "uuid",
      "currency": "INR",
      "timezone": "Asia/Kolkata",
      "language": "en",
      "thermal_printer_size": "3_inch",
      "invoice_prefix": "INV",
      "invoice_theme_color": "#1B1B18",
      "show_gst_column": true
    }
  }
}
```

---

## 2. Update Settings
**Endpoint**: `POST /settings`

**Request Body**:
```json
{
  "currency": "INR",   /// optional, string, max:10
  "timezone": "Asia/Kolkata",   /// optional, string, max:255, must be a valid timezone
  "language": "en",   /// optional, string, max:10
  "thermal_printer_size": "2_inch",   /// optional, string, allowed: 2_inch, 3_inch
  "invoice_prefix": "GI-INV",   /// optional, string, max:50
  "invoice_theme_color": "#fffaed",   /// optional, string, max:20
  "show_gst_column": false   /// optional, boolean
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "settings": {
      "id": "uuid",
      "currency": "INR",
      "timezone": "Asia/Kolkata",
      "language": "en",
      "thermal_printer_size": "2_inch",
      "invoice_prefix": "GI-INV",
      "invoice_theme_color": "#fffaed",
      "show_gst_column": false
    }
  }
}
```
