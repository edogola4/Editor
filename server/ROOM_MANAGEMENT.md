# Room Management System

This document provides an overview of the room management system implemented in the collaborative code editor.

## Features

- **Room Creation & Management**
  - Create, read, update, and delete rooms
  - Set room privacy (public/private)
  - Password protection for private rooms
  - Room settings customization

- **User Roles & Permissions**
  - Owner: Full control over the room
  - Editor: Can edit room content and invite users
  - Viewer: Can only view the room content

- **Invitation System**
  - Email invitations with unique tokens
  - Role-based invitations
  - Expiration for invitations
  - Resend/cancel invitations

- **Activity Tracking**
  - Log all room activities
  - Track user joins/leaves
  - Monitor permission changes
  - Room settings updates

- **Statistics & Analytics**
  - Track active users
  - Monitor session duration
  - Count total edits
  - Track room activity over time

## API Endpoints

### Room Management
- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:id` - Get room details
- `PUT /api/rooms/:id` - Update room settings
- `DELETE /api/rooms/:id` - Delete a room
- `GET /api/rooms` - List rooms with pagination

### Member Management
- `GET /api/rooms/:id/members` - List room members
- `PUT /api/rooms/:id/members/:userId/role` - Update member role
- `DELETE /api/rooms/:id/members/:userId` - Remove member from room

### Invitations
- `POST /api/rooms/:id/invite` - Invite a user to the room
- `POST /api/rooms/invite/accept/:token` - Accept a room invitation

### Activities
- `GET /api/rooms/:id/activities` - Get room activities

## Database Schema

### Rooms Table
- `id` - UUID (Primary Key)
- `name` - String
- `description` - Text (nullable)
- `isPrivate` - Boolean
- `password` - String (hashed, nullable)
- `maxUsers` - Integer
- `settings` - JSON
- `ownerId` - UUID (Foreign Key to Users)
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Room Members Table
- `id` - UUID (Primary Key)
- `roomId` - UUID (Foreign Key to Rooms)
- `userId` - UUID (Foreign Key to Users)
- `role` - Enum ('owner', 'editor', 'viewer')
- `joinedAt` - Timestamp
- `lastSeen` - Timestamp
- `isOnline` - Boolean

### Room Invitations Table
- `id` - UUID (Primary Key)
- `roomId` - UUID (Foreign Key to Rooms)
- `email` - String
- `role` - Enum ('editor', 'viewer')
- `token` - String (unique)
- `status` - Enum ('pending', 'accepted', 'expired', 'revoked')
- `invitedBy` - UUID (Foreign Key to Users)
- `expiresAt` - Timestamp
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Room Activities Table
- `id` - UUID (Primary Key)
- `roomId` - UUID (Foreign Key to Rooms)
- `userId` - UUID (Foreign Key to Users, nullable)
- `activityType` - Enum (various activity types)
- `metadata` - JSON
- `ipAddress` - String (nullable)
- `userAgent` - String (nullable)
- `createdAt` - Timestamp

## Setup & Configuration

1. **Environment Variables**

Create a `.env` file in the server root with the following variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=collaborative_editor
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Email (for invitations)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
EMAIL_FROM="Your App <noreply@example.com>"

# App
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:3001
```

2. **Database Migrations**

Run the database migrations to create the required tables:

```bash
npm run db:migrate
```

3. **Generate TypeScript Types**

Generate TypeScript types from your database models:

```bash
npm run generate:types
```

4. **Start the Server**

Start the development server:

```bash
npm run dev
```

## Usage Examples

### Creating a Room

```http
POST /api/rooms
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "My First Room",
  "description": "A room for testing",
  "isPrivate": true,
  "password": "securepassword",
  "maxUsers": 10,
  "settings": {
    "allowGuests": false,
    "requireApproval": true
  }
}
```

### Inviting a User to a Room

```http
POST /api/rooms/:roomId/invite
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "user@example.com",
  "role": "editor"
}
```

### Accepting an Invitation

```http
POST /api/rooms/invite/accept/:token
Authorization: Bearer <token>
```

## Testing

Run the test suite:

```bash
npm test
```

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Rate limiting is implemented for sensitive endpoints
- Input validation is performed on all API endpoints
- SQL injection is prevented by using parameterized queries
- CSRF protection is implemented for web routes

## Error Handling

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
