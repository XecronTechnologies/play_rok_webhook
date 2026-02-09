import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { FirebaseService, WebhookRequest } from './services/firebase.service';

export interface WebhookItem {
    text: string;
    time: string;
    unix: number;
    id: string;
    firebaseId?: string; // Firebase request ID for deletion
    method?: string;
    headers?: any;
    responseHeaders?: any;
    payload?: any;
    query?: any;
    viewed?: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class WebhookService implements OnDestroy {
    objectKeys = Object.keys;
    jsonStringify = JSON.stringify;

    private _hitList = signal<WebhookItem[]>([]);
    public hitList = this._hitList.asReadonly();

    public selectedId = signal<string | null>(null);
    public currentWebhookId = signal<string | null>(null);

    // --- Configuration ---
    private readonly INITIAL_LIMIT = 10;   // Inital limit for new user (e.g. 10 or 100)
    private readonly QUIZ_REWARD = 100;    // How many hits to add after quiz (e.g. 100)

    // Hit limit tracking
    private _totalHits = signal<number>(parseInt(localStorage.getItem('webhook_total_hits') || '0'));
    private _hitLimit = signal<number>(parseInt(localStorage.getItem('webhook_hit_limit') || this.INITIAL_LIMIT.toString()));
    public showLimitOverlay = signal<boolean>(false);

    public totalHits = this._totalHits.asReadonly();
    public hitLimit = this._hitLimit.asReadonly();
    public hitsRemaining = computed(() => Math.max(0, this._hitLimit() - this._totalHits()));

    public selectedItem = computed(() => {
        const id = this.selectedId();
        if (!id) return null;
        return this._hitList().find(item => item.id === id) || null;
    });

    // Catalyst webhook URL - for external code to POST/GET to
    public webhookUrl = computed(() => {
        const id = this.currentWebhookId();
        if (!id) return '';
        return this.firebaseService.getWebhookUrl(id);
    });

    // Frontend URL - for viewing in browser
    public frontendUrl = computed(() => {
        const id = this.currentWebhookId();
        if (!id) return '';
        return this.firebaseService.getFrontendUrl(id);
    });

    constructor(private firebaseService: FirebaseService) {
        this.initDB();
        this.initWebhookListener();
    }

    private initDB() {
        const dbRequest = indexedDB.open('WebhookDB', 2);
        dbRequest.onupgradeneeded = (event) => {
            const db = dbRequest.result;
            if (!db.objectStoreNames.contains('webhookHistory')) {
                db.createObjectStore('webhookHistory', { keyPath: 'unix' });
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };

        dbRequest.onsuccess = () => {
            this.loadFromDB();
            this.loadWebhookId();
        };
    }

    /**
     * Initialize or load existing webhook ID and start listening
     */
    private loadWebhookId() {
        const dbRequest = indexedDB.open('WebhookDB', 2);
        dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            const transaction = db.transaction('settings', 'readonly');
            const store = transaction.objectStore('settings');
            const getRequest = store.get('webhookId');

            getRequest.onsuccess = () => {
                const savedWebhookId = getRequest.result?.value;

                // Check if URL has a webhook ID
                const urlMatch = window.location.pathname.match(/\/view\/([a-zA-Z0-9]+)/);
                let webhookId: string;
                let isNewWebhook = false;

                if (urlMatch) {
                    webhookId = urlMatch[1];
                    // If URL webhook ID is different from saved one, it's a new webhook
                    if (savedWebhookId && savedWebhookId !== webhookId) {
                        isNewWebhook = true;
                    }
                    this.saveWebhookId(webhookId);
                } else if (!savedWebhookId) {
                    // Generate new webhook ID if none exists
                    webhookId = this.firebaseService.generateUniqueId();
                    this.saveWebhookId(webhookId);
                    isNewWebhook = true;
                } else {
                    webhookId = savedWebhookId;
                }

                // Clear data if it's a new/different webhook
                if (isNewWebhook) {
                    this.clearAllData();
                }

                this.currentWebhookId.set(webhookId);
                this.startListening(webhookId);

                // Update URL if not already set
                if (!urlMatch) {
                    window.history.replaceState({}, '', `/view/${webhookId}`);
                }
            };
        };
    }

    private saveWebhookId(webhookId: string) {
        const dbRequest = indexedDB.open('WebhookDB', 2);
        dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            const transaction = db.transaction('settings', 'readwrite');
            const store = transaction.objectStore('settings');
            store.put({ key: 'webhookId', value: webhookId });
        };
    }

    /**
     * Start listening to Firebase RTDB for new webhook requests
     */
    private startListening(webhookId: string) {
        this.firebaseService.listenToWebhookRequests(webhookId, (request) => {
            this.handleIncomingRequest(request);
        });
    }

    private initWebhookListener() {
        // Listen for URL changes
        window.addEventListener('popstate', () => {
            const urlMatch = window.location.pathname.match(/\/view\/([a-zA-Z0-9]+)/);
            if (urlMatch) {
                const newWebhookId = urlMatch[1];
                const currentId = this.currentWebhookId();

                if (newWebhookId !== currentId) {
                    // Stop listening to old webhook
                    if (currentId) {
                        this.firebaseService.stopListening(currentId);
                    }

                    // Start listening to new webhook
                    this.currentWebhookId.set(newWebhookId);
                    this.saveWebhookId(newWebhookId);
                    this.startListening(newWebhookId);
                }
            }
        });
    }

    /**
     * Handle incoming webhook request from Firebase RTDB
     */
    private handleIncomingRequest(request: WebhookRequest) {
        const now = new Date(request.timestamp);
        // Compact time format: "Feb 9, 9:24 PM"
        const formattedTime = now.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const uniqueAlphaId = this.generateUniqueId();

        const webhookItem: WebhookItem = {
            text: request.body ? JSON.stringify(request.body).substring(0, 100) : 'No body',
            time: formattedTime,
            unix: request.timestamp,
            id: uniqueAlphaId,
            firebaseId: request.id,
            method: request.method,
            headers: request.headers,
            responseHeaders: {
                'Status': '200 OK',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            payload: request.body || {},
            query: request.query || {},
            viewed: false
        };

        // Add to local state and IndexedDB
        this.addToHitList(webhookItem);

        // Delete from Firebase RTDB after storing locally
        if (request.id) {
            const webhookId = this.currentWebhookId();
            if (webhookId) {
                this.firebaseService.removeRequest(webhookId, request.id)
                    .catch(err => console.error('Failed to remove from Firebase:', err));
            }
        }
    }

    private generateUniqueId(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    public loadFromDB() {
        const dbRequest = indexedDB.open('WebhookDB', 2);
        dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            const transaction = db.transaction('webhookHistory', 'readonly');
            const store = transaction.objectStore('webhookHistory');
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => {
                const savedData = getAllRequest.result.sort((a: any, b: any) => b.unix - a.unix);
                this._hitList.set(savedData);
                this.cleanExpiredMessages();
            };
        };
    }

    public addToHitList(item: WebhookItem) {
        // Check if hit limit reached
        const newTotal = this._totalHits() + 1;
        this._totalHits.set(newTotal);
        localStorage.setItem('webhook_total_hits', newTotal.toString());

        // Show overlay when limit is reached
        if (newTotal >= this._hitLimit()) {
            this.showLimitOverlay.set(true);
        }

        this._hitList.update(list => [item, ...list]);

        // Persist to IndexedDB
        const dbRequest = indexedDB.open('WebhookDB', 2);
        dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            const transaction = db.transaction('webhookHistory', 'readwrite');
            const store = transaction.objectStore('webhookHistory');
            store.add(item);
        };

        this.cleanExpiredMessages();
    }

    /**
     * Extend hit limit after completing quiz
     */
    public extendHitLimit() {
        this._hitLimit.update(limit => {
            const newLimit = limit + this.QUIZ_REWARD;
            localStorage.setItem('webhook_hit_limit', newLimit.toString());
            return newLimit;
        });
        this.showLimitOverlay.set(false);
    }

    public clearAll() {
        this._hitList.set([]);
        this.selectedId.set(null);

        const dbRequest = indexedDB.open('WebhookDB', 2);
        dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            const transaction = db.transaction('webhookHistory', 'readwrite');
            transaction.objectStore('webhookHistory').clear();
        };
    }

    private cleanExpiredMessages() {
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        this._hitList.update(list => list.filter(item => item.unix > twentyFourHoursAgo));
    }

    public selectItem(id: string) {
        this.selectedId.set(id);

        // Update URL with selected item
        const webhookId = this.currentWebhookId();
        if (webhookId) {
            window.history.pushState({}, '', `/view/${webhookId}/in/${id}`);
        }

        // Mark as viewed
        const currentList = this._hitList();
        const itemIndex = currentList.findIndex(item => item.id === id);

        if (itemIndex !== -1 && !currentList[itemIndex].viewed) {
            const updatedItem = { ...currentList[itemIndex], viewed: true };
            const newList = [...currentList];
            newList[itemIndex] = updatedItem;
            this._hitList.set(newList);

            // Persist viewed status to IndexedDB
            const dbRequest = indexedDB.open('WebhookDB', 2);
            dbRequest.onsuccess = () => {
                const db = dbRequest.result;
                const transaction = db.transaction('webhookHistory', 'readwrite');
                const store = transaction.objectStore('webhookHistory');
                store.put(updatedItem);
            };
        }
    }

    /**
     * Generate a new webhook ID and start listening
     */
    public generateNewWebhookUrl(): string {
        // Stop listening to current webhook
        const currentId = this.currentWebhookId();
        if (currentId) {
            this.firebaseService.stopListening(currentId);
        }

        // Clear all existing data
        this.clearAllData();

        // Generate new ID
        const newId = this.firebaseService.generateUniqueId();
        this.currentWebhookId.set(newId);
        this.saveWebhookId(newId);

        // Start listening to new webhook
        this.startListening(newId);

        // Update URL
        window.history.pushState({}, '', `/view/${newId}`);

        return this.firebaseService.getWebhookUrl(newId);
    }

    /**
     * Clear all data from memory and IndexedDB
     */
    private clearAllData() {
        this._hitList.set([]);
        this.selectedId.set(null);

        // Reset hit limit and counters
        this._hitLimit.set(this.INITIAL_LIMIT);
        this._totalHits.set(0);
        this.showLimitOverlay.set(false);
        localStorage.removeItem('webhook_hit_limit');

        const dbRequest = indexedDB.open('WebhookDB', 2);
        dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            const transaction = db.transaction('webhookHistory', 'readwrite');
            transaction.objectStore('webhookHistory').clear();
        };
    }

    ngOnDestroy(): void {
        const currentId = this.currentWebhookId();
        if (currentId) {
            this.firebaseService.stopListening(currentId);
        }
    }
}
