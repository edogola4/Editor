import { Request, Response } from 'express';
import { judge0Service } from '../services/execution/judge0.service';

export class ExecutionController {
  async executeCode(req: Request, res: Response) {
    try {
      const { sourceCode, languageId, stdin } = req.body;
      
      if (!sourceCode || languageId === undefined) {
        return res.status(400).json({ 
          error: 'sourceCode and languageId are required' 
        });
      }

      const result = await judge0Service.executeCode(
        sourceCode,
        languageId,
        stdin
      );

      res.json(result);
    } catch (error) {
      console.error('Execution error:', error);
      res.status(500).json({ 
        error: 'Failed to execute code',
        details: error.message 
      });
    }
  }

  async getLanguages(_req: Request, res: Response) {
    try {
      const languages = await judge0Service.getLanguages();
      res.json(languages);
    } catch (error) {
      console.error('Error fetching languages:', error);
      res.status(500).json({ 
        error: 'Failed to fetch languages',
        details: error.message 
      });
    }
  }
}

export const executionController = new ExecutionController();
