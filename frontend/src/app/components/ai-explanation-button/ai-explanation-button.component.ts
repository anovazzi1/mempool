import { Component, Input } from '@angular/core';
import { AiService } from '../../services/ai.service';
import { ImageCaptureService } from '../../services/image-capture.service';

@Component({
  selector: 'app-ai-explanation-button',
  templateUrl: './ai-explanation-button.component.html',
  styleUrls: ['./ai-explanation-button.component.scss']
})
export class AiExplanationButtonComponent {
  @Input() targetSelector: string;
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
      const targetElement = document.querySelector(this.targetSelector) as HTMLElement;
      if (targetElement) {
        this.capturedImage = await this.imageCaptureService.captureElement(targetElement);
        this.downloadImage();
        this.explanation = await this.aiService.getExplanation(this.capturedImage);
      } else {
        throw new Error('No target element found for capture');
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
