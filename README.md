# Forum Message Service

Message service for the forum application that handles contact us functionality, connects to the message database for storing messages, and publishes MQ events after contact us creation.

## Features

- Contact Admin Page functionality
- Message Management for admins
- MongoDB Atlas integration
- Global error handling (AOP)
- Health check endpoint
- JWT authentication ready (to be implemented)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account and cluster

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
   - Update `.env` with your MongoDB Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/message-db?retryWrites=true&w=majority
   PORT=5002
   ```

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
**GET** `/health`

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

## Project Structure

```
forum-message-service/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection configuration
│   ├── models/
│   │   └── message.model.js     # Mongoose Message schema
│   ├── controllers/
│   │   └── health.controller.js # Health check controller
│   ├── routes/
│   │   └── index.js             # Route aggregator
│   ├── middlewares/
│   │   └── errorHandler.js      # Global error handler (AOP)
│   ├── utils/
│   │   └── customErrors.js      # Custom exception classes
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
- Mongoose validation errors
- MongoDB duplicate key errors
- Unexpected server errors (500)

All errors are logged without exposing sensitive information.

## Development Workflow

1. Make changes to the codebase
2. The service will automatically restart in development mode (if using `npm run dev`)
3. Test endpoints using tools like Postman or curl
4. Check logs for any errors or connection issues

## Security

- JWT authentication middleware will be implemented for protecting endpoints
- Only login, registration, and contact us endpoints will be publicly accessible
- Admin endpoints will require appropriate authorization

## Future Enhancements

- Contact-us POST endpoint
- Admin message management endpoints
- Message Queue (MQ) producer integration
- JWT authentication and authorization middleware
- Custom decorators for login_required, permission_checking, and logging
