# API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Authentication Endpoints

### Register
Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": false,
      "createdAt": "2025-09-30T10:00:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

---

### Login
Authenticate and get access tokens.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

---

### Logout
Invalidate current session.

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

---

### Refresh Token
Get new access token using refresh token.

**Endpoint:** `POST /auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "new_jwt_token",
      "refreshToken": "new_jwt_refresh_token"
    }
  }
}
```

---

## Document Endpoints

### Create Document
Create a new document.

**Endpoint:** `POST /documents`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "name": "My Project",
  "content": "// Initial code",
  "language": "javascript"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Project",
    "content": "// Initial code",
    "language": "javascript",
    "version": 0,
    "ownerId": "user_uuid",
    "createdAt": "2025-09-30T10:00:00.000Z",
    "updatedAt": "2025-09-30T10:00:00.000Z"
  }
}
```

---

### Get User Documents
Get all documents owned by the authenticated user.

**Endpoint:** `GET /documents`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Project",
      "language": "javascript",
      "version": 5,
      "createdAt": "2025-09-30T10:00:00.000Z",
      "updatedAt": "2025-09-30T11:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Get Document
Get a specific document by ID.

**Endpoint:** `GET /documents/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Project",
    "content": "// Code content",
    "language": "javascript",
    "version": 5,
    "ownerId": "user_uuid",
    "isPublic": false,
    "createdAt": "2025-09-30T10:00:00.000Z",
    "updatedAt": "2025-09-30T11:00:00.000Z"
  }
}
```

---

### Update Document
Update document metadata.

**Endpoint:** `PUT /documents/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "language": "typescript",
  "isPublic": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Project Name",
    "language": "typescript",
    "isPublic": true,
    "updatedAt": "2025-09-30T12:00:00.000Z"
  }
}
```

---

### Delete Document
Delete a document.

**Endpoint:** `DELETE /documents/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

### Get Document History
Get version history of a document.

**Endpoint:** `GET /documents/:id/history?limit=50`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "version": 5,
      "operation": {
        "type": "insert",
        "position": 10,
        "text": "new code"
      },
      "userId": "user_uuid",
      "createdAt": "2025-09-30T11:00:00.000Z"
    }
  ],
  "count": 5
}
```

---

### Fork Document
Create a copy of a document.

**Endpoint:** `POST /documents/:id/fork`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "new_uuid",
    "name": "My Project (Fork)",
    "content": "// Copied content",
    "language": "javascript",
    "version": 0,
    "ownerId": "your_user_uuid",
    "createdAt": "2025-09-30T12:00:00.000Z"
  }
}
```

---

### Share Document
Make document public or private.

**Endpoint:** `PATCH /documents/:id/share`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "isPublic": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isPublic": true
  },
  "message": "Document is now public"
}
```

---

## Room Endpoints

### Create Room
Create a new collaboration room.

**Endpoint:** `POST /rooms`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "name": "Team Coding Session",
  "description": "Working on the new feature",
  "isPrivate": false,
  "maxUsers": 10
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Team Coding Session",
    "description": "Working on the new feature",
    "isPrivate": false,
    "maxUsers": 10,
    "ownerId": "user_uuid",
    "status": "active",
    "settings": {
      "allowGuests": true,
      "enableChat": true,
      "language": "javascript",
      "theme": "vs-dark"
    },
    "createdAt": "2025-09-30T10:00:00.000Z"
  }
}
```

---

### Get Rooms
Get list of available rooms.

**Endpoint:** `GET /rooms?status=active&limit=50&offset=0`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Team Coding Session",
      "description": "Working on the new feature",
      "isPrivate": false,
      "maxUsers": 10,
      "ownerId": "user_uuid",
      "status": "active",
      "createdAt": "2025-09-30T10:00:00.000Z",
      "updatedAt": "2025-09-30T11:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Get Room
Get specific room details.

**Endpoint:** `GET /rooms/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Team Coding Session",
    "description": "Working on the new feature",
    "isPrivate": false,
    "maxUsers": 10,
    "ownerId": "user_uuid",
    "status": "active",
    "settings": {
      "allowGuests": true,
      "enableChat": true,
      "language": "javascript"
    },
    "createdAt": "2025-09-30T10:00:00.000Z",
    "updatedAt": "2025-09-30T11:00:00.000Z"
  }
}
```

---

### Update Room
Update room settings.

**Endpoint:** `PUT /rooms/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "name": "Updated Room Name",
  "maxUsers": 20,
  "settings": {
    "enableChat": false
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Room Name",
    "maxUsers": 20,
    "settings": {
      "enableChat": false
    },
    "updatedAt": "2025-09-30T12:00:00.000Z"
  }
}
```

---

### Delete Room
Delete a room.

**Endpoint:** `DELETE /rooms/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Room deleted successfully"
}
```

---

### Get Room Users
Get active users in a room.

**Endpoint:** `GET /rooms/:id/users`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "user_uuid",
      "username": "johndoe",
      "color": "#FF5733"
    }
  ],
  "count": 1
}
```

---

### Join Room
Verify access to join a room.

**Endpoint:** `POST /rooms/:id/join`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body (for private rooms):**
```json
{
  "password": "room_password"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "You can join this room",
  "data": {
    "roomId": "uuid",
    "name": "Team Coding Session",
    "settings": {
      "language": "javascript",
      "theme": "vs-dark"
    }
  }
}
```

---

## User Endpoints

### Get Profile
Get current user profile.

**Endpoint:** `GET /users/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "avatarUrl": null,
    "createdAt": "2025-09-30T10:00:00.000Z"
  }
}
```

---

### Update Profile
Update user profile.

**Endpoint:** `PUT /users/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "username": "john_updated",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "john_updated",
    "avatarUrl": "https://example.com/avatar.jpg",
    "updatedAt": "2025-09-30T12:00:00.000Z"
  }
}
```

---

## Health Check

### Server Health
Check server status and metrics.

**Endpoint:** `GET /api/health`

**Response:** `200 OK`
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2025-09-30T12:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": 150,
    "total": 512
  },
  "connections": 5,
  "documents": "active"
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes
- **API endpoints**: 100 requests per 15 minutes
- **Socket connections**: No limit (handled by connection management)

---

## WebSocket Events

See `SOCKET_IMPLEMENTATION.md` for WebSocket event documentation.
