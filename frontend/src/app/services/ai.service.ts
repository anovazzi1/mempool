import { Injectable } from '@angular/core';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private model: ChatOpenAI;
  private promptTemplate: ChatPromptTemplate;

  constructor() {
    // Initialize the ChatOpenAI model
    this.model = new ChatOpenAI({
      openAIApiKey: environment.OPENAI_API_KEY,
      modelName: 'gpt-4-vision-preview', // Make sure to use a model that supports image input
      maxTokens: 300,
    });

    // Create a multimodal prompt template
    this.promptTemplate = ChatPromptTemplate.fromMessages([
      ['system', 'You are an AI assistant explaining Bitcoin difficulty data. Analyze the image provided and give a concise explanation for a general audience.'],
      [
        'user',
        [{ type: 'image_url', image_url: '{imageData}' }],
      ],
    ]);
  }

  async getExplanation(imageData: string): Promise<string> {
    try {
      const chain = this.promptTemplate.pipe(this.model);
      const response = await chain.invoke({ imageData });
      return response.content.toString();
    } catch (error) {
      console.error('Error getting AI explanation:', error);
      throw error;
    }
  }
}
