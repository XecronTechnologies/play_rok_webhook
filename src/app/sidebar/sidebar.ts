import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, OnDestroy {
  hitList: { text: string; time: string }[] = [];

  advice: string = 'Loading advice...';
  private intervalId: any;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.getAdvice();
    this.intervalId = setInterval(() => {
      this.getAdvice();
    }, 3000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async getAdvice() {
    try {
      const response = await fetch("https://api.adviceslip.com/advice");
      const data = await response.json();
      const newAdviceText = data.slip.advice;

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
      this.hitList.unshift({ text: newAdviceText, time: formattedTime });
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Could not fetch advice.', error);
    }
  }

  onDeleteClick() {
    alert('delete clicked');
  }
}
