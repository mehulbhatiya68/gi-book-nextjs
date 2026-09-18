# Staff APIs

Staff management for end users. Staff accounts are `user_staff` type and inherit the parent user's subscription.

**Middleware:** `auth:sanctum`, `account.active`, `user.only` (`subscription.active` on store, `user.check.permission` per action)

Creating staff counts against the **staff** feature quota.

Users (`type: user`) receive every `user` scope permission. Staff (`type: staff`) receive only rows assigned on `user_has_permissions`. Assign those IDs on create, update, or the dedicated sync endpoint. The catalog is `GET /permissions`.

---

## API Summary Table

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/staff` | POST | List staff members (with pagination) | Yes + `staff.view` |
| 2 | `/staff/store` | POST | Add a new staff member | Yes + active subscription + `staff.create` |
| 3 | `/staff/{id}` | PUT | Update an existing staff member | Yes + `staff.update` |
| 4 | `/staff/{id}/permissions` | PUT | Replace a staff member's permissions | Yes + `staff.update` |
| 5 | `/staff/{id}` | DELETE | Remove/delete a staff member | Yes + `staff.delete` |
| 6 | `/permissions` | GET | List all assignable user-scope permissions | Yes + `staff.view` |

---

## 1. List Staff Members

**Endpoint**: `POST /staff`

**Permission:** `staff.view`

**Request Body**:
```json
{
  "page": 1,                        /// optional, numeric, min:1
  "per_page": "10",                 /// optional, string, allowed: 5, 10, 30, 50, 100, all
  "sort_by": "name",                /// optional, string, allowed: id, name, email, status, created_at, updated_at
  "sort_dir": "asc",                /// optional, string, allowed: asc, desc
  "search": "john",                 /// optional, string
  "status": "active"                /// optional, string, allowed: active, inactive
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "staff": [
      {
        "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
        "name": "Jane Staff",
        "email": "jane@example.com",
        "mobile_number": "1122334455",
        "country_code": 91,
        "type": "staff",
        "status": "active",
        "permissions": {
          "ledger": [
            { "id": 15, "name": "view" }
          ]
        }
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 10,
      "total": 1,
      "last_page": 1
    }
  }
}
```

---

## 2. Add New Staff

**Endpoint**: `POST /staff/store`

**Permission:** `staff.create`

**Request Body**:
```json
{
  "name": "Jane Staff",             /// required, string, max:255
  "email": "jane@example.com",      /// required, email, max:255, unique:users,email
  "password": "password123",        /// required, string, min:8
  "mobile_number": "9876543210",    /// optional, string, max:20
  "country_code": 91,               /// optional, integer
  "permission_ids": [15, 16, 19]    /// optional, integer[], user-scope permission ids (sync)
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "staff": {
      "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "name": "Jane Staff",
      "email": "jane@example.com",
      "mobile_number": "9876543210",
      "country_code": 91,
      "type": "staff",
      "status": "active",
      "permissions": {
        "ledger": [
          { "id": 15, "name": "view" },
          { "id": 16, "name": "create" }
        ],
        "item": [
          { "id": 19, "name": "view" }
        ]
      }
    }
  }
}
```

---

## 3. Update Staff

**Endpoint**: `PUT /staff/{id}`

**Permission:** `staff.update`

**Request Body**:
```json
{
  "name": "Jane Staff Updated",     /// optional, string, max:255
  "email": "jane_new@example.com",  /// optional, email, max:255, unique (ignores current staff)
  "password": "newpassword123",     /// optional, string, min:8
  "mobile_number": "9876543210",    /// optional, string, max:20
  "country_code": 91,               /// optional, integer
  "status": "active",               /// optional, string, allowed: active, inactive
  "permission_ids": [15, 25]        /// optional, integer[], replaces assigned permissions when sent
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "staff": {
      "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "name": "Jane Staff Updated",
      "email": "jane_new@example.com",
      "mobile_number": "9876543210",
      "country_code": 91,
      "type": "staff",
      "status": "active",
      "permissions": {
        "ledger": [
          { "id": 15, "name": "view" }
        ],
        "invoice": [
          { "id": 25, "name": "view" }
        ]
      }
    }
  }
}
```

Omitting `permission_ids` leaves the current assignments unchanged. Sending `[]` clears all assigned permissions.

---

## 4. Sync Staff Permissions

**Endpoint**: `PUT /staff/{id}/permissions`

**Permission:** `staff.update`

Replaces the staff member's assigned permissions. Same sync behaviour as sending `permission_ids` on update.

**Request Body**:
```json
{
  "permission_ids": [15, 16, 19]    /// required, integer[], user-scope permission ids (empty array clears all)
}
```

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "staff": {
      "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "name": "Jane Staff",
      "email": "jane@example.com",
      "mobile_number": "9876543210",
      "country_code": 91,
      "type": "staff",
      "status": "active",
      "permissions": {
        "ledger": [
          { "id": 15, "name": "view" },
          { "id": 16, "name": "create" }
        ],
        "item": [
          { "id": 19, "name": "view" }
        ]
      }
    }
  }
}
```

---

## 5. Delete Staff

**Endpoint**: `DELETE /staff/{id}`

**Permission:** `staff.delete`

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "OK",
  "body": {}
}
```

---

## 6. List Permission Catalog

**Endpoint**: `GET /permissions`

**Permission:** `staff.view`

Returns every `user` scope permission, grouped by module. Use the `id` values in `permission_ids`.

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "OK",
  "body": {
    "permissions": {
      "business": [
        { "id": 1, "name": "view" },
        { "id": 2, "name": "create" },
        { "id": 3, "name": "update" },
        { "id": 4, "name": "delete" }
      ],
      "staff": [
        { "id": 5, "name": "view" },
        { "id": 6, "name": "create" },
        { "id": 7, "name": "update" },
        { "id": 8, "name": "delete" }
      ],
      "ledger": [
        { "id": 15, "name": "view" },
        { "id": 16, "name": "create" },
        { "id": 17, "name": "update" },
        { "id": 18, "name": "delete" }
      ]
    }
  }
}
```

Stable ids are seeded in `PermissionSeeder` (`scope = user`). See [permissions.md](./permissions.md).
