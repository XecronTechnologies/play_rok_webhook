import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-json-viewer',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="json-node" [class.root]="isRoot">
      @if (isObject || isArray) {
        <div class="node-header" (click)="toggle()">
          <span class="toggle-icon" [class.open]="isOpen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>
          @if (key) {
            <span class="key">{{ key }}</span>
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

        @if (isOpen) {
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
      } @else {
        <div class="primitive">
          @if (key) {
            <span class="key">{{ key }}</span>
            <span class="separator">:</span>
          }
          <span class="value" [ngClass]="getValueType(data)">
            {{ getValueType(data) === 'string' ? '"' + data + '"' : data }}
          </span>
        </div>
      }
    </div>
  `,
    styles: [`
    .json-node {
      font-family: 'Inter', 'JetBrains Mono', monospace;
      font-size: 13px;
      line-height: 1.5;
      margin-left: 18px;
    }

    .json-node.root {
      margin-left: 0;
      padding: 16px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
    }

    .node-header {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 0;
      border-radius: 4px;
      transition: background 0.1s;
    }

    .node-header:hover {
      background: #f8fafc;
    }

    .toggle-icon {
      width: 12px;
      height: 12px;
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
      margin-right: 4px;
    }

    .bracket {
      color: #64748b;
      font-weight: 500;
    }

    .summary {
      color: #94a3b8;
      font-size: 11px;
      font-style: italic;
      margin: 0 4px;
    }

    .node-content {
      border-left: 1px solid #f1f5f9;
      margin-left: 5px;
      padding-left: 4px;
    }

    .footer {
      padding-left: 14px;
    }

    .primitive {
      padding: 2px 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .value.string { color: #0891b2; }
    .value.number { color: #2563eb; }
    .value.boolean { color: #d97706; }
    .value.null { color: #64748b; font-style: italic; }

    .value {
      word-break: break-all;
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
    keys: string[] = [];

    ngOnInit() {
        this.isObject = typeof this.data === 'object' && this.data !== null;
        this.isArray = Array.isArray(this.data);
        if (this.isObject) {
            this.keys = Object.keys(this.data);
        }
    }

    toggle() {
        this.isOpen = !this.isOpen;
    }

    getValueType(val: any): string {
        if (val === null) return 'null';
        return typeof val;
    }
}
