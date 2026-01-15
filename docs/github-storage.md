# GitHub Storage Setup

This guide explains how to configure GitHub as the data storage backend for your webring.

## Overview

Using GitHub for storage provides:

- **Version History** - Every change is a commit, allowing rollback
- **Backup** - Data is stored remotely and can be cloned
- **No Database** - No need to manage a database server
- **Transparency** - Members can see the public data repository
- **Free Hosting** - GitHub hosts your data at no cost

## How It Works

1. You create a GitHub repository for webring data
2. The webring API reads/writes JSON files via GitHub's REST API
3. Each data change creates a commit in the repository
4. The API caches data locally to minimize API calls

## Setup Steps

### Step 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Name it something like `webring-data`
3. Choose **Public** or **Private**:
   - Public: Anyone can see your webring data
   - Private: Only you (and collaborators) can see it
4. **Do NOT** initialize with README, .gitignore, or license
5. Click **Create repository**

### Step 2: Generate a Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Give it a descriptive name: "Webring API"
4. Set expiration (or "No expiration" for convenience)
5. Select scopes:
   - For **public** repos: `public_repo`
   - For **private** repos: `repo` (full access)
6. Click **Generate token**
7. **Copy the token immediately** - you won't see it again!

### Step 3: Configure Environment

Update your `.env` file:

```bash
# Disable local data
USE_LOCAL_DATA=false

# GitHub configuration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=your-github-username
GITHUB_REPO=webring-data
GITHUB_BRANCH=main
```

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | The Personal Access Token you just created |
| `GITHUB_OWNER` | Your GitHub username or organization name |
| `GITHUB_REPO` | The repository name (just the name, not full URL) |
| `GITHUB_BRANCH` | The branch to use (usually `main` or `master`) |

### Step 4: Initialize the Repository

Run the setup command to create initial data files:

```bash
make setup-github
```

This creates:
- `participants.json` - Empty member list
- `applications.json` - Empty applications list

Alternatively, manually create these files in your repository:

**participants.json:**
```json
{
  "participants": []
}
```

**applications.json:**
```json
{
  "applications": []
}
```

### Step 5: Verify Setup

Start the backend and check the logs:

```bash
cd backend && npm run dev
```

You should see:
```
Webring API running on http://localhost:3000
Using GitHub data storage
```

Test the API:
```bash
curl http://localhost:3000/api/participants
```

Should return `[]` (empty array).

## Repository Structure

After setup, your data repository will look like:

```
webring-data/
├── participants.json    # Webring members
└── applications.json    # Membership applications
```

### participants.json Format

```json
{
  "participants": [
    {
      "slug": "example-site",
      "name": "Example Site",
      "url": "https://example.com",
      "description": "An example website",
      "contactEmail": "owner@example.com",
      "approvedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### applications.json Format

```json
{
  "applications": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "New Site",
      "url": "https://newsite.com",
      "description": "A new website wanting to join",
      "contactEmail": "applicant@newsite.com",
      "slug": "new-site",
      "submittedAt": "2024-01-20T14:00:00.000Z",
      "status": "pending"
    }
  ]
}
```

## Caching

To minimize GitHub API calls, the backend caches data:

- **Cache duration:** 60 seconds
- **Cache invalidation:** Automatic after any write operation
- **Manual invalidation:** `POST /api/admin/cache/invalidate`

This means:
- Reads within 60 seconds return cached data
- Writes always go to GitHub immediately
- After a write, the cache is refreshed

## Rate Limits

GitHub API has rate limits:

| Type | Limit |
|------|-------|
| Authenticated requests | 5,000 per hour |
| File reads | 1 request each |
| File writes | 1 request each |

With caching, typical usage is well under these limits:
- Reads: ~60 per hour (one per cache refresh)
- Writes: Only when approving/rejecting applications or modifying members

## Commit History

Each data change creates a commit:

```
Add participant: Example Site
Remove participant: old-site
New application: Another Site
Update application abc123 status to approved
```

You can:
- View history on GitHub
- Revert changes via Git
- See who made each change (all from your API account)

## Migrating from Local to GitHub

If you've been using local files and want to switch:

1. **Set up GitHub** (Steps 1-3 above)

2. **Copy existing data:**
   ```bash
   # View current local data
   cat data/participants.json
   cat data/applications.json
   ```

3. **Create files in GitHub repo** with the same content

4. **Update `.env`:**
   ```bash
   USE_LOCAL_DATA=false
   ```

5. **Restart backend**

## Migrating from GitHub to Local

To switch back to local files:

1. **Export current data:**
   ```bash
   curl http://localhost:3000/api/participants > data/participants.json
   # Format the JSON properly
   ```

2. **Update `.env`:**
   ```bash
   USE_LOCAL_DATA=true
   ```

3. **Restart backend**

## Troubleshooting

### "GITHUB_TOKEN is required"

The `GITHUB_TOKEN` environment variable is not set. Check:
1. `.env` file exists in project root
2. `GITHUB_TOKEN` is set (not commented out)
3. Backend was restarted after changing `.env`

### "Bad credentials" / 401 Error

The token is invalid or expired:
1. Check token hasn't expired
2. Regenerate token if needed
3. Ensure token is copied correctly (no extra spaces)

### "Not Found" / 404 Error

Repository or file not found:
1. Verify `GITHUB_OWNER` is correct (case-sensitive)
2. Verify `GITHUB_REPO` is correct
3. Ensure repository exists
4. For private repos, ensure token has `repo` scope

### "Rate limit exceeded" / 403 Error

You've hit GitHub's rate limit:
1. Wait for rate limit reset (shown in error)
2. Increase cache duration in code
3. Reduce unnecessary API calls

### Changes not appearing

Cache might be stale:
1. Wait 60 seconds for cache to expire
2. Call cache invalidation endpoint
3. Restart backend to clear cache

### Commits not appearing

Check GitHub repository:
1. Verify you're looking at the correct branch
2. Check the repository's commit history
3. Verify `GITHUB_BRANCH` matches your default branch

## Security Considerations

### Token Security

- **Never commit** your `.env` file or token
- **Use minimal scopes** (`public_repo` for public repos)
- **Rotate tokens** periodically
- **Revoke immediately** if compromised

### Repository Visibility

- **Public repos** expose member emails and application data
- **Private repos** keep data confidential
- Consider what data you're comfortable making public

### Backup

Even with GitHub storage, consider:
- Cloning the repository locally as backup
- Setting up GitHub repository backup tools
- Exporting data periodically
