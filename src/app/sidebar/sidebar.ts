import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebhookService } from '../webhook.service';

@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, OnDestroy {
  constructor(public webhookService: WebhookService) { }

  ngOnInit() {
    // Webhook listening is now handled by WebhookService via Firebase RTDB
  }

  ngOnDestroy() {
    // Cleanup is handled by WebhookService
  }

  onItemClick(id: string) {
    this.webhookService.selectItem(id);
  }

  onDeleteClick() {
    this.webhookService.clearAll();
  }

  copyWebhookUrl() {
    const url = this.webhookService.webhookUrl();
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        // Visual feedback handled by CSS
      });
    }
  }

  generateNewUrl() {
    this.webhookService.generateNewWebhookUrl();
  }

  onLogout() {
    alert('Logged out successfully');
  }

  onSettingsClick() {
    alert('Settings coming soon!');
  }

  /**
   * Format unix timestamp to compact time: "9:25 PM"
   */
  formatTime(unix: number): string {
    const date = new Date(unix);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}