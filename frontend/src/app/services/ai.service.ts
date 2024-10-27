import { Injectable } from '@angular/core';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private model: ChatOpenAI;
  private promptTemplate: ChatPromptTemplate;
  private chatHistory: { role: string; content: string }[] = [];

  constructor() {
    // Initialize the ChatOpenAI model
    this.model = new ChatOpenAI({
      openAIApiKey: environment.OPENAI_API_KEY,
      modelName: 'gpt-4-vision-preview', // Make sure to use a model that supports image input
      maxTokens: 500,
      temperature: 0.2,
    });

    // Create a multimodal prompt template
    this.promptTemplate = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a blockchain expert explaining Bitcoin-related information to a beginner.
        Analyze all the provided data carefully and generate a clear, concise explanation.
         Your explanation should be simple and accessible for someone with little or no prior knowledge of blockchain or cryptocurrencies.`,
      ],
      [
        'system',
        `Deliver a clear and confident explanation, avoiding any language that suggests uncertainty, such as 'I think' or 'it looks like.'
        Jump directly into the analysis without referencing the data source or how the data was obtained.
        Focus solely on the analysis and insights, ensuring the user has no indication of the method used to review the information.\n DO NOT SAY 'THE IMAGE'`,
      ],
      [
        'system',
        `DO NOT SEPARATE YOUR ANALISES ON TWO PARTS, CREATE AN UNIQUE ANALISES BASED ON ALL THE DATA PROVIDED. DO NOT REFERENCE THE DATA DIRECTLY`,
      ],
      [
        'user',
        [
          { type: 'image_url', image_url: '{imageData}' },
          { type: 'text', text: '{parsedData}' },
        ],
      ],
    ]);
  }

  async getExplanation(
    imageData: string,
    parsedData?: string
  ): Promise<string> {
    try {
      const chain = this.promptTemplate.pipe(this.model);
      const response = await chain.invoke({
        imageData,
        parsedData: parsedData || '',
      });

      // Store the initial explanation in chat history
      const explanation = response.content.toString();
      this.chatHistory = [
        {
          role: 'system',
          content: 'You are a helpful blockchain expert assistant.',
        },
        { role: 'assistant', content: explanation },
      ];

      return explanation;
    } catch (error) {
      console.error('Error getting AI explanation:', error);
      throw error;
    }
  }

  async getChatResponse(userMessage: string): Promise<string> {
    try {
      // Add user message to history
      this.chatHistory.push({ role: 'user', content: userMessage });

      // Create a chat prompt from history
      const chatPrompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          'You are a helpful blockchain expert assistant. Continue the conversation naturally, maintaining context from previous messages.',
        ],
        ...this.chatHistory.map(
          (msg) => [msg.role, msg.content] as [string, string]
        ),
      ]);

      // Get response using the chat history
      const chain = chatPrompt.pipe(this.model);
      const response = await chain.invoke({});
      const aiResponse = response.content.toString();

      // Add AI response to history
      this.chatHistory.push({ role: 'assistant', content: aiResponse });

      return aiResponse;
    } catch (error) {
      console.error('Error getting chat response:', error);
      throw error;
    }
  }
}
