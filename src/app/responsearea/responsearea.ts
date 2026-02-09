import { Component, signal, computed } from '@angular/core';
import { WebhookService } from '../webhook.service';

import { JsonViewerComponent } from './json-viewer.component';

@Component({
  selector: 'responsearea',
  standalone: true,
  imports: [JsonViewerComponent],
  templateUrl: './responsearea.html',
  styleUrl: './responsearea.css',
})
export class Responsearea {
  currentPath = computed(() => {
    const webhookId = this.webhookService.currentWebhookId();
    const selectedId = this.webhookService.selectedId();
    if (selectedId) {
      return `/view/${webhookId}/in/${selectedId}`;
    }
    return `/view/${webhookId}`;
  });

  fullUrl = computed(() => {
    return window.location.origin + this.currentPath();
  });

  constructor(public webhookService: WebhookService) {
    // Check URL for selected item on init
    this.checkInitialUrl();

    // Listen for browser navigation (back/forward)
    window.addEventListener('popstate', () => {
      this.checkInitialUrl();
    });
  }

  private checkInitialUrl() {
    const path = window.location.pathname;
    // Match /view/:webhookId/in/:itemId
    const match = path.match(/\/view\/([a-zA-Z0-9]+)\/in\/([a-zA-Z0-9]+)/);
    if (match) {
      this.webhookService.selectedId.set(match[2]);
    }
  }

  /**
   * Check if the payload has actual body content
   */
  hasBody(payload: any): boolean {
    if (!payload) return false;
    if (typeof payload === 'object') {
      return Object.keys(payload).length > 0;
    }
    return !!payload;
  }

  copyToClipboard(text: string, event: MouseEvent) {
    navigator.clipboard.writeText(text).then(() => {
      const btn = event.currentTarget as HTMLElement;
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 2000);
    });
  }

  getUrlPath() {
    alert(window.location.pathname);
  }
}
