import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Responsearea } from './responsearea';

describe('Responsearea', () => {
  let component: Responsearea;
  let fixture: ComponentFixture<Responsearea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Responsearea]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Responsearea);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
