import { Injectable, signal, computed } from '@angular/core';

export interface WebhookItem {
    text: string;
    time: string;
    unix: number;
    id: string;
    method?: string;
    headers?: any;
    responseHeaders?: any;
    payload?: any;
}

@Injectable({
    providedIn: 'root',
})
export class WebhookService {
    objectKeys = Object.keys;
    jsonStringify = JSON.stringify;
    private _hitList = signal<WebhookItem[]>([]);
    public hitList = this._hitList.asReadonly();

    public selectedId = signal<string | null>(null);

    public selectedItem = computed(() => {
        const id = this.selectedId();
        if (!id) return null;
        return this._hitList().find(item => item.id === id) || null;
    });

    constructor() {
        this.initDB();
    }

    private initDB() {
        const dbRequest = indexedDB.open('AdviceDB', 1);
        dbRequest.onupgradeneeded = () => {
            if (!dbRequest.result.objectStoreNames.contains('adviceHistory')) {
                dbRequest.result.createObjectStore('adviceHistory', { keyPath: 'unix' });
            }
        };

        dbRequest.onsuccess = () => {
            this.loadFromDB();
        };
    }

    public loadFromDB() {
        const dbRequest = indexedDB.open('AdviceDB', 1);
        dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            const transaction = db.transaction('adviceHistory', 'readonly');
            const store = transaction.objectStore('adviceHistory');
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => {
                const savedData = getAllRequest.result.sort((a: any, b: any) => b.unix - a.unix);
                this._hitList.set(savedData);
                this.cleanExpiredMessages();
            };
        };
    }

    public addToHitList(item: WebhookItem) {
        this._hitList.update(list => [item, ...list]);

        // Persist to DB
        const dbRequest = indexedDB.open('AdviceDB', 1);
        dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            const transaction = db.transaction('adviceHistory', 'readwrite');
            const store = transaction.objectStore('adviceHistory');
            store.add(item);
        };

        this.cleanExpiredMessages();
    }

    public clearAll() {
        this._hitList.set([]);
        this.selectedId.set(null);

        const dbRequest = indexedDB.open('AdviceDB', 1);
        dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            const transaction = db.transaction('adviceHistory', 'readwrite');
            transaction.objectStore('adviceHistory').clear();
        };
    }

    private cleanExpiredMessages() {
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        this._hitList.update(list => list.filter(item => item.unix > twentyFourHoursAgo));
    }

    public selectItem(id: string) {
        this.selectedId.set(id);
        window.history.pushState({}, '', `/in/${id}`);
    }
}
