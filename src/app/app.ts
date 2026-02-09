import { Component, signal } from '@angular/core';
import { Sidebar } from './sidebar/sidebar';
import { Responsearea } from './responsearea/responsearea';
import { LimitOverlayComponent } from './limit-overlay/limit-overlay.component';
import { WebhookService } from './webhook.service';

@Component({
  selector: 'app-root',
  imports: [Sidebar, Responsearea, LimitOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('play-rok-webhook');

  constructor(public webhookService: WebhookService) { }

  onQuizCompleted() {
    this.webhookService.extendHitLimit();
  }
}
