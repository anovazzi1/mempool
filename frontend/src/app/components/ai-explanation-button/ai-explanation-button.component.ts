import { Component, Input } from '@angular/core';
import { AiService } from '../../services/ai.service';

@Component({
  selector: 'app-ai-explanation-button',
  templateUrl: './ai-explanation-button.component.html',
  styleUrls: ['./ai-explanation-button.component.scss']
})
export class AiExplanationButtonComponent {
  @Input() parentData: string|HTMLElement;
  explanation: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private aiService: AiService) {}

  async getExplanation(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      this.explanation = await this.aiService.getExplanation(this.parentData);
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
}
