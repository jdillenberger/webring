# API Reference

The Webring API is a REST API that provides endpoints for navigation, member management, and applications.

**Base URL:** `http://localhost:3000` (development) or your configured production URL.

## Public Endpoints

These endpoints are accessible without authentication.

---

### List Participants

Returns all webring members.

```
GET /api/participants
```

**Response:**
```json
[
  {
    "slug": "retro-computing",
    "name": "Retro Computing Blog",
    "url": "https://retrocomputing.example.com",
    "description": "A blog about vintage computers",
    "contactEmail": "owner@example.com",
    "approvedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### Get Single Participant

Returns a specific member by slug.

```
GET /api/participants/:slug
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `slug` | string | The participant's unique identifier |

**Response (200):**
```json
{
  "slug": "retro-computing",
  "name": "Retro Computing Blog",
  "url": "https://retrocomputing.example.com",
  "description": "A blog about vintage computers",
  "contactEmail": "owner@example.com",
  "approvedAt": "2024-01-15T10:30:00.000Z"
}
```

**Response (404):**
```json
{
  "error": "Participant not found"
}
```

---

### Navigate to Next Site

Redirects to the next site in the webring.

```
GET /api/next/:slug?
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `slug` | string | (Optional) Current site's slug |

**Behavior:**
- If `slug` is provided, redirects to the next site after that slug
- If `slug` is omitted, uses the `Referer` header to identify current site
- If neither works, redirects to the first site in the ring

**Response:** `302 Redirect` to the next site's URL

---

### Navigate to Previous Site

Redirects to the previous site in the webring.

```
GET /api/prev/:slug?
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `slug` | string | (Optional) Current site's slug |

**Behavior:**
- If `slug` is provided, redirects to the site before that slug
- If `slug` is omitted, uses the `Referer` header to identify current site
- If neither works, redirects to the last site in the ring

**Response:** `302 Redirect` to the previous site's URL

---

### Navigate to Random Site

Redirects to a random site in the webring.

```
GET /api/random/:slug?
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `slug` | string | (Optional) Current site's slug (excluded from random selection) |

**Behavior:**
- If `slug` is provided, that site is excluded from random selection
- Redirects to a randomly selected site

**Response:** `302 Redirect` to a random site's URL

---

### Get Navigation Info

Returns navigation links as JSON instead of redirecting.

```
GET /api/navigate/:slug?
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `slug` | string | (Optional) Current site's slug |

**Response (200):**
```json
{
  "current": {
    "slug": "retro-computing",
    "name": "Retro Computing Blog",
    "url": "https://retrocomputing.example.com"
  },
  "prev": {
    "slug": "pixel-art",
    "name": "Pixel Art Gallery",
    "url": "https://pixelart.example.com"
  },
  "next": {
    "slug": "indie-games",
    "name": "Indie Games Corner",
    "url": "https://indiegames.example.com"
  },
  "random": {
    "slug": "digital-garden",
    "name": "Digital Garden",
    "url": "https://garden.example.com"
  }
}
```

**Response (404):**
```json
{
  "error": "Participant not found",
  "message": "Provide a valid slug or ensure the Referer header matches a participant URL"
}
```

---

### Get Webring Stats

Returns statistics about the webring.

```
GET /api/stats
```

**Response:**
```json
{
  "totalMembers": 5,
  "newestMember": {
    "slug": "digital-garden",
    "name": "Digital Garden",
    "url": "https://garden.example.com",
    "approvedAt": "2024-02-01T14:00:00.000Z"
  }
}
```

---

### Submit Application

Submit an application to join the webring.

```
POST /api/applications
```

**Request Body:**
```json
{
  "name": "My Website",
  "url": "https://mywebsite.com",
  "description": "A personal blog about technology and creativity",
  "contactEmail": "me@mywebsite.com"
}
```

**Validation Rules:**
| Field | Requirements |
|-------|--------------|
| `name` | Required, minimum 2 characters |
| `url` | Required, valid HTTP/HTTPS URL |
| `description` | Required, minimum 10 characters |
| `contactEmail` | Required, valid email format |

**Response (201):**
```json
{
  "message": "Application submitted successfully",
  "application": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Website",
    "status": "pending"
  }
}
```

**Response (400 - Validation Error):**
```json
{
  "error": "Validation failed",
  "details": [
    "Name is required (minimum 2 characters)",
    "Valid URL is required (http:// or https://)"
  ]
}
```

**Response (409 - Duplicate):**
```json
{
  "error": "This site is already a member of the webring"
}
```

---

### Check Application Status

Check the status of a submitted application.

```
GET /api/applications/:id
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | string | The application UUID |

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Website",
  "status": "pending",
  "submittedAt": "2024-01-20T14:00:00.000Z"
}
```

**Possible status values:**
- `pending` - Awaiting review
- `approved` - Accepted, site is now a member
- `rejected` - Application was rejected

---

### Health Check

Check if the API is running.

```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T15:30:00.000Z"
}
```

---

## Admin Endpoints

These endpoints require authentication via JWT token.

### Authentication

Include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

### Admin Login

Authenticate and receive a JWT token.

```
POST /api/admin/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

### List Applications (Admin)

Get all applications with full details.

```
GET /api/admin/applications
```

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `status` | string | (Optional) Filter by status: `pending`, `approved`, `rejected` |

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Website",
    "url": "https://mywebsite.com",
    "description": "A personal blog about technology",
    "contactEmail": "me@mywebsite.com",
    "slug": "my-website",
    "submittedAt": "2024-01-20T14:00:00.000Z",
    "status": "pending"
  }
]
```

---

### Approve Application

Approve a pending application, adding the site as a member.

```
POST /api/admin/applications/:id/approve
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | string | The application UUID |

**Response (200):**
```json
{
  "message": "Application approved",
  "participant": {
    "slug": "my-website",
    "name": "My Website",
    "url": "https://mywebsite.com",
    "description": "A personal blog about technology",
    "contactEmail": "me@mywebsite.com",
    "approvedAt": "2024-01-21T10:00:00.000Z"
  }
}
```

**Response (400):**
```json
{
  "error": "Application is not pending"
}
```

---

### Reject Application

Reject a pending application.

```
POST /api/admin/applications/:id/reject
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | string | The application UUID |

**Request Body (optional):**
```json
{
  "reason": "Site content does not meet our guidelines"
}
```

**Response (200):**
```json
{
  "message": "Application rejected",
  "applicationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Delete Application

Permanently delete an application.

```
DELETE /api/admin/applications/:id
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | string | The application UUID |

**Response (200):**
```json
{
  "message": "Application deleted"
}
```

---

### List Participants (Admin)

Get all participants with full details (same as public endpoint).

```
GET /api/admin/participants
```

**Response:** Same as `GET /api/participants`

---

### Update Participant

Update a participant's information.

```
PUT /api/admin/participants/:slug
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `slug` | string | The participant's slug |

**Request Body:**
```json
{
  "name": "Updated Name",
  "url": "https://newurl.com",
  "description": "Updated description",
  "contactEmail": "newemail@example.com"
}
```

All fields are optional. Only provided fields are updated.

**Response (200):**
```json
{
  "message": "Participant updated",
  "participant": {
    "slug": "my-website",
    "name": "Updated Name",
    "url": "https://newurl.com",
    "description": "Updated description",
    "contactEmail": "newemail@example.com",
    "approvedAt": "2024-01-21T10:00:00.000Z"
  }
}
```

---

### Remove Participant

Remove a participant from the webring.

```
DELETE /api/admin/participants/:slug
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `slug` | string | The participant's slug |

**Response (200):**
```json
{
  "message": "Participant removed"
}
```

---

### Invalidate Cache

Force the server to refresh data from GitHub.

```
POST /api/admin/cache/invalidate
```

**Response (200):**
```json
{
  "message": "Cache invalidated"
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request

Invalid request data.

```json
{
  "error": "Validation failed",
  "details": ["Error message 1", "Error message 2"]
}
```

### 401 Unauthorized

Missing or invalid authentication (admin endpoints only).

```json
{
  "error": "Authorization header required"
}
```

```json
{
  "error": "Token expired"
}
```

### 404 Not Found

Resource not found.

```json
{
  "error": "Participant not found"
}
```

### 409 Conflict

Duplicate resource.

```json
{
  "error": "This site is already a member of the webring"
}
```

### 500 Internal Server Error

Server error (check logs for details).

```json
{
  "error": "Failed to fetch participants"
}
```

---

## Using the Widget

The webring widget uses the navigation endpoints. Here's how it works:

```html
<div style="text-align:center;font-family:system-ui;padding:12px;border:1px solid #ddd;border-radius:6px;max-width:280px">
  <small style="color:#666">Member of the Webring</small>
  <nav style="margin-top:8px">
    <a href="https://api.example.com/api/prev">Prev</a> |
    <a href="https://api.example.com/api/random">Random</a> |
    <a href="https://api.example.com/api/next">Next</a>
  </nav>
</div>
```

When a visitor clicks a link:
1. The browser sends a request with the `Referer` header
2. The API identifies the current site from the Referer
3. The API redirects to the appropriate site

For more reliable navigation, use explicit slugs:

```html
<a href="https://api.example.com/api/prev/my-site-slug">Prev</a>
<a href="https://api.example.com/api/next/my-site-slug">Next</a>
```
