import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AiExplanationButtonComponent } from './ai-explanation-button.component';
import { AiService } from '../../services/ai.service';
import { ImageCaptureService } from '../../services/image-capture.service';

describe('AiExplanationButtonComponent', () => {
  let component: AiExplanationButtonComponent;
  let fixture: ComponentFixture<AiExplanationButtonComponent>;
  let mockAiService: jasmine.SpyObj<AiService>;
  let mockImageCaptureService: jasmine.SpyObj<ImageCaptureService>;

  beforeEach(async () => {
    mockAiService = jasmine.createSpyObj('AiService', [
      'getExplanation',
      'getChatResponse',
    ]);
    mockImageCaptureService = jasmine.createSpyObj('ImageCaptureService', [
      'captureElement',
    ]);

    await TestBed.configureTestingModule({
      imports: [FormsModule, AiExplanationButtonComponent],
      providers: [
        { provide: AiService, useValue: mockAiService },
        { provide: ImageCaptureService, useValue: mockImageCaptureService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiExplanationButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Add more tests as needed
});
