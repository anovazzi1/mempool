import { Injectable } from '@angular/core';
import { OpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private model: OpenAI;
  private promptTemplate: PromptTemplate;
  private chain: LLMChain;

  constructor() {
    // Initialize the OpenAI model
    this.model = new OpenAI({
      openAIApiKey: environment.OPENAI_API_KEY,
      temperature: 0.7
    });

    // Create a prompt template
    this.promptTemplate = PromptTemplate.fromTemplate(
      'You are an AI assistant explaining Bitcoin data. Given the following data: {data}, provide a concise explanation for a general audience.'
    );

    // Create the chain'
    this.chain = new LLMChain({
      llm: this.model,
      prompt: this.promptTemplate,
    });
  }

  async getExplanation(data: any): Promise<string> {
    try {
      const result = await this.chain.call({ data: JSON.stringify(data) });
      return result.text;
    } catch (error) {
      console.error('Error getting AI explanation:', error);
      throw error;
    }
  }
}
