# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Collaborative Code Editor.

## Table of Contents
- [Common Issues](#common-issues)
- [Installation Problems](#installation-problems)
- [Runtime Errors](#runtime-errors)
- [Database Issues](#database-issues)
- [WebSocket Problems](#websocket-problems)
- [Performance Issues](#performance-issues)
- [Deployment Problems](#deployment-problems)
- [Debugging Tips](#debugging-tips)
- [Getting Help](#getting-help)

## Common Issues

### 1. Editor Not Loading

**Symptoms**:
- Blank screen in the editor
- Console errors related to WebSocket connection
- "Loading..." message persists

**Solutions**:
1. Check browser console for errors (F12 > Console)
2. Verify WebSocket connection:
   ```javascript
   // In browser console
   const ws = new WebSocket('wss://your-domain.com/socket.io');
   ws.onopen = () => console.log('Connected!');
   ws.onerror = (e) => console.error('Error:', e);
   ```
3. Ensure CORS is properly configured on the server
4. Check if the backend service is running

### 2. Authentication Issues

**Symptoms**:
- 401 Unauthorized errors
- Login not persisting
- Session timeouts too quickly

**Solutions**:
1. Check JWT token in browser storage:
   ```javascript
   // In browser console
   console.log('Token:', document.cookie.match(/token=([^;]+)/)?.[1]);
   ```
2. Verify token expiration:
   ```javascript
   const token = 'your.jwt.token';
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Expires:', new Date(payload.exp * 1000));
   ```
3. Check server logs for authentication errors
4. Verify JWT_SECRET matches between services

## Installation Problems

### 1. Dependency Installation Fails

**Error**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions**:
1. Clear npm cache:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Try with a different Node.js version (use nvm)
3. Check for version conflicts in package.json

### 2. Build Failures

**Error**:
```
Module not found: Can't resolve 'module-name'
```

**Solutions**:
1. Check for typos in import statements
2. Verify the package is listed in package.json
3. Try reinstalling the package:
   ```bash
   npm uninstall package-name
   npm install package-name@latest
   ```

## Runtime Errors

### 1. Maximum Call Stack Size Exceeded

**Error**:
```
RangeError: Maximum call stack size exceeded
```

**Solutions**:
1. Look for recursive function calls
2. Check for circular dependencies
3. Use tail call optimization where possible

### 2. Memory Leaks

**Symptoms**:
- Application becomes slower over time
- High memory usage in browser/Node.js

**Debugging**:
1. Use Chrome DevTools Memory tab
2. Take heap snapshots and compare
3. Look for detached DOM elements

**Common Causes**:
- Event listeners not removed
- Large global variables
- Circular references

## Database Issues

### 1. Connection Timeouts

**Error**:
```
SequelizeConnectionError: Connection terminated unexpectedly
```

**Solutions**:
1. Check database server status
2. Verify connection string
3. Increase timeout settings:
   ```javascript
   new Sequelize(database, username, password, {
     dialect: 'postgres',
     pool: {
       max: 10,
       min: 0,
       acquire: 30000,
       idle: 10000
     }
   });
   ```

### 2. Slow Queries

**Debugging**:
1. Enable slow query logging in PostgreSQL:
   ```sql
   ALTER SYSTEM SET log_min_duration_statement = 1000;
   SELECT pg_reload_conf();
   ```
2. Check for missing indexes:
   ```sql
   SELECT * FROM pg_stat_user_tables WHERE seq_scan > 0;
   ```
3. Use EXPLAIN ANALYZE for slow queries

## WebSocket Problems

### 1. Connection Drops

**Symptoms**:
- Intermittent disconnections
- "Reconnecting..." messages

**Solutions**:
1. Check network stability
2. Implement reconnection logic:
   ```typescript
   const socket = io({
     reconnection: true,
     reconnectionAttempts: Infinity,
     reconnectionDelay: 1000,
     reconnectionDelayMax: 5000,
     timeout: 20000
   });
   ```
3. Check server WebSocket timeout settings

### 2. High Latency

**Debugging**:
1. Measure WebSocket latency:
   ```javascript
   const start = Date.now();
   socket.emit('ping', () => {
     console.log('Latency:', Date.now() - start, 'ms');
   });
   ```
2. Check for network bottlenecks
3. Consider using a WebSocket proxy like Socket.IO with Redis

## Performance Issues

### 1. Slow Editor Response

**Debugging**:
1. Profile with Chrome DevTools
2. Check for expensive re-renders
3. Use React.memo for expensive components

### 2. High CPU Usage

**Solutions**:
1. Throttle or debounce event handlers
2. Use Web Workers for heavy computations
3. Optimize state updates

## Deployment Problems

### 1. Docker Container Fails to Start

**Error**:
```
Error: bind: address already in use
```

**Solutions**:
1. Find and kill the process using the port:
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```
2. Or change the port mapping in docker-compose.yml

### 2. Environment Variables Missing

**Error**:
```
Error: Missing required environment variable: DATABASE_URL
```

**Solutions**:
1. Check .env file exists and is properly formatted
2. Verify environment variables in production
3. Check docker-compose environment section

## Debugging Tips

### 1. Enable Debug Logging

**Backend**:
```bash
DEBUG=app:*,socket.io:* npm start
```

**Frontend**:
```javascript
localStorage.debug = 'app:*';
```

### 2. Network Inspection

1. Use Chrome DevTools Network tab
2. Filter by WS (WebSocket) and XHR requests
3. Check response headers and payloads

### 3. Database Inspection

```bash
# Connect to PostgreSQL
psql -U username -d database_name

# Show running queries
SELECT * FROM pg_stat_activity;

# Show table sizes
\dt+
```

## Getting Help

If you can't resolve an issue:

1. Check the [GitHub Issues](https://github.com/your-username/collaborative-code-editor/issues)
2. Search the documentation
3. Provide these details when asking for help:
   - Error messages
   - Steps to reproduce
   - Environment details (OS, Node.js version, browser)
   - Relevant logs

## Common Error Codes

| Code | Description | Possible Solution |
|------|-------------|-------------------|
| 400 | Bad Request | Check request payload |
| 401 | Unauthorized | Verify authentication |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Verify endpoint URL |
| 429 | Too Many Requests | Implement rate limiting |
| 500 | Internal Server Error | Check server logs |
| 502 | Bad Gateway | Check proxy/load balancer |
| 503 | Service Unavailable | Check service status |
| 504 | Gateway Timeout | Increase timeout settings |

## Performance Checklist

- [ ] Database queries optimized
- [ ] Assets minified and compressed
- [ ] Caching enabled
- [ ] CDN configured
- [ ] Lazy loading implemented
- [ ] Code splitting in place

## Security Checklist

- [ ] Input validation
- [ ] Output encoding
- [ ] Authentication checks
- [ ] Authorization checks
- [ ] Rate limiting
- [ ] Security headers
- [ ] CORS configured
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] SQL injection prevention
