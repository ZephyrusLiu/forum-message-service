# Forum Message Service

Message service for the forum application that handles contact us functionality, connects to the message database for storing messages, and publishes MQ events after contact us creation.

## Features

- Contact Admin Page functionality
- Message Management for admins
- MongoDB Atlas integration
- RabbitMQ (CloudAMQP) producer for contact.created events
- Global error handling (AOP)
- Health check endpoint
- Admin authorization via X-User-Type header

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
   ```
   - `RABBITMQ_URI`: CloudAMQP or RabbitMQ connection string. If omitted or invalid, the service starts without MQ; contact messages are still saved to MongoDB.

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
**POST** `/message-service/contactus`

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
**GET** `/message-service/messages`

Returns all contact messages. Requires admin authorization via `X-User-Type` header (Admin or Super Admin). Used by the Message Management page.

**Required Headers:**
- `X-User-Type`: `Admin` or `Super Admin` (case-insensitive)

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
- `401 Unauthorized`: Missing or invalid `X-User-Type` header
- `403 Forbidden`: User type is not Admin or Super Admin

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
│   │   └── checkAdminPermission.js   # Admin authorization
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
- `UnauthorizedError`: Missing or invalid authentication (401)
- `ForbiddenError`: Insufficient permissions (403)
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

- **Contact Us**: Public; no JWT required.
- **Get Messages**: Requires `X-User-Type: Admin` or `Super Admin` (forwarded by API Gateway from JWT claims).
- **Admin endpoints**: Protected by `checkAdminPermission` middleware using `X-User-Type` header.

## Future Enhancements

- PATCH /messages/:id for status updates (Open/Closed)
- Pagination and filtering for GET /messages
- Health check includes RabbitMQ connection status
- Dead letter queue for failed MQ publishes
- Custom decorators for login_required, permission_checking, and logging
