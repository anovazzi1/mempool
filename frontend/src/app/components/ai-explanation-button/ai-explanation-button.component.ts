import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';
import { ImageCaptureService } from '../../services/image-capture.service';

interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-explanation-button',
  templateUrl: './ai-explanation-button.component.html',
  styleUrls: ['./ai-explanation-button.component.scss'],
  standalone: true,
  imports: [
    CommonModule, // For *ngIf, *ngFor directives
    FormsModule, // For [(ngModel)]
  ],
})
export class AiExplanationButtonComponent {
  @Input() targetSelector: string;
  @Input() parsedData?: string;
  messages: ChatMessage[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  userMessage: string = '';
  @ViewChild('messagesContainer') private messagesContainer: ElementRef;

  constructor(
    private aiService: AiService,
    private imageCaptureService: ImageCaptureService
  ) {}

  async getExplanation(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const targetElement = document.querySelector(
        this.targetSelector
      ) as HTMLElement;
      if (targetElement) {
        const capturedImage = await this.imageCaptureService.captureElement(
          targetElement
        );
        const extraData = this.parsedData
          ? `analise the raw data used to generate the graphic as well:\n\n\`\`\`${this.parsedData}\`\`\``
          : '';
        const explanation = await this.aiService.getExplanation(
          capturedImage,
          extraData
        );
        this.addMessage(explanation, false);
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

  async sendMessage(): Promise<void> {
    if (!this.userMessage.trim()) return;

    const userMessageContent = this.userMessage;
    this.addMessage(userMessageContent, true);
    this.userMessage = '';

    this.isLoading = true;
    try {
      const response = await this.aiService.getChatResponse(userMessageContent);
      this.addMessage(response, false);
    } catch (error) {
      this.error = `Sorry, I couldn't process your message. Please try again.`;
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  private addMessage(content: string, isUser: boolean): void {
    this.messages.push({
      content,
      isUser,
      timestamp: new Date(),
    });
    // Wait for DOM update before scrolling
    setTimeout(() => this.scrollToBottom(), 0);
  }

  private scrollToBottom(): void {
    try {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    } catch (err) {}
  }

  closeChat(): void {
    this.messages = [];
    this.error = null;
  }
}
