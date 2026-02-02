import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { WebhookService } from '../webhook.service';

@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, OnDestroy {
  private intervalId: any;

  constructor(
    private cdr: ChangeDetectorRef,
    public webhookService: WebhookService
  ) { }

  ngOnInit() {
    // Fetch new "webhook" simulation every 3 seconds
    this.intervalId = setInterval(() => {
      this.getAdvice();
    }, 3000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  onItemClick(id: string) {
    this.webhookService.selectItem(id);
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

      const unixTimestamp = now.getTime();

      // Mock data for technical fields - Advice API always uses GET
      const method = 'GET';

      const mockHeaders = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Webhook-Simulator/1.0)',
        'X-Request-Id': uniqueAlphaId,
        'Host': 'api.adviceslip.com'
      };

      const mockResponseHeaders = {
        'Status': '200 OK',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, private',
        'Server': 'nginx',
        'Access-Control-Allow-Origin': '*'
      };

      const mockPayload = {
        slip: {
          id: Math.floor(Math.random() * 200),
          advice: newAdviceText
        }
      };

      // Add to service
      this.webhookService.addToHitList({
        text: newAdviceText,
        time: formattedTime,
        unix: unixTimestamp,
        id: uniqueAlphaId,
        method: method,
        headers: mockHeaders,
        responseHeaders: mockResponseHeaders,
        payload: mockPayload
      });

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Could not fetch advice.', error);
    }
  }

  onDeleteClick() {
    this.webhookService.clearAll();
    this.cdr.detectChanges();
  }
}