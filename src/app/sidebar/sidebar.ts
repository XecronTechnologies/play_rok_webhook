import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, OnDestroy {
  hitList: { text: string; time: string; unix: number; id: string }[] = [];
  advice: string = 'Loading advice...';
  private intervalId: any;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadFromDB();
    // Fetch new "webhook" simulation every 3 seconds
    this.intervalId = setInterval(() => {
      this.getAdvice();
    }, 3000);
  }

  private loadFromDB() {
    const dbRequest = indexedDB.open('AdviceDB', 1);

    dbRequest.onupgradeneeded = () => {
      if (!dbRequest.result.objectStoreNames.contains('adviceHistory')) {
        dbRequest.result.createObjectStore('adviceHistory', { keyPath: 'unix' });
      }
    };

    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction('adviceHistory', 'readonly');
      const store = transaction.objectStore('adviceHistory');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        // Sort by unix descending (newest first)
        const savedData = getAllRequest.result.sort((a: any, b: any) => b.unix - a.unix);
        this.hitList = savedData;
        this.cleanExpiredMessages();
        this.cdr.detectChanges();
      };
    };
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  onItemClick(id: string) {
    // alert("item clicked " + id)
    window.history.pushState({}, '', `/in/${id}`);

  }

  // --- FEATURE: 24 HOUR AUTO DELETE ---
  private cleanExpiredMessages() {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const initialLength = this.hitList.length;

    // Remove items older than 24 hours
    this.hitList = this.hitList.filter(item => item.unix > twentyFourHoursAgo);

    // Only detect changes if something was actually deleted
    if (this.hitList.length !== initialLength) {
      this.cdr.detectChanges();
    }
  }

  generateUniqueId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async getAdvice() {
    try {
      const response = await fetch("https://api.adviceslip.com/advice");
      const data = await response.json();
      const newAdviceText = data.slip.advice;
      const uniqueAlphaId = this.generateUniqueId();

      const now = new Date();
      const formattedTime = now.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).replace(',', ' at');

      this.advice = newAdviceText;
      const unixTimestamp = now.getTime();

      // Update Local List
      this.hitList.unshift({ text: newAdviceText, time: formattedTime, unix: unixTimestamp, id: uniqueAlphaId });

      // Clean up old messages (Logic for 24h deletion)
      this.cleanExpiredMessages();

      // IndexDB logic for persistence
      const dbRequest = indexedDB.open('AdviceDB', 1);
      dbRequest.onupgradeneeded = () => {
        if (!dbRequest.result.objectStoreNames.contains('adviceHistory')) {
          dbRequest.result.createObjectStore('adviceHistory', { keyPath: 'unix' });
        }
      };
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        const transaction = db.transaction('adviceHistory', 'readwrite');
        const store = transaction.objectStore('adviceHistory');
        store.add({ text: newAdviceText, time: formattedTime, unix: unixTimestamp, id: uniqueAlphaId });
      };

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Could not fetch advice.', error);
    }
  }

  onDeleteClick() {
    this.hitList = [];
    // Also clear IndexedDB if you want a full reset
    const dbRequest = indexedDB.open('AdviceDB', 1);
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction('adviceHistory', 'readwrite');
      transaction.objectStore('adviceHistory').clear();
    };
    this.cdr.detectChanges();
  }
}