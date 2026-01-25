# Forum Message Service

Message service for the forum application that handles contact us functionality, connects to the message database for storing messages, and publishes MQ events after contact us creation.

## Features

- Contact Admin Page functionality
- Message Management for admins
- MongoDB Atlas integration
- RabbitMQ (CloudAMQP) producer for contact.created events
- Global error handling (AOP)
- Health check endpoint
- JWT Bearer token authentication
- Role-based authorization (admin/super)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account and cluster
- RabbitMQ instance (e.g., CloudAMQP) for event publishing

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd forum-message-service
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.template` to `.env`
   - Update `.env` with your configuration:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/message_db?retryWrites=true&w=majority
   RABBITMQ_URI=amqps://<username>:<password>@<host>/<vhost>
   PORT=5002
   JWT_SECRET=your-secret-key-minimum-32-characters-long
   JWT_ALG=HS256
   ```
   - `RABBITMQ_URI`: CloudAMQP or RabbitMQ connection string. If omitted or invalid, the service starts without MQ; contact messages are still saved to MongoDB.
   - `JWT_SECRET`: Secret key for JWT token verification (required, minimum 32 characters)
   - `JWT_ALG`: JWT algorithm (default: HS256)

## Running the Service

### Development Mode
```bash
npm run dev
```
This starts the service with nodemon for automatic restarts on file changes.

### Production Mode
```bash
npm start
```

The service will start on port 5002 (or the port specified in your `.env` file).

## API Endpoints

### Health Check
**GET** `/message-service/health`

Returns the service health status and database connection state.

**Response:**
```json
{
  "status": "UP",
  "service": "message-service",
  "timestamp": "2024-01-19T12:00:00.000Z",
  "database": "connected"
}
```

### Contact Us
**POST** `/contactus`

Creates a new contact message. This endpoint is accessible to visitors (no JWT authentication required).

**Request Body:**
```json
{
  "email": "user@example.com",
  "subject": "Ban appeal request",
  "message": "I would like to appeal my ban..."
}
```

**Required Fields:**
- `email`: String (required, must be valid email format)
- `subject`: String (required, max 200 characters)
- `message`: String (required, max 5000 characters)

**Behavior:**
- **Visitors (no authentication)**: When a visitor submits a message, `userId` is set to `null`. The endpoint does not require JWT authentication.
- **Logged-in users**: If a logged-in user submits a message (with valid JWT), the `userId` can be optionally recorded without changing the required request fields. The request body remains the same (email, subject, message).
- **Message Queue**: After a successful MongoDB save, the service publishes a `contact.created` event to RabbitMQ (exchange: `contact_exchange`, routing key: `contact.created`). The payload includes messageId, subject, email, message, and dateCreated. If RabbitMQ is unavailable, the message is still saved and the request succeeds; the MQ failure is logged.

**Success Response (201 Created):**
```json
{
  "messageId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "subject": "Ban appeal request",
  "message": "I would like to appeal my ban...",
  "userId": null,
  "status": "Open",
  "dateCreated": "2026-01-20T12:00:00.000Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Validation Failed",
  "message": "Email is required",
  "status": 400
}
```

All error responses follow the unified error format: `{ error, message, status }`.

### Get Messages (Admin)
**GET** `/messages`

Returns all contact messages. Requires JWT authentication with admin or super role. Used by the Message Management page.

**Required Headers:**
- `Authorization`: `Bearer <jwt-token>`

**JWT Claims Required:**
- `sub` or `id`: User ID (required)
- `type`: User role - "admin" or "super" (required for this endpoint)
- `status`: User account status - "unverified", "active", or "banned"

**Success Response (200 OK):**
```json
[
  {
    "messageId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "subject": "Ban appeal",
    "message": "I would like to appeal...",
    "userId": 123,
    "status": "Open",
    "dateCreated": "2026-01-20T12:00:00.000Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Missing Bearer token, token expired, invalid token, token missing sub/id, or invalid status claim
- `403 Forbidden`: User is banned or insufficient permissions (non-admin role)

### Update Message Status (Admin)
**PUT** `/messages/:messageId`

Updates the status of a specific message (Open/Closed). Requires JWT authentication with admin or super role.

**Required Headers:**
- `Authorization`: `Bearer <jwt-token>`

**URL Parameters:**
- `messageId`: MongoDB ObjectId of the message to update

**Request Body:**
```json
{
  "status": "Closed"
}
```

**JWT Claims Required:**
- `sub` or `id`: User ID (required)
- `type`: User role - "admin" or "super" (required for this endpoint)
- `status`: User account status - "unverified", "active", or "banned"

**Success Response (200 OK):**
```json
{
  "messageId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "subject": "Ban appeal",
  "message": "I would like to appeal...",
  "userId": 123,
  "status": "Closed",
  "dateCreated": "2026-01-20T12:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid status value (must be "Open" or "Closed") or invalid messageId format
- `401 Unauthorized`: Missing Bearer token, token expired, invalid token, token missing sub/id, or invalid status claim
- `403 Forbidden`: User is banned or insufficient permissions (non-admin role)
- `404 Not Found`: Message not found

## Authentication

### JWT Bearer Token Authentication

Protected endpoints require JWT Bearer token authentication:

```http
Authorization: Bearer <jwt-token>
```

### JWT Claims Structure

- `sub` or `id`: User ID (required)
- `type`: User role - "user", "admin", or "super"
- `status`: User account status - "unverified", "active", or "banned"

### Normalized `req.user` Object

After successful authentication, the request object includes a normalized user object:

```javascript
{
  userId: "123",           // string (from sub or id claim)
  role: "admin",           // "user" | "admin" | "super" (lowercase)
  status: "active",        // "unverified" | "active" | "banned" (lowercase)
  verified: true,          // boolean (true if status !== "unverified")
  // ... all other JWT claims
}
```

### Authentication Errors (401)

- Missing Bearer token
- Token expired
- Invalid token
- Token missing sub/id claim
- Invalid status claim

### Authorization Errors (403)

- User is banned (even with valid token)
- Insufficient permissions (non-admin accessing admin endpoints)

## RabbitMQ (Message Queue)

The service acts as a producer for contact-created events:

- **Exchange**: `contact_exchange` (type: topic, durable)
- **Routing key**: `contact.created`
- **Payload** (JSON): `messageId`, `subject`, `email`, `message`, `dateCreated`
- **Flow**: Events are published only after a successful MongoDB save. The service uses a singleton connection and a dedicated channel.
- **Resilience**: If RabbitMQ is down at startup or publish fails, the service continues; contact messages are still stored in MongoDB. MQ publish failures are logged.

## Project Structure

```
forum-message-service/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection configuration
│   │   └── rabbitmq.js         # RabbitMQ singleton connection and channel
│   ├── models/
│   │   └── message.model.js     # Mongoose Message schema
│   ├── controllers/
│   │   ├── health.controller.js   # Health check controller
│   │   └── message.controller.js # Contact us and GET messages controllers
│   ├── services/
│   │   └── message.service.js   # Message business logic and MQ publish
│   ├── routes/
│   │   └── index.js             # Route aggregator
│   ├── middlewares/
│   │   ├── errorHandler.js      # Global error handler (AOP)
│   │   ├── validateContactMessage.js # Contact us validation
│   │   ├── validateStatusUpdate.js   # Status update validation
│   │   ├── authenticateJWT.js   # JWT authentication middleware
│   │   ├── requireAdmin.js      # Admin role authorization
│   │   └── checkAdminPermission.js   # Deprecated: header-based auth (kept for reference)
│   ├── utils/
│   │   ├── customErrors.js      # Custom exception classes
│   │   └── messagePublisher.js  # RabbitMQ publish helper
│   └── app.js                   # Express app setup
├── index.js                     # Service entry point
├── .env.template                # Environment template
├── .gitignore                   # Git ignore configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## Message Entity Schema

The Message model includes the following fields:

- `messageId`: Auto-generated MongoDB ObjectId
- `userId`: Number (optional, nullable)
- `email`: String (required)
- `subject`: String (required, max 200 characters)
- `message`: String (required, max 5000 characters)
- `dateCreated`: Date (defaults to current timestamp)
- `status`: String enum ['Open', 'Closed'] (defaults to 'Open')

## Error Handling

The service implements a global error handler (AOP) that handles:

- `DatabaseConnectionError`: Database connection failures (503)
- `ValidationError`: Input validation errors (400)
- `NotFoundError`: Resource not found errors (404)
- `UnauthorizedError`: Missing or invalid authentication, expired tokens, invalid JWT (401)
- `ForbiddenError`: Insufficient permissions, banned users (403)
- JWT errors: `TokenExpiredError`, `JsonWebTokenError`
- Mongoose validation errors
- MongoDB duplicate key errors
- JSON parse errors (SyntaxError)
- Unexpected server errors (500)

All errors use the unified format `{ error, message, status }` and are logged without exposing sensitive information.

## Development Workflow

1. Make changes to the codebase
2. The service will automatically restart in development mode (if using `npm run dev`)
3. Test endpoints using tools like Postman or curl
4. Check logs for any errors or connection issues

## Security

- **Contact Us**: Public endpoint; no JWT authentication required.
- **Get Messages**: Requires JWT Bearer token with admin or super role.
- **Update Message Status**: Requires JWT Bearer token with admin or super role.
- **JWT Validation**: All protected endpoints validate JWT signature, expiration, and required claims.
- **Role-Based Access**: Admin endpoints use `authenticateJWT` + `requireAdmin` middleware chain.
- **Banned Users**: Users with `status: "banned"` are blocked even with valid tokens.
- **JWT_SECRET**: Must be strong (minimum 32 characters) and kept secure.

## Future Enhancements

- Pagination and filtering for GET /messages
- Health check includes RabbitMQ connection status
- Dead letter queue for failed MQ publishes
- Custom decorators for login_required, permission_checking, and logging
- Token refresh mechanism
- Rate limiting for authentication endpoints