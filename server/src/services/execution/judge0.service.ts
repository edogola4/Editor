import axios from 'axios';
import { env } from '../../config/env';

export interface ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: number | null;
  language_id: number;
}

export class Judge0Service {
  private readonly apiUrl: string;
  private readonly apiKey: string | undefined;
  private readonly headers: Record<string, string>;

  constructor() {
    this.apiUrl = env.JUDGE0_API_URL || 'http://localhost:2358';
    this.apiKey = env.JUDGE0_API_KEY;
    
    this.headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      this.headers['X-RapidAPI-Key'] = this.apiKey;
      this.headers['X-RapidAPI-Host'] = new URL(this.apiUrl).host;
    }
  }

  async executeCode(
    sourceCode: string,
    languageId: number,
    stdin: string = ''
  ): Promise<ExecutionResult> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/submissions?wait=true&base64_encoded=false`,
        {
          source_code: sourceCode,
          language_id: languageId,
          stdin: stdin,
          cpu_time_limit: 5, // 5 seconds max execution time
          memory_limit: 128000, // 128MB memory limit
        },
        { headers: this.headers }
      );

      return response.data as ExecutionResult;
    } catch (error) {
      console.error('Error executing code:', error);
      throw new Error('Failed to execute code');
    }
  }

  async getLanguages() {
    try {
      const response = await axios.get(`${this.apiUrl}/languages`, {
        headers: this.headers,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching languages:', error);
      return [];
    }
  }

  async getStatus() {
    try {
      const response = await axios.get(`${this.apiUrl}/statuses`, {
        headers: this.headers,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching statuses:', error);
      return [];
    }
  }
}

export const judge0Service = new Judge0Service();
