import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class ImageCaptureService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async captureElement(element: HTMLElement): Promise<string> {
    try {
      const canvas = await html2canvas(element);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing element:', error);
      throw error;
    }
  }
}
