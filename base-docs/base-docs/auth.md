# Auth APIs

End-user authentication on the **main API** (`routes/api.php`).

**Base URL:** `https://{APP_DOMAIN}/api`

Admin and white label login is on the admin subdomain — see [../admin-docs/auth.md](../admin-docs/auth.md).

## API Summary Table

| # | Endpoint | Method | Description | Auth Required |
|---|---|---|---|---|
| 1 | `/auth/register` | POST | Register a new user account | No |
| 2 | `/auth/login` | POST | Login using email and password | No |
| 3 | `/auth/forgot-password` | POST | Request OTP for password recovery | No |
| 4 | `/auth/forgot-password/set-password` | POST | Set a new password using OTP verification token | No |
| 5 | `/auth/change-password` | POST | Change password for authenticated user | Yes |
| 6 | `/auth/logout` | POST | Logout and revoke access token | Yes |
| 7 | `/auth/profile` | GET | Retrieve authenticated user profile | Yes |
| 8 | `/auth/profile` | PUT | Update user profile details | Yes |
| 9 | `/auth/account` | DELETE | Delete user account and associated business | Yes |
| 10 | `/splash` | GET | Bootstrap user + permissions (no role) | Optional |

---

---

## End-user roles

Main API accepts `user` and `user_staff` (via `user.only` middleware on protected modules).

| Type | Description |
|------|-------------|
| `user` | Business owner — creates businesses and subscriptions |
| `user_staff` | Staff under a user — inherits parent's subscription |

Platform hierarchy (`admin`, `white_label`, etc.) is documented in [../admin-docs/architecture.md](../admin-docs/architecture.md).

---

## Database Schema: `users`
```text
id(UUID) - Primary Key
parent_id(UUID - nullable) - References users.id (hierarchical parent)
name(STRING) - User's full name
email(STRING) - Unique email address
password(STRING) - Hashed password
mobile_number(STRING) - Mobile number for SMS login
country_code(INTEGER) - Country dialing code (e.g., 91)
user_type(ENUM - admin, admin_staff, white_label, white_label_staff, user, user_staff) - Role type
status(ENUM - active, inactive) - User status
phone_verified_at(TIMESTAMP - nullable) - Verification timestamp
email_verified_at(TIMESTAMP - nullable) - Verification timestamp
fcm_token(STRING - nullable) - Firebase device token for push (set on login/register)
fcm_platform(STRING - nullable) - Device platform: android, ios, web
timestamps
```
*Note: Stores application users. The parent_id establishes the admin → white_label → user hierarchy.*

## Database Schema: `otps`
```text
id(UUID) - Primary Key
identifier(STRING) - Email or mobile number
code(STRING) - Generated OTP code (hashed/encrypted or plaintext)
token(STRING - nullable) - Secure token returned after validation
expires_at(TIMESTAMP) - OTP expiry date and time
timestamps
```
*Note: Temporary table for verification codes sent via SMS or Email.*

---

## 1. Register
**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "name": "John Doe",               /// required, string, max:255
  "email": "john@example.com",      /// required, string, email, max:255, unique:users,email
  "password": "password123",        /// required, string, min:8
  "mobile_number": "1234567890",    /// required, string, max:20
  "country_code": 91,               /// required, integer
  "user_type": "user",              /// required, string, allowed: admin, admin_staff, white_label, white_label_staff, user, user_staff
  "parent_id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",   /// optional, uuid, must be a valid users id
  "fcm_token": "device-fcm-token",   /// optional, string, max:500 — stores Firebase token on user
  "fcm_platform": "android"          /// optional, string — android, ios, web
}
```

**Response Body**:
```json
{
  "message": "Registered successfully.",
  "body": {
    "user": {
      "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "parent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile_number": "1234567890",
      "country_code": 91,
      "user_type": "user",
      "status": "active"
    },
    "token": "1|laravel_sanctum_token_string"
  }
}
```

---

## 2. Login
**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",      /// required, string, email
  "password": "password123",        /// required, string
  "fcm_token": "device-fcm-token",   /// optional, string, max:500 — stores Firebase token on user
  "fcm_platform": "android"          /// optional, string — android, ios, web
}
```

If the same `fcm_token` is registered on another account, it is cleared from the previous user.

**Response Body**:
```json
{
  "message": "Logged in successfully.",
  "body": {
    "user": {
      "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "parent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile_number": "1234567890",
      "country_code": 91,
      "user_type": "user",
      "status": "active"
    },
    "token": "2|laravel_sanctum_token_string"
  }
}
```

Login revokes every existing token for that user, then issues a new one (single active session).

**Inactive account (`403`)**:
```json
{
  "message": "Your account is inactive.",
  "code": "account_inactive"
}
```

The same `account_inactive` response is returned on protected routes and `GET /splash` (when a bearer token is sent) after an admin sets the user to inactive. All sessions are revoked with that response. Staff are blocked when their parent user is inactive.

---

<!-- ## 3. Phone Login
**Endpoint**: `POST /auth/login/phone`

**Request Body**:
```json
{
  "mobile_number": "1234567890",    /// required, string, max:20
  "country_code": 91                /// required, integer
}
```

**Response Body**:
```json
{
  "message": "OTP sent successfully.",
  "body": {
    "identifier": "1234567890",
    "country_code": 91,
    "resend_available_in_seconds": 60
  }
}
```

---

## 4. Verify OTP
**Endpoint**: `POST /auth/login/verify-otp`

**Request Body**:
```json
{
  "mobile_number": "1234567890",    /// required, string, max:20
  "country_code": 91,               /// required, integer
  "otp": "123456"                   /// required, string, min:4, max:10
}
```

**Response Body**:
```json
{
  "message": "OTP verified and logged in successfully.",
  "body": {
    "user": {
      "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "parent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile_number": "1234567890",
      "country_code": 91,
      "user_type": "user",
      "status": "active"
    },
    "token": "3|laravel_sanctum_token_string"
  }
}
``` -->

---

## 5. Forgot Password
**Endpoint**: `POST /auth/forgot-password`

**Request Body**:
```json
{
  "identifier": "john@example.com"  /// required, string
}
```

**Response Body**:
```json
{
  "message": "OTP sent successfully.",
  "body": {
    "identifier": "john@example.com",
    "resend_available_in_seconds": 60
  }
}
```

---

## 6. Set New Password
**Endpoint**: `POST /auth/forgot-password/set-password`

**Request Body**:
```json
{
  "identifier": "john@example.com",                 /// required, string
  "otp": "654321",                                  /// required, string
  "password": "newsecurepassword123",               /// required, string, min:8, confirmed
  "password_confirmation": "newsecurepassword123"   /// required, string, min:8
}
```

**Response Body**:
```json
{
  "message": "Password set successfully.",
  "body": {
    "user": {
      "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "parent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile_number": "1234567890",
      "country_code": 91,
      "user_type": "user",
      "status": "active"
    },
    "token": "4|laravel_sanctum_token_string"
  }
}
```

---

## 7. Change Password
**Endpoint**: `POST /auth/change-password`

**Request Body**:
```json
{
  "current_password": "password123",                /// required, string
  "password": "brandnewpassword456",                /// required, string, min:8, confirmed
  "password_confirmation": "brandnewpassword456"   /// required, string, min:8
}
```

**Response Body**:
```json
{
  "message": "Password changed successfully.",
  "body": {}
}
```

---

## 8. Logout
**Endpoint**: `POST /auth/logout`

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "Logged out successfully.",
  "body": {}
}
```

---

## 9. Get Profile
**Endpoint**: `GET /auth/profile`

**Request Body**: `None`

**Response Body**:
```json
{
  "message": "Profile retrieved successfully.",
  "body": {
    "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
    "parent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile_number": "1234567890",
    "country_code": 91,
    "user_type": "user",
    "status": "active"
  }
}
```

---

## 10. Update Profile
**Endpoint**: `PUT /auth/profile`

**Request Body**:
```json
{
  "name": "John Doe Updated",       /// required, string, max:255
  "mobile_number": "0987654321",    /// required, string, max:20
  "country_code": 91                /// required, integer
}
```

**Response Body**:
```json
{
  "message": "Profile updated successfully.",
  "body": {
    "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
    "parent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "John Doe Updated",
    "email": "john@example.com",
    "mobile_number": "0987654321",
    "country_code": 91,
    "user_type": "user",
    "status": "active"
  }
}
```

---

## 11. Delete Account
**Endpoint**: `DELETE /auth/account`

**Request Body**:
```json
{
  "password": "password123"         /// required, string
}
```

**Response Body**:
```json
{
  "message": "Account deleted successfully.",
  "body": {}
}
```

---

## 12. Splash

**Endpoint**: `GET /splash`

**Auth:** optional. With a valid end-user token, `user` and `permissions` are filled. Without a token they are `null`. Does not send `role`.

Owners receive every `user` scope permission. Staff receive only assigned pivot permissions. See [permissions.md](./permissions.md).

**Response Body** (authenticated staff):
```json
{
  "message": "OK",
  "body": {
    "user": {
      "id": "87b0a8ee-9bb3-41c3-8f06-25f0ad9c362c",
      "name": "Ravi",
      "email": "ravi@company.com",
      "type": "staff",
      "status": "active"
    },
    "permissions": {
      "ledger": [
        { "id": 15, "name": "view" },
        { "id": 16, "name": "create" }
      ]
    },
    "active_subscription": {},
    "selected_business_profile": {},
    "business_profiles": [],
    "notifications_count": 0
  }
}
```

