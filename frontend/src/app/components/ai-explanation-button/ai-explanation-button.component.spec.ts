import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiExplanationButtonComponent } from './ai-explanation-button.component';

describe('AiExplanationButtonComponent', () => {
  let component: AiExplanationButtonComponent;
  let fixture: ComponentFixture<AiExplanationButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiExplanationButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AiExplanationButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
