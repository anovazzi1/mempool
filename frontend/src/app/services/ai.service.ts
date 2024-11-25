import { Injectable } from '@angular/core';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { environment } from '../../environments/environment';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { SearchApi } from '@langchain/community/tools/searchapi';
import * as pdfjsLib from 'pdfjs-dist';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private model: ChatOpenAI;
  private promptTemplate: ChatPromptTemplate;
  private chatHistory: { role: string; content: string }[] = [];
  private vectorStore: MemoryVectorStore | null = null;
  private searchTool: SearchApi;

  constructor() {
    // Initialize PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.mjs';

    // Initialize the ChatOpenAI model
    this.model = new ChatOpenAI({
      openAIApiKey: environment.OPENAI_API_KEY,
      modelName: 'gpt-4-vision-preview',
      maxTokens: 500,
      temperature: 0.5,
    });

    // Initialize SearchApi tool
    this.searchTool = new SearchApi(environment.SEARCH_API_KEY, {
      engine: 'google',
    });

    // Initialize PDF processing
    this.initializePDFContext();

    // Create a multimodal prompt template
    this.promptTemplate = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a blockchain expert explaining Bitcoin-related information to a beginner.
        Analyze all the provided data carefully and generate a clear, concise explanation.
        Your explanation should be simple and accessible for someone with little or no prior knowledge of blockchain or cryptocurrencies.
        Use the additional context provided to enhance your explanations when relevant.`,
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
      ['system', `Additional context: {contextData}`],
      [
        'user',
        [
          { type: 'image_url', image_url: '{imageData}' },
          { type: 'text', text: '{parsedData}' },
        ],
      ],
    ]);
  }

  private async initializePDFContext(): Promise<void> {
    try {
      // Load PDF from resources directory
      const pdfPath =
        '/resources/OReilly.Mastering.Bitcoin.2nd.Edition.2017.6.pdf';
      const pdf = await pdfjsLib.getDocument(pdfPath).promise;

      let fullText = '';

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      // Split the text into chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const splits = await textSplitter.splitText(fullText);

      // Create documents from splits
      const docs = splits.map((split) => ({
        pageContent: split,
        metadata: {},
      }));

      // Create vector store
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        docs,
        new OpenAIEmbeddings({
          openAIApiKey: environment.OPENAI_API_KEY,
        })
      );
    } catch (error) {
      console.error('Error initializing PDF context:', error);
    }
  }

  private async getRelevantContext(query: string): Promise<string> {
    if (!this.vectorStore) {
      return '';
    }

    const relevantDocs = await this.vectorStore.similaritySearch(query, 2);
    return relevantDocs.map((doc) => doc.pageContent).join('\n');
  }

  private async performWebSearch(query: string): Promise<string> {
    try {
      const searchResults = await this.searchTool.invoke(query);
      return searchResults;
    } catch (error) {
      console.error('Error performing web search:', error);
      return '';
    }
  }

  private async generateQuestionsFromData(data: string): Promise<string[]> {
    const questionPrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are an expert at breaking down information into key questions.
        Given the following data, generate 2-3 specific questions that would help gather relevant context.
        Return only the questions, separated by newlines, without any additional text or numbering.`
      ],
      ['user', data]
    ]);

    const chain = questionPrompt.pipe(this.model);
    const response = await chain.invoke({});
    return response.content.toString().split('\n').filter(q => q.trim());
  }

  async getExplanation(
    options: { useRAG: boolean; useWeb: boolean },
    imageData: string,
    parsedData?: string
  ): Promise<string> {
    try {
      var context = '';

      if (parsedData) {
        // Generate questions from the parsed data
        const questions = await this.generateQuestionsFromData(parsedData);

        if (options.useWeb) {
          // Perform web search for each question
          const webSearchPromises = questions.map(q => this.performWebSearch(q));
          const webResults = await Promise.all(webSearchPromises);
          const relevantWebResults = webResults.filter(result => result).join('\n\n');
          if (relevantWebResults) {
            context += `Web Search Results:\n${relevantWebResults}\n\n`;
          }
        }

        if (options.useRAG) {
          // Perform RAG search for each question
          const ragPromises = questions.map(q => this.getRelevantContext(q));
          const ragResults = await Promise.all(ragPromises);
          const relevantRagResults = ragResults.filter(result => result).join('\n\n');
          if (relevantRagResults) {
            context += `RAG Results:\n${relevantRagResults}\n\n`;
          }
        }
      }

      const chain = this.promptTemplate.pipe(this.model);
      const response = await chain.invoke({
        imageData,
        parsedData: parsedData || '',
        contextData: context,
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
      console.log(imageData);
      console.log(parsedData);
      throw error;
    }
  }

  async getChatResponse(
    userMessage: string,
    options: { useRAG: boolean; useWeb: boolean }
  ): Promise<string> {
    try {
      let context = '';
      // Add user message to history
      this.chatHistory.push({ role: 'user', content: userMessage });

      // Generate questions from the user message
      const questions = await this.generateQuestionsFromData(userMessage);

      if (options.useWeb) {
        // Perform web search for each question
        const webSearchPromises = questions.map(q => this.performWebSearch(q));
        const webResults = await Promise.all(webSearchPromises);
        const relevantWebResults = webResults.filter(result => result).join('\n\n');
        if (relevantWebResults) {
          context += `Web Search Results:\n${relevantWebResults}\n\n`;
        }
      }

      if (options.useRAG) {
        // Perform RAG search for each question
        const ragPromises = questions.map(q => this.getRelevantContext(q));
        const ragResults = await Promise.all(ragPromises);
        const relevantRagResults = ragResults.filter(result => result).join('\n\n');
        if (relevantRagResults) {
          context += `RAG Results:\n${relevantRagResults}\n\n`;
        }
      }

      // Create a chat prompt from history, including context
      const chatPrompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          'You are a helpful blockchain expert assistant. Continue the conversation naturally, maintaining context from previous messages.',
        ],
        ...this.chatHistory.map(
          (msg) => [msg.role, msg.content] as [string, string]
        ),
        ['system', `Additional context: ${context}`],
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
