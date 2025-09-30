# Quick Start - Create Admin User

The database tables don't exist yet. Here's the easiest way to get started:

## Step 1: Start the Server

The server will automatically create the database tables when it starts:

```bash
npm run dev
```

Wait for the message: `✓ Database synchronized successfully`

## Step 2: Register a User

Open a new terminal and register a user:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin123!@#"
  }'
```

## Step 3: Promote to Admin (Dev Mode Only)

```bash
curl -X POST http://localhost:5000/api/dev/promote-user-to-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com"
  }'
```

## Step 4: Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!@#"
  }' \
  -c cookies.txt
```

## Step 5: Test Admin Access

```bash
curl -X GET http://localhost:5000/api/users \
  -b cookies.txt
```

You should now see a list of all users!

## Alternative: Use the Seed Script After Server Starts

Once the server has created the tables (Step 1), you can stop it and run:

```bash
npm run db:seed
```

This will create the admin user and test users automatically.

## Default Credentials

After seeding:
- **Email**: `admin@example.com`
- **Password**: `Admin123!@#`
- **Role**: `admin`

## Troubleshooting

### "relation users does not exist"
- Make sure you've started the server at least once to create tables
- Or manually create tables by running the server in dev mode

### "Development routes are not available"
- Make sure `NODE_ENV` is not set to `production`
- Check with: `echo $NODE_ENV`

### Can't access admin endpoints
- Make sure you're logged in
- Check that cookies are being sent
- Verify the user has admin role: `curl http://localhost:5000/api/dev/users`
