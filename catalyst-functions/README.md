# Zoho Catalyst Serverless Function - Webhook Handler

This directory contains the Zoho Catalyst serverless function code that handles incoming webhook requests and stores them in Firebase RTDB.

## Setup Instructions

### 1. Create Zoho Catalyst Project
1. Go to [Zoho Catalyst Console](https://console.catalyst.zoho.com/)
2. Create a new project
3. Enable "Functions" component

### 2. Install Firebase Admin SDK
In the Catalyst functions directory:
```bash
catalyst init
cd functions/webhook_handler
npm install firebase-admin
```

### 3. Configure Firebase
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Save the JSON file as `serviceAccountKey.json` in the function folder
4. Update the `databaseURL` in the function code

### 4. Deploy Function
```bash
catalyst deploy
```

### 5. Configure Domain Whitelabeling
In Catalyst Console:
1. Go to Settings → Custom Domain
2. Add your Cloudflare Pages domain
3. Map `/view/*` routes to the function

## Function Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/view/:uniqueId` | Receives webhook and stores in Firebase RTDB |

## CORS Configuration
The function is configured to accept requests from any origin to support webhook testing.
