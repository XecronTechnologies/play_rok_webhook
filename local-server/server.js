const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = 3000;

// Enable CORS for all origins (for local testing)
app.use(cors());

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase Admin SDK with your project credentials
// For local testing, we use the Firebase Web SDK config approach
// In production (Zoho Catalyst), use service account

const firebaseConfig = {
    apiKey: "AIzaSyCAeW3tmrd-lsXcEt-vaYBaRHjD3_PDkuQ",
    authDomain: "micro-app-service.firebaseapp.com",
    databaseURL: "https://micro-app-service-default-rtdb.firebaseio.com",
    projectId: "micro-app-service",
    storageBucket: "micro-app-service.firebasestorage.app",
    messagingSenderId: "636864461024",
    appId: "1:636864461024:web:545f3a4ed19a3561263885"
};

// Initialize Firebase Admin without service account (using default credentials)
// For local testing, we'll use the REST API approach
const https = require('https');
const http = require('http');

/**
 * Write data to Firebase RTDB using REST API
 * This approach works without service account for testing
 */
async function writeToFirebase(path, data) {
    return new Promise((resolve, reject) => {
        const url = `${firebaseConfig.databaseURL}/${path}.json`;
        const postData = JSON.stringify(data);

        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve(parsed);
                } catch (e) {
                    resolve(responseData);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        message: 'Webhook Local Server is running',
        endpoints: {
            webhook: 'POST/GET /view/:uniqueId',
            health: 'GET /'
        }
    });
});

// Webhook handler - matches the Zoho Catalyst function structure
app.all('/view/:uniqueId', async (req, res) => {
    try {
        const { uniqueId } = req.params;
        const timestamp = Date.now();

        console.log(`\n📥 Received ${req.method} request for webhook: ${uniqueId}`);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Query:', JSON.stringify(req.query, null, 2));
        console.log('Body:', JSON.stringify(req.body, null, 2));

        // Prepare webhook data
        const webhookData = {
            method: req.method,
            headers: req.headers,
            body: req.body || null,
            query: req.query || {},
            timestamp: timestamp,
            path: req.path,
            ip: req.ip || req.connection.remoteAddress || 'unknown'
        };

        // Store in Firebase RTDB
        const firebasePath = `webhooks/${uniqueId}/requests`;
        const result = await writeToFirebase(firebasePath, webhookData);

        console.log(`✅ Stored in Firebase RTDB:`, result);

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Webhook received and stored in Firebase RTDB',
            webhookId: uniqueId,
            requestId: result.name || 'unknown',
            timestamp: timestamp
        });

    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           🚀 Webhook Local Server Started!                     ║
╠═══════════════════════════════════════════════════════════════╣
║  Server URL:     http://localhost:${PORT}                        ║
║  Webhook URL:    http://localhost:${PORT}/view/{uniqueId}        ║
╠═══════════════════════════════════════════════════════════════╣
║  Firebase RTDB:  ${firebaseConfig.databaseURL}  ║
╠═══════════════════════════════════════════════════════════════╣
║                     TEST IN POSTMAN                            ║
║                                                                ║
║  GET:  http://localhost:${PORT}/view/test123?foo=bar             ║
║  POST: http://localhost:${PORT}/view/test123                     ║
║        Body: {"message": "Hello World"}                        ║
╚═══════════════════════════════════════════════════════════════╝
    `);
});
