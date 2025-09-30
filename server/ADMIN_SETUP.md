# Admin User Setup Guide

This guide explains how to create and manage admin users for testing and development.

## Quick Start

### Option 1: Seed Database (Recommended)

Run the seed script to create an admin user and test users:

```bash
npm run db:seed
```

This will create:
- **Admin User**
  - Email: `admin@example.com`
  - Password: `Admin123!@#`
  - Role: `admin`

- **Test Users** (3 regular users)
  - Email: `user1@example.com`, `user2@example.com`, `user3@example.com`
  - Password: `User123!@#`
  - Role: `user`

### Option 2: Use Development API Endpoints

The server includes development-only endpoints that are **only available when `NODE_ENV !== 'production'`**.

#### 1. Register a New User

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "myuser",
  "email": "myuser@example.com",
  "password": "MyPassword123!@#"
}
```

#### 2. Login to Get Auth Cookies

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "myuser@example.com",
  "password": "MyPassword123!@#"
}
```

#### 3. Promote Yourself to Admin

```bash
POST http://localhost:5000/api/dev/promote-to-admin
Cookie: accessToken=<your-token-from-login>
```

Or promote any user by email (no auth required):

```bash
POST http://localhost:5000/api/dev/promote-user-to-admin
Content-Type: application/json

{
  "email": "myuser@example.com"
}
```

### Option 3: Direct Database Update

If you prefer to manually update the database:

```sql
-- Connect to your database
psql -U your_username -d collaborative_editor

-- Update user role to admin
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Development Endpoints

All development endpoints are available at `/api/dev/*` and are **only enabled in development mode**.

### Available Dev Endpoints

1. **Promote Current User to Admin**
   ```
   POST /api/dev/promote-to-admin
   ```
   Requires authentication. Promotes the currently logged-in user to admin.

2. **Promote Any User to Admin**
   ```
   POST /api/dev/promote-user-to-admin
   Body: { "email": "user@example.com" }
   ```
   No authentication required. Promotes any user by email.

3. **List All Users**
   ```
   GET /api/dev/users
   ```
   No authentication required. Lists all users with their roles.

4. **Reset Database** (⚠️ DANGEROUS)
   ```
   POST /api/dev/reset-database
   Body: { "confirm": "YES_DELETE_ALL_DATA" }
   ```
   Drops all tables and recreates them. **All data will be lost!**

## Testing Admin Access

Once you have an admin user, you can test admin-only endpoints:

### Get All Users (Admin Only)

```bash
GET http://localhost:5000/api/users
Cookie: accessToken=<your-admin-token>
```

### Get User by ID (Admin Only)

```bash
GET http://localhost:5000/api/users/:userId
Cookie: accessToken=<your-admin-token>
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Development Routes**: The `/api/dev` routes are **automatically disabled in production** (when `NODE_ENV=production`).

2. **Default Credentials**: Change the default admin password immediately in production:
   ```bash
   PUT http://localhost:5000/api/users/profile
   Body: {
     "currentPassword": "Admin123!@#",
     "newPassword": "YourSecurePassword123!@#"
   }
   ```

3. **Seed Data**: Never use seed data in production. The seed script should only be run in development/testing environments.

4. **Environment Variables**: Always set `NODE_ENV=production` in production to disable development features.

## Troubleshooting

### "Development routes are not available in production"

Make sure `NODE_ENV` is not set to `production`:

```bash
# Check your environment
echo $NODE_ENV

# Unset if needed
unset NODE_ENV

# Or set to development
export NODE_ENV=development
```

### "User already exists"

If you run the seed script multiple times, it will skip existing users. To reset:

```bash
# Option 1: Use the dev endpoint
POST http://localhost:5000/api/dev/reset-database
Body: { "confirm": "YES_DELETE_ALL_DATA" }

# Option 2: Drop and recreate tables manually
npm run db:rollback
npm run db:migrate
npm run db:seed
```

### Can't Access Admin Endpoints

1. Make sure you're logged in and have the admin role
2. Check that cookies are being sent with requests
3. Verify your token hasn't expired (refresh if needed)

```bash
POST http://localhost:5000/api/auth/refresh-token
Cookie: refreshToken=<your-refresh-token>
```

## Next Steps

After setting up your admin user:

1. ✅ Test the admin endpoints
2. ✅ Create additional users for testing
3. ✅ Test the authentication flow
4. ✅ Explore the API documentation at `/api`

For more information, see:
- [API Documentation](../API_DOCUMENTATION.md)
- [Complete Implementation Guide](../COMPLETE_IMPLEMENTATION_GUIDE.md)
