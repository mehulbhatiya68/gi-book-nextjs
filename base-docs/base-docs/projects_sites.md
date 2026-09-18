# Projects & Sites APIs

This document defines the projects and sites database schemas and API endpoints.

## API Summary Table

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/projects` | POST | List projects (supports search, status filter, and pagination) | Yes |
| 2 | `/projects/store` | POST | Create a new project | Yes |
| 3 | `/projects/{id}` | GET | Retrieve detailed information of a project | Yes |
| 4 | `/projects/{id}` | PUT | Update an existing project's details | Yes |
| 5 | `/projects/{id}` | DELETE | Delete a project | Yes |
| 6 | `/sites` | POST | List sites (supports search, status filter, project filter, and pagination) | Yes |
| 7 | `/sites/store` | POST | Create a new site under a project | Yes |
| 8 | `/sites/{id}` | GET | Retrieve detailed information of a site | Yes |
| 9 | `/sites/{id}` | PUT | Update an existing site's details | Yes |
| 10 | `/sites/{id}` | DELETE | Delete a site | Yes |
| 11 | `/transactions` | POST | List transactions (pass `type` and `id` to filter by ledger, project, or site) | Yes |

---

## Database Schema: `projects`
```text
id(UUID) - Primary Key
business_id(UUID - Foreign Key) - Associated business profile
name(STRING) - Project name
description(TEXT - nullable) - Description of project scope
status(ENUM - ongoing, completed, on_hold) - Lifecycle status of project
timestamps
```
*Note: Stores projects managed by the business.*

## Database Schema: `sites`
```text
id(UUID) - Primary Key
project_id(UUID - Foreign Key) - Associated parent project
name(STRING) - Site name
location(STRING - nullable) - Physical site location address/coordinates
status(ENUM - active, inactive) - Site operations status
timestamps
```
*Note: Stores individual sites which may belong to a project.*

---

## 1. List Projects
**Endpoint**: `POST /projects`

**Request Body**:
```json
{
    "page": 1,            /// optional, numeric, min:1
    "per_page": "10",     /// optional, string, allowed: 5, 10, 30, 50, 100, all
    "sort_by": "name",    /// optional, string, allowed: id, name, status, created_at, updated_at
    "sort_dir": "asc",    /// optional, string, allowed: asc, desc
    "search": "",         /// optional, string
    "status": "ongoing"   /// optional, string, allowed: ongoing, completed, on_hold
}
```

**Response Body**:
```json
{
    "message": "OK",
    "body": {
        "projects": [
            {
                "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                "name": "Greenfield Township",
                "description": "200-unit residential township project in Ahmedabad",
                "status": "ongoing",
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
        "allowed_sorts": ["id", "name", "status", "created_at", "updated_at"],
        "filter": {
            "status": ["ongoing", "completed", "on_hold"]
        }
    }
}
```
*Note: `allowed_sorts` and `filter` are only included when `current_page == 1`.*

---

## 2. Create Project
**Endpoint**: `POST /projects/store`

**Request Body**:
```json
{
    "name": "Greenfield Township",                                   /// required, string, max:255
    "description": "200-unit residential township project in Ahmedabad",   /// optional, string
    "status": "ongoing"                                              /// required, string, allowed: ongoing, completed, on_hold
}
```

**Response Body**:
```json
{
    "message": "Project created successfully.",
    "body": {
        "project": {
            "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            "name": "Greenfield Township",
            "description": "200-unit residential township project in Ahmedabad",
            "status": "ongoing",
            "created_at": "2025-10-01T12:00:00.000000Z",
            "updated_at": "2025-10-01T12:00:00.000000Z"
        }
    }
}
```

---

## 3. Get Project Details
**Endpoint**: `GET /projects/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
    "message": "OK",
    "body": {
        "project": {
            "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            "name": "Greenfield Township",
            "description": "200-unit residential township project in Ahmedabad",
            "status": "ongoing",
            "sites": [
                {
                    "id": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
                    "name": "Block A - Foundation",
                    "location": "Sector 12, SG Highway, Ahmedabad",
                    "status": "active"
                }
            ],
            "created_at": "2025-10-01T12:00:00.000000Z",
            "updated_at": "2025-10-05T08:30:00.000000Z"
        }
    }
}
```

---

## 4. Update Project
**Endpoint**: `PUT /projects/{id}`

**Request Body**:
```json
{
    "name": "Greenfield Township Phase 2",                           /// optional, string, max:255
    "description": "Expanded to 350-unit residential township",      /// optional, string
    "status": "completed"                                            /// optional, string, allowed: ongoing, completed, on_hold
}
```

**Response Body**:
```json
{
    "message": "OK",
    "body": {
        "project": {
            "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            "name": "Greenfield Township Phase 2",
            "description": "Expanded to 350-unit residential township",
            "status": "completed",
            "created_at": "2025-10-01T12:00:00.000000Z",
            "updated_at": "2025-10-10T14:20:00.000000Z"
        }
    }
}
```

---

## 5. Delete Project
**Endpoint**: `DELETE /projects/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
    "message": "Project deleted successfully."
}
```

---

## 6. List Sites
**Endpoint**: `POST /sites`

**Request Body**:
```json
{
    "page": 1,            /// optional, numeric, min:1
    "per_page": "10",     /// optional, string, allowed: 5, 10, 30, 50, 100, all
    "sort_by": "name",    /// optional, string, allowed: id, name, status, created_at, updated_at
    "sort_dir": "asc",    /// optional, string, allowed: asc, desc
    "search": "",         /// optional, string
    "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",   /// optional, uuid, must be a valid projects id belonging to the business
    "status": "active"    /// optional, string, allowed: active, inactive
}
```

**Response Body**:
```json
{
    "message": "OK",
    "body": {
        "sites": [
            {
                "id": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
                "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                "name": "Block A - Foundation",
                "location": "Sector 12, SG Highway, Ahmedabad",
                "status": "active",
                "project": {
                    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                    "name": "Greenfield Township"
                },
                "created_at": "2025-10-02T09:00:00.000000Z",
                "updated_at": "2025-10-06T11:15:00.000000Z"
            }
        ],
        "meta": {
            "current_page": 1,
            "per_page": 10,
            "total": 1,
            "last_page": 1
        },
        "allowed_sorts": ["id", "name", "status", "created_at", "updated_at"],
        "filter": {
            "status": ["active", "inactive"]
        }
    }
}
```
*Note: `allowed_sorts` and `filter` are only included when `current_page == 1`.*

---

## 7. Create Site
**Endpoint**: `POST /sites/store`

**Request Body**:
```json
{
    "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",   /// required, uuid, must be a valid projects id belonging to the business
    "name": "Block A - Foundation",                             /// required, string, max:255
    "location": "Sector 12, SG Highway, Ahmedabad",             /// optional, string, max:500
    "status": "active"                                          /// required, string, allowed: active, inactive
}
```

**Response Body**:
```json
{
    "message": "Site created successfully.",
    "body": {
        "site": {
            "id": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
            "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            "name": "Block A - Foundation",
            "location": "Sector 12, SG Highway, Ahmedabad",
            "status": "active",
            "created_at": "2025-10-02T09:00:00.000000Z",
            "updated_at": "2025-10-02T09:00:00.000000Z"
        }
    }
}
```

---

## 8. Get Site Details
**Endpoint**: `GET /sites/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
    "message": "OK",
    "body": {
        "site": {
            "id": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
            "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            "name": "Block A - Foundation",
            "location": "Sector 12, SG Highway, Ahmedabad",
            "status": "active",
            "project": {
                "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                "name": "Greenfield Township"
            },
            "created_at": "2025-10-02T09:00:00.000000Z",
            "updated_at": "2025-10-06T11:15:00.000000Z"
        }
    }
}
```

---

## 9. Update Site
**Endpoint**: `PUT /sites/{id}`

**Request Body**:
```json
{
    "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",   /// optional, uuid, must be a valid projects id belonging to the business
    "name": "Block A - Superstructure",                         /// optional, string, max:255
    "location": "Sector 12, SG Highway, Ahmedabad",             /// optional, string, max:500
    "status": "inactive"                                        /// optional, string, allowed: active, inactive
}
```

**Response Body**:
```json
{
    "message": "OK",
    "body": {
        "site": {
            "id": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
            "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            "name": "Block A - Superstructure",
            "location": "Sector 12, SG Highway, Ahmedabad",
            "status": "inactive",
            "created_at": "2025-10-02T09:00:00.000000Z",
            "updated_at": "2025-10-10T14:20:00.000000Z"
        }
    }
}
```

---

## 10. Delete Site
**Endpoint**: `DELETE /sites/{id}`

**Request Body**: `None`

**Response Body**:
```json
{
    "message": "Site deleted successfully."
}
```

---

## 11. List Transactions (Common)
**Endpoint**: `POST /transactions`

**Request Body**:
```json
{
    "type": "project",    /// required, string, allowed: ledger, project, site
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",   /// required, uuid, must be a valid id of the specified type belonging to the business
    "page": 1,            /// optional, numeric, min:1
    "per_page": "10",     /// optional, string, allowed: 5, 10, 30, 50, 100, all
    "sort_by": "transaction_date",   /// optional, string, allowed: id, transaction_number, amount, type, transaction_date, created_at, updated_at
    "sort_dir": "desc",   /// optional, string, allowed: asc, desc
    "search": "",         /// optional, string
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
                "id": "f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c",
                "transaction_number": "TXN-000012",
                "payment_ledger_id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
                "party_ledger_id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
                "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                "site_id": null,
                "amount": 50000.00,
                "type": "payment_in",
                "remark": "Advance received for Block A construction",
                "proof_image": null,
                "transaction_date": "2025-10-15",
                "payment_ledger": {
                    "id": "9f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
                    "name": "HDFC Bank Account",
                    "type": "bank"
                },
                "party_ledger": {
                    "id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
                    "name": "Rajesh Builders",
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
            "transaction_type": ["payment_in", "payment_out", "contra", "journal"]
        }
    }
}
```
*Note: `allowed_sorts` and `filter` are only included when `current_page == 1`. For `type: "ledger"`, returns transactions where the ledger is either the payment or party account. For `type: "project"` or `type: "site"`, filters by `project_id` or `site_id` respectively.*
