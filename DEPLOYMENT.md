# Cloudflare Pages Deployment Guide (Without Workers)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE PAGES                            │
│              (yourdomain.com/view/:uniqueId)                │
│                                                              │
│  Angular App - Shows webhook testing UI                      │
│  • Listens to Firebase RTDB for real-time updates           │
│  • Stores data in IndexedDB after receiving                 │
│  • Deletes data from Firebase RTDB after storing locally    │
└─────────────────────────────┬───────────────────────────────┘
                              │ Real-time listener
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     FIREBASE RTDB                            │
│              webhooks/{uniqueId}/requests                    │
└─────────────────────────────▲───────────────────────────────┘
                              │ Writes data
                              │
┌─────────────────────────────────────────────────────────────┐
│                   ZOHO CATALYST                              │
│  (your-project.catalyst.zoho.com/server/webhook_handler)    │
│                                                              │
│  Webhook Handler - Receives POST/GET requests                │
│  • Stores request data in Firebase RTDB                      │
│  • Returns acknowledgment response                           │
└─────────────────────────────────────────────────────────────┘
```

**Key Difference**: Without Cloudflare Workers, you have TWO separate URLs:
1. **Frontend URL**: `yourdomain.com/view/:uniqueId` - For viewing in browser (Angular app)
2. **Webhook URL**: `your-project.catalyst.zoho.com/server/webhook_handler/view/:uniqueId` - For code to POST/GET to

## Prerequisites
1. A Cloudflare account
2. A GitHub/GitLab repository with your code
3. Firebase project with RTDB enabled
4. Zoho Catalyst account with a project

## Step 1: Configure Firebase

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Realtime Database (choose a region close to your users)

### 1.2 Set Database Rules
Go to Realtime Database → Rules and set:
```json
{
  "rules": {
    "webhooks": {
      "$webhookId": {
        "requests": {
          ".read": true,
          ".write": true
        }
      }
    }
  }
}
```

### 1.3 Get Firebase Config
1. Go to Project Settings → General
2. Scroll to "Your apps" → Add Web app (if not already added)
3. Copy the configuration object
4. Update `src/environments/environment.ts` and `environment.prod.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  },
  catalystWebhookBaseUrl: "https://YOUR_CATALYST_PROJECT.catalyst.zoho.com/server/webhook_handler"
};
```

## Step 2: Configure Zoho Catalyst

### 2.1 Create Catalyst Project
1. Go to [Zoho Catalyst Console](https://console.catalyst.zoho.com/)
2. Create a new project
3. Go to Develop → Functions → Create Function
4. Choose "Advanced I/O" function type
5. Name it `webhook_handler`

### 2.2 Deploy Webhook Handler
1. In the function editor, paste the code from `catalyst-functions/webhook_handler/index.js`
2. Or use CLI:
   ```bash
   catalyst init
   cd functions/webhook_handler
   npm install firebase-admin
   ```

### 2.3 Configure Firebase Service Account
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `serviceAccountKey.json` in the function folder
4. Update the `databaseURL` in `index.js`

### 2.4 Deploy the Function
```bash
catalyst deploy
```

### 2.5 Get Function URL
After deployment, your webhook URL will be:
```
https://YOUR_PROJECT.catalyst.zoho.com/server/webhook_handler/view/{uniqueId}
```

## Step 3: Deploy Angular App to Cloudflare Pages

### 3.1 Build for Production
```bash
npm run build
```

### 3.2 Connect Repository to Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages
2. Create a project → Connect to Git
3. Select your repository

### 3.3 Build Configuration
- **Framework preset:** None
- **Build command:** `npm run build`
- **Build output directory:** `dist/play-rok-webhook/browser`
- **Root directory:** `/`

### 3.4 Configure SPA Redirects
Create a `_redirects` file in the `public` folder (or configure in Cloudflare dashboard):
```
/view/*  /index.html  200
/view/*/in/*  /index.html  200
```

Or in Cloudflare Pages dashboard:
1. Go to your Pages project → Settings → Builds & deployments
2. Add redirect rules:
   - `/view/*` → `/index.html` (200)
   - `/view/*/in/*` → `/index.html` (200)

## Step 4: Update Environment Config

Before deploying, update `src/environments/environment.prod.ts` with your actual values:

```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
  },
  catalystWebhookBaseUrl: "https://your-catalyst-project.catalyst.zoho.com/server/webhook_handler"
};
```

## How It Works

1. **User opens browser** → `yourdomain.com/view/abc123`
   - Cloudflare Pages serves the Angular app
   - Angular app starts listening to Firebase RTDB at `webhooks/abc123/requests`

2. **Code sends webhook** → `POST https://your-catalyst.catalyst.zoho.com/server/webhook_handler/view/abc123`
   - Zoho Catalyst receives the request
   - Stores it in Firebase RTDB at `webhooks/abc123/requests/{auto-id}`
   - Returns acknowledgment to the caller

3. **Angular app receives real-time update**
   - Firebase RTDB triggers the listener
   - Angular app displays the new request
   - Stores in IndexedDB for persistence
   - Deletes from Firebase RTDB (cleanup)

## Testing

### Test Locally
```bash
npm run start
# Open http://localhost:4200
```

### Test Webhook (replace with your Catalyst URL)
```bash
# GET request
curl "https://YOUR_CATALYST.catalyst.zoho.com/server/webhook_handler/view/testid?name=test"

# POST request
curl -X POST "https://YOUR_CATALYST.catalyst.zoho.com/server/webhook_handler/view/testid" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello World", "data": {"key": "value"}}'
```

## Optional: Custom Domain for Catalyst

If you want a cleaner URL like `api.yourdomain.com/view/:id`:

1. In Zoho Catalyst Console → Settings → Custom Domain
2. Add your subdomain (e.g., `api.yourdomain.com`)
3. Configure DNS CNAME record pointing to Catalyst
4. Update `catalystWebhookBaseUrl` in environment files:
   ```typescript
   catalystWebhookBaseUrl: "https://api.yourdomain.com"
   ```
