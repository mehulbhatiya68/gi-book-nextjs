# App Info APIs

Public content for the GI Book info screen: About, Terms of Service, Privacy Policy, and Android/iOS app version.

Each key has its own GET. Data is managed by admin via [../admin-docs/settings.md](../admin-docs/settings.md).

**Auth required:** No

---

## API Summary Table

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/app-info` | GET | List pages (title + description) and app versions | No |
| 2 | `/app-info/about_us` | GET | About GI Book including HTML | No |
| 3 | `/app-info/terms_of_service` | GET | Terms of Service including HTML | No |
| 4 | `/app-info/privacy_policy` | GET | Privacy Policy including HTML | No |
| 5 | `/app-info/app_version` | GET | Android + iOS app versions | No |

---

## 1. List app info

**Endpoint:** `GET /app-info`

Use this for the list screen. `app_version` includes both platforms; the client displays the version for its own `android` or `ios` build.

**Request Body:** `None`

**Response Body:**
```json
{
  "message": "OK",
  "body": {
    "pages": [
      {
        "key": "about_us",
        "title": "About GI Book",
        "description": "Discover how GI BOOK helps businesses manage invoices, inventory, payments, and accounts with ease."
      },
      {
        "key": "terms_of_service",
        "title": "Terms of Service",
        "description": "Read the terms that govern your use of GI Book."
      },
      {
        "key": "privacy_policy",
        "title": "Privacy Policy",
        "description": "Learn how GI Book collects, uses, and protects your data."
      }
    ],
    "app_version": {
      "android": {
        "version": "1.5.001",
        "description": "Bug fixes and performance improvements."
      },
      "ios": {
        "version": "1.5.001",
        "description": "Bug fixes and performance improvements."
      }
    }
  }
}
```

---

## 2–4. Page details

Same response shape for:

- `GET /app-info/about_us`
- `GET /app-info/terms_of_service`
- `GET /app-info/privacy_policy`

**Request Body:** `None`

**Response Body:**
```json
{
  "message": "OK",
  "body": {
    "page": {
      "key": "about_us",
      "title": "About GI Book",
      "description": "Discover how GI BOOK helps businesses manage invoices, inventory, payments, and accounts with ease.",
      "html_content": "<h1>About GI Book</h1><p>GI Book helps businesses manage invoices, inventory, payments, and accounts.</p>"
    }
  }
}
```

---

## 5. App version

**Endpoint:** `GET /app-info/app_version`

**Request Body:** `None`

**Response Body:**
```json
{
  "message": "OK",
  "body": {
    "app_version": {
      "android": {
        "version": "1.5.001",
        "description": "Bug fixes and performance improvements."
      },
      "ios": {
        "version": "1.5.001",
        "description": "Bug fixes and performance improvements."
      }
    }
  }
}
```
