import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-limit-overlay',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- Alert Bar Mode -->
    <div class="alert-bar" [@slideDown]>
      <span class="alert-icon">⚠️</span>
      <span class="alert-text">Daily request limit reached. Access an additional 100-hit quota extension by completing our technical quiz.</span>
      <button class="quiz-btn" (click)="goToQuiz()">Take Quiz</button>
    </div>
  `,
    styles: [`
    /* Alert Bar Styles */
    .alert-bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 36px;
      background: linear-gradient(90deg, #dc2626, #b91c1c);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      z-index: 1000;
      animation: slideDown 0.3s ease;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
    }

    @keyframes slideDown {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }

    .alert-icon {
      font-size: 14px;
    }

    .alert-text {
      color: #fef08a;
      font-size: 12px;
      font-weight: 600;
    }

    .quiz-btn {
      background: #fef08a;
      color: #991b1b;
      border: none;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .quiz-btn:hover {
      background: #fde047;
      transform: scale(1.05);
    }
  `]
})
export class LimitOverlayComponent {
    @Output() completed = new EventEmitter<void>();

    // URL for the technical quiz
    private quizUrl = 'https://www.xecrontechnologies.in/';

    goToQuiz() {
        // Redirect to the quiz in the same tab as requested
        window.location.href = this.quizUrl;

        // Ensure the completion logic is triggered if the browser doesn't navigate immediately
        this.completed.emit();
    }
}
