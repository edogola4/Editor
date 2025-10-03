import { UserInstance } from '../../../models/User.js';

declare global {
  namespace Express {
    interface User extends UserInstance {}
    
    interface SessionData {
      oauthState?: string;
      // Add other session properties as needed
    }
  }
}

export {};
