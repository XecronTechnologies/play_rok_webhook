import { Component, signal } from '@angular/core';
import { Sidebar } from './sidebar/sidebar';
import { Responsearea } from './responsearea/responsearea';

@Component({
  selector: 'app-root',
  imports: [Sidebar, Responsearea],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('play-rok-webhook');
}
