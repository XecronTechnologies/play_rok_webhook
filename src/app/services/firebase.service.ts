import { Injectable, OnDestroy } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getDatabase,
    Database,
    ref,
    push,
    onChildAdded,
    remove,
    off,
    Unsubscribe,
    DataSnapshot
} from 'firebase/database';
import { environment } from '../../environments/environment';

export interface WebhookRequest {
    id?: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    query?: Record<string, string>;
    timestamp: number;
    path: string;
}

@Injectable({
    providedIn: 'root'
})
export class FirebaseService implements OnDestroy {
    private app: FirebaseApp;
    private db: Database;
    private listeners: Map<string, Unsubscribe> = new Map();

    constructor() {
        // Initialize Firebase
        this.app = initializeApp(environment.firebase);
        this.db = getDatabase(this.app);
    }

    /**
     * Listen for new webhook requests for a specific unique ID
     * @param uniqueId The unique webhook ID to listen to
     * @param callback Callback function when new request arrives
     */
    listenToWebhookRequests(
        uniqueId: string,
        callback: (request: WebhookRequest) => void
    ): void {
        const webhooksRef = ref(this.db, `webhooks/${uniqueId}/requests`);

        // Set up listener for new children
        const unsubscribe = onChildAdded(webhooksRef, (snapshot: DataSnapshot) => {
            const data = snapshot.val();
            if (data) {
                const request: WebhookRequest = {
                    id: snapshot.key || undefined,
                    ...data
                };
                callback(request);
            }
        });

        // Store the unsubscribe function
        this.listeners.set(uniqueId, () => off(webhooksRef));
    }

    /**
     * Remove a specific request from Firebase RTDB after it's been processed
     * @param uniqueId The unique webhook ID
     * @param requestId The specific request ID to remove
     */
    async removeRequest(uniqueId: string, requestId: string): Promise<void> {
        const requestRef = ref(this.db, `webhooks/${uniqueId}/requests/${requestId}`);
        try {
            await remove(requestRef);
            console.log(`Removed request ${requestId} from Firebase RTDB`);
        } catch (error) {
            console.error('Error removing request from Firebase:', error);
            throw error;
        }
    }

    /**
     * Stop listening to a specific webhook ID
     * @param uniqueId The unique webhook ID to stop listening to
     */
    stopListening(uniqueId: string): void {
        const unsubscribe = this.listeners.get(uniqueId);
        if (unsubscribe) {
            unsubscribe();
            this.listeners.delete(uniqueId);
        }
    }

    /**
     * Generate a new unique webhook ID
     */
    generateUniqueId(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Get the webhook URL for a specific unique ID
     * This is the Zoho Catalyst URL that external code should hit
     */
    getWebhookUrl(uniqueId: string): string {
        // This is the Catalyst API URL that external code will POST/GET to
        return `${environment.catalystWebhookBaseUrl}/view/${uniqueId}`;
    }

    /**
     * Get the frontend URL for viewing webhook requests
     * This is the Cloudflare Pages URL for the Angular app
     */
    getFrontendUrl(uniqueId: string): string {
        return `${window.location.origin}/view/${uniqueId}`;
    }

    ngOnDestroy(): void {
        // Clean up all listeners
        this.listeners.forEach((unsubscribe) => unsubscribe());
        this.listeners.clear();
    }
}
