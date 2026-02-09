const catalyst = require('zcatalyst-sdk-node');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// IMPORTANT: Replace with your service account key
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com' // Replace with your Firebase RTDB URL
    });
}

const database = admin.database();

/**
 * Catalyst Advanced I/O Function - Webhook Handler
 * 
 * This function receives webhook requests and stores them in Firebase RTDB
 * for real-time delivery to the Angular frontend.
 */
module.exports = async (catalystApp, context, request, response) => {
    try {
        // Extract unique ID from URL path
        // Expected format: /view/:uniqueId
        const urlPath = request.path || request.url || '';
        const pathMatch = urlPath.match(/\/view\/([a-zA-Z0-9]+)/);

        if (!pathMatch) {
            return response
                .status(400)
                .setContentType('application/json')
                .send({
                    success: false,
                    error: 'Invalid webhook URL. Expected format: /view/{uniqueId}'
                });
        }

        const uniqueId = pathMatch[1];
        const timestamp = Date.now();

        // Collect request data
        const webhookData = {
            method: request.method || 'GET',
            headers: request.headers || {},
            body: null,
            query: request.query || {},
            timestamp: timestamp,
            path: urlPath,
            ip: request.headers['x-forwarded-for'] || request.ip || 'unknown'
        };

        // Parse body based on content type
        if (request.body) {
            try {
                if (typeof request.body === 'string') {
                    webhookData.body = JSON.parse(request.body);
                } else {
                    webhookData.body = request.body;
                }
            } catch (e) {
                // If body is not JSON, store as raw text
                webhookData.body = { raw: request.body };
            }
        }

        // Store in Firebase RTDB
        const webhooksRef = database.ref(`webhooks/${uniqueId}/requests`);
        const newRequestRef = await webhooksRef.push(webhookData);

        console.log(`Webhook stored for ${uniqueId}: ${newRequestRef.key}`);

        // Set CORS headers for cross-origin requests
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', '*');

        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return response.status(204).send('');
        }

        // Send success response
        return response
            .status(200)
            .setContentType('application/json')
            .send({
                success: true,
                message: 'Webhook received successfully',
                webhookId: uniqueId,
                requestId: newRequestRef.key,
                timestamp: timestamp
            });

    } catch (error) {
        console.error('Webhook handler error:', error);

        return response
            .status(500)
            .setContentType('application/json')
            .send({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
    }
};
