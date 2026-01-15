# Admin Guide

This guide explains how to use the admin dashboard to manage your webring.

## Accessing the Admin Dashboard

1. Navigate to `/admin` on your webring frontend (e.g., `http://localhost:5173/admin`)
2. Enter your admin credentials
3. Click "Login"

Your admin credentials are configured in the `.env` file:
- `ADMIN_USERNAME` - Your admin username
- `ADMIN_PASSWORD_HASH` - Bcrypt hash of your password

## Dashboard Overview

After logging in, you'll see two tabs:

- **Applications** - Pending and processed membership applications
- **Members** - Current webring members

## Managing Applications

### Viewing Applications

The Applications tab shows all submitted applications with:
- Site name and URL
- Description
- Contact email
- Submission date
- Current status (pending, approved, rejected)

Pending applications are highlighted and show action buttons.

### Approving an Application

1. Review the application details
2. Click the site URL to verify it exists and meets your criteria
3. Click **Approve**

When approved:
- The site is added to the webring as a new member
- The application status changes to "approved"
- A unique slug is generated from the site name
- The site appears in the members list

### Rejecting an Application

1. Review the application
2. Click **Reject**

When rejected:
- The application status changes to "rejected"
- The site is NOT added to the webring
- The application remains visible in the list

### Deleting Applications

To remove an application from the list entirely:

1. Find the application (approved or rejected)
2. Click **Delete**
3. Confirm the deletion

This permanently removes the application record.

## Managing Members

### Viewing Members

The Members tab shows all current webring participants with:
- Site name and slug
- URL
- Description
- Contact email
- Join date

### Removing a Member

To remove a site from the webring:

1. Go to the Members tab
2. Find the member to remove
3. Click **Remove**
4. Confirm the removal

The site will be immediately removed from the webring and will no longer appear in navigation.

## Application Review Criteria

Consider these factors when reviewing applications:

### Approve if:
- Site is accessible and loads properly
- Content is appropriate for your webring's theme
- Site has the webring widget installed (or commits to installing it)
- Contact email appears valid

### Reject if:
- Site doesn't exist or returns errors
- Content is inappropriate, illegal, or violates your guidelines
- Site appears to be spam or malicious
- URL is a duplicate of an existing member

## Best Practices

### Regular Review
- Check for new applications regularly
- Don't leave applications pending too long
- Consider setting up email notifications (custom implementation)

### Communication
- Consider emailing applicants about approval/rejection
- Provide feedback on rejected applications
- Welcome new members

### Quality Control
- Periodically verify all member sites are still active
- Remove sites that have gone offline
- Update member information if URLs change

## Session Management

### Token Expiration

Your login session expires after the time configured in `ADMIN_JWT_EXPIRES` (default: 24 hours).

When your session expires:
- You'll be automatically logged out
- Any pending actions will fail
- Simply log in again to continue

### Logging Out

Click **Logout** in the top-right corner to end your session. This:
- Removes your token from the browser
- Requires re-authentication to access admin features

## Troubleshooting

### "Connection failed" on login

The backend API is not running or not accessible.

**Solutions:**
1. Ensure the backend is running (`make dev` or `cd backend && npm run dev`)
2. Check that `VITE_API_URL` in `frontend/.env` matches the backend URL
3. Check for CORS errors in browser console

### "Invalid credentials"

Username or password is incorrect.

**Solutions:**
1. Verify `ADMIN_USERNAME` in `.env`
2. Regenerate password hash: `make hash-password PASSWORD=yourpassword`
3. Update `ADMIN_PASSWORD_HASH` in `.env`
4. Restart the backend

### "Token expired"

Your session has expired.

**Solution:** Log in again.

### Changes not appearing

The data cache may not have updated.

**Solutions:**
1. Wait 60 seconds (cache timeout)
2. Use the API to invalidate cache: `POST /api/admin/cache/invalidate`
3. Restart the backend server

### "Failed to load data"

Error fetching data from storage.

**Solutions:**
1. If using GitHub: Check your GitHub token is valid
2. If using local files: Ensure `data/` directory has correct permissions
3. Check backend logs for specific errors

## Security Recommendations

### Strong Passwords

Use a strong admin password:
- At least 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Not used elsewhere

### Secure JWT Secret

Generate a proper secret:
```bash
openssl rand -hex 32
```

### HTTPS in Production

Always use HTTPS in production to protect:
- Login credentials
- JWT tokens
- Session data

### Regular Token Rotation

Periodically change your `ADMIN_JWT_SECRET` to invalidate all existing sessions.

### Monitor Access

Keep track of:
- Who has admin credentials
- When credentials were last changed
- Any suspicious activity
