import { Component, Input, ElementRef } from '@angular/core';
import { AiService } from '../../services/ai.service';
import { ImageCaptureService } from '../../services/image-capture.service';

@Component({
  selector: 'app-ai-explanation-button',
  templateUrl: './ai-explanation-button.component.html',
  styleUrls: ['./ai-explanation-button.component.scss']
})
export class AiExplanationButtonComponent {
  @Input() targetElement: ElementRef<HTMLElement>;
  explanation: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  capturedImage: string | null = null;

  constructor(
    private aiService: AiService,
    private imageCaptureService: ImageCaptureService
  ) {}

  async getExplanation(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      if (this.targetElement && this.targetElement.nativeElement) {
        this.capturedImage = await this.imageCaptureService.captureElement(this.targetElement.nativeElement);
        this.explanation = await this.aiService.getExplanation(this.capturedImage);
        this.downloadImage();
      } else {
        throw new Error('No target element provided for capture');
      }
    } catch (error) {
      this.error = `Sorry, I couldn't generate an explanation at this time. Please try again later.`;
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  closeExplanation(): void {
    this.explanation = '';
    this.error = null;
  }

  downloadImage(): void {
    if (this.capturedImage) {
      const link = document.createElement('a');
      link.href = this.capturedImage;
      link.download = 'component-snapshot.png';
      link.click();
    }
  }
}
