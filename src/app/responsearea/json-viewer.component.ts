import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-json-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="json-node" [class.root]="isRoot">
      @if (isObject || isArray) {
        <div class="node-header">
          <span class="toggle-icon-wrapper" (click)="toggle()">
            <span class="toggle-icon" [class.open]="isOpen">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </span>
          </span>
          
          <div class="header-content" (click)="toggle()">
            @if (key) {
              <span class="key">"{{ key }}"</span>
              <span class="separator">:</span>
            }
            <span class="bracket">{{ isArray ? '[' : '{' }}</span>
            @if (!isOpen) {
              <span class="summary">
                {{ isArray ? data.length + ' items' : keys.length + ' fields' }}
              </span>
              <span class="bracket">{{ isArray ? ']' : '}' }}</span>
            }
          </div>

          <button class="copy-btn" (click)="copyToClipboard($event, data)" title="Copy JSON">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>

        @if (isOpen) {
          <!-- Compact inline display for simple arrays (primitives only) -->
          @if (isArray && isSimpleArray) {
            <div class="inline-array">
              @for (item of data; track $index; let last = $last) {
                <span class="inline-value" [ngClass]="getValueType(item)">
                  {{ getValueType(item) === 'string' ? '"' + item + '"' : item }}
                </span>
                @if (!last) {
                  <span class="inline-comma">,</span>
                }
              }
              <span class="bracket">]</span>
            </div>
          } @else {
            <div class="node-content">
              @for (k of keys; track k) {
                <div class="child-node">
                  <app-json-viewer [data]="data[k]" [key]="isArray ? '' : k" [isRoot]="false"></app-json-viewer>
                </div>
              }
            </div>
            <div class="footer">
              <span class="bracket">{{ isArray ? ']' : '}' }}</span>
            </div>
          }
        }
      } @else {
        <div class="primitive">
          @if (key) {
            <span class="key">"{{ key }}"</span>
            <span class="separator">:</span>
          }
          <span class="value" [ngClass]="getValueType(data)">
            {{ getValueType(data) === 'string' ? '"' + data + '"' : data }}
          </span>
          <button class="copy-btn mini" (click)="copyToClipboard($event, data)" title="Copy Value">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .json-node {
      font-family: 'JetBrains Mono', 'Consolas', monospace;
      font-size: 9px;
      line-height: 1.15;
      margin-left: 10px;
    }

    .json-node.root {
      margin-left: 0;
      padding: 6px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
      flex: 1;
      height: 100%;
      overflow-y: auto;
    }

    .node-header {
      display: flex;
      align-items: center;
      gap: 1px;
      padding: 1px 0;
      border-radius: 2px;
      transition: background 0.1s;
      position: relative;
    }

    .toggle-icon-wrapper {
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 2px;
    }

    .header-content {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 2px;
      flex: 1;
    }

    .node-header:hover {
      background: #f8fafc;
    }

    .node-header:hover .copy-btn {
      opacity: 1;
    }

    .toggle-icon {
      width: 8px;
      height: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      transition: transform 0.2s;
    }

    .toggle-icon svg {
      width: 100%;
      height: 100%;
    }

    .toggle-icon.open {
      transform: rotate(90deg);
    }

    .key {
      color: #0f172a;
      font-weight: 600;
    }

    .separator {
      color: #94a3b8;
      margin-right: 2px;
    }

    .bracket {
      color: #64748b;
      font-weight: 500;
    }

    .summary {
      color: #94a3b8;
      font-size: 8px;
      font-style: italic;
      margin: 0 2px;
    }

    .node-content {
      border-left: 1px solid #f1f5f9;
      margin-left: 4px;
      padding-left: 2px;
    }

    .footer {
      padding-left: 10px;
    }

    .primitive {
      padding: 1px 0;
      display: flex;
      align-items: center;
      gap: 2px;
      position: relative;
    }

    .primitive:hover {
      background: #f8fafc;
    }

    .primitive:hover .copy-btn {
      opacity: 1;
    }

    .copy-btn {
      opacity: 0;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 2px;
      padding: 2px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
      margin-left: 4px;
    }

    .copy-btn svg {
      width: 8px;
      height: 8px;
    }

    .copy-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }

    .copy-btn:active {
      transform: scale(0.95);
    }

    .copy-btn.copied {
      color: #10b981;
      border-color: #10b981;
    }

    .value.string { color: #0891b2; }
    .value.number { color: #2563eb; }
    .value.boolean { color: #d97706; }
    .value.null { color: #64748b; font-style: italic; }

    .value {
      word-break: break-all;
    }

    /* Inline array styles for compact display */
    .inline-array {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 2px;
      padding: 1px 0 1px 6px;
    }

    .inline-value {
      padding: 1px 4px;
      border-radius: 3px;
      background: #f8fafc;
    }

    .inline-value.string { color: #0891b2; background: #ecfeff; }
    .inline-value.number { color: #2563eb; background: #eff6ff; }
    .inline-value.boolean { color: #d97706; background: #fffbeb; }
    .inline-value.null { color: #64748b; background: #f8fafc; font-style: italic; }

    .inline-comma {
      color: #94a3b8;
    }
  `]
})
export class JsonViewerComponent implements OnInit {
  @Input() data: any;
  @Input() isRoot: boolean = true;
  @Input() key: string = '';

  isOpen: boolean = true;
  isObject: boolean = false;
  isArray: boolean = false;
  isSimpleArray: boolean = false;
  keys: string[] = [];

  ngOnInit() {
    this.isObject = typeof this.data === 'object' && this.data !== null;
    this.isArray = Array.isArray(this.data);
    if (this.isObject) {
      this.keys = Object.keys(this.data);
    }
    // Check if array contains only primitives (strings, numbers, booleans, null)
    if (this.isArray) {
      this.isSimpleArray = this.data.every((item: any) =>
        item === null || ['string', 'number', 'boolean'].includes(typeof item)
      );
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  copyToClipboard(event: MouseEvent, data: any) {
    event.stopPropagation();
    const text = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);

    navigator.clipboard.writeText(text).then(() => {
      const btn = event.currentTarget as HTMLElement;
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 2000);
    });
  }

  getValueType(val: any): string {
    if (val === null) return 'null';
    return typeof val;
  }
}
