# Authentication API

A comprehensive authentication and user management API built with Express.js and SuperTokens, providing secure user authentication, profile management, and administrative features.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Public Routes](#public-routes)
  - [Protected Routes](#protected-routes)
  - [Admin Routes](#admin-routes)
- [Request/Response Examples](#requestresponse-examples)
- [Error Handling](#error-handling)
- [Middleware](#middleware)
- [Validation](#validation)

## Features

- 🔐 Secure user authentication with SuperTokens
- 👤 User profile management
- 📧 Email verification system
- 🔑 Password reset functionality
- 📍 Address management
- ⚙️ User preferences and settings
- 🛡️ Session management
- 👨‍💼 Admin functions
- ✅ Input validation with express-validator

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Express.js
- SuperTokens
- A configured database

### Installation

```bash
npm install express supertokens-node express-validator
```

### Environment Variables

Create a `.env` file with the following variables:

```env
SUPERTOKENS_CONNECTION_URI=your_supertokens_uri
SUPERTOKENS_API_KEY=your_api_key
DATABASE_URL=your_database_url
```

## Authentication

This API uses SuperTokens for authentication. Protected routes require a valid Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Public Routes

These endpoints do not require authentication.

#### Password Reset

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/password/reset` | Request password reset token |
| POST | `/user/password/reset/submit` | Submit password reset with token |

### Protected Routes

These endpoints require a valid authentication token.

#### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/me` | Get current user information |
| DELETE | `/user/account` | Delete user account |

#### Authentication & Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/logout` | Logout from current session |
| POST | `/user/logout/all` | Logout from all sessions |
| GET | `/user/sessions` | Get all active sessions |
| DELETE | `/user/sessions/:sessionHandle` | Revoke specific session |

#### Email Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/email/verify/resend` | Resend email verification |

#### Password Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/user/password` | Update user password |

#### Profile Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/user/profile` | Update user profile |

#### Address Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/addresses` | Add new address |
| PUT | `/user/addresses/:addressId` | Update existing address |
| DELETE | `/user/addresses/:addressId` | Delete address |

#### User Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/user/preferences` | Update user preferences |

### Admin Routes

These endpoints require admin access privileges.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/reset-password` | Admin reset user password |

## Request/Response Examples

### Password Reset Request

**Request:**
```bash
POST /user/password/reset
Content-Type: application/json

{
  "formFields": [
    {
      "id": "email",
      "value": "user@example.com"
    }
  ]
}
```

**Response:**
```json
{
  "status": "OK",
  "message": "Password reset email sent"
}
```

### Update User Profile

**Request:**
```bash
PUT /user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

**Response:**
```json
{
  "status": "OK",
  "message": "Profile updated successfully",
  "user": {
    "id": "user123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "male"
  }
}
```

### Add New Address

**Request:**
```bash
POST /user/addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "street": "123 Main St",
  "city": "Cairo",
  "state": "Cairo",
  "zipCode": "12345",
  "phone": "+1234567890"
}
```

### Update User Preferences

**Request:**
```bash
PUT /user/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "language": "ar",
  "currency": "EGP",
  "theme": "light",
  "notifications": {
    "email": true,
    "push": false,
    "sms": true
  }
}
```

## Error Handling

The API returns standardized error responses:

```json
{
  "status": "ERROR",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Middleware

### Authentication Middleware

- `verifySession()` - SuperTokens session verification
- `verifyUser` - Custom user verification middleware

All protected routes automatically include these middleware functions.

### Admin Middleware

Admin routes include additional verification to ensure the user has administrative privileges.

## Validation

The API uses `express-validator` for input validation with the following rules:

### Email Validation
- Valid email format required
- Required for registration and password reset

### Password Validation
- Minimum 6 characters
- Required for password updates and account deletion

### Phone Number Validation
- Valid phone number format
- International format supported

### General Validation
- Required field validation
- Data type validation
- String length limits

## Security Features

- 🛡️ SuperTokens integration for secure authentication
- 🔒 Password hashing and secure storage
- 🚫 Session management and revocation
- ✅ Input validation and sanitization
- 🔐 Admin role-based access control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.