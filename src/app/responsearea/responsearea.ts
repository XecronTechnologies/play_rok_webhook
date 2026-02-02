import { Component, signal } from '@angular/core';
import { WebhookService } from '../webhook.service';

@Component({
  selector: 'responsearea',
  standalone: true,
  imports: [],
  templateUrl: './responsearea.html',
  styleUrl: './responsearea.css',
})
export class Responsearea {
  currentPath = signal<string>('');

  constructor(public webhookService: WebhookService) {
    this.checkInitialUrl();

    // Listen for browser navigation (back/forward)
    window.addEventListener('popstate', () => {
      this.checkInitialUrl();
    });
  }

  private checkInitialUrl() {
    const path = window.location.pathname;
    this.currentPath.set(path);
    const match = path.match(/\/in\/([a-zA-Z0-9]+)/);
    if (match) {
      this.webhookService.selectedId.set(match[1]);
    }
  }

  getUrlPath() {
    alert(window.location.pathname);
  }
}
