import dotenv from 'dotenv';

dotenv.config();

interface EmailConfig {
  // SMTP Configuration
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    // Connection timeout in milliseconds
    connectionTimeout?: number;
    // Log SMTP traffic (useful for debugging)
    debug?: boolean;
  };
  
  // Email sender information
  sender: {
    name: string;
    email: string;
  };
  
  // Support contact information
  support: {
    email: string;
    name: string;
  };
  
  // Email templates configuration
  templates: {
    dir: string;
    defaultLayout: string;
  };
  
  // Email sending behavior
  behavior: {
    // Whether to actually send emails or just log them (useful for development)
    sendEmails: boolean;
    // Whether to log email content to console (for debugging)
    logEmails: boolean;
    // Default locale for emails
    defaultLocale: string;
  };
  
  // Rate limiting for emails
  rateLimit: {
    // Maximum number of emails that can be sent per hour
    maxPerHour: number;
    // Maximum number of password reset emails per day per user
    maxPasswordResetsPerDay: number;
  };
}

const emailConfig: EmailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
    connectionTimeout: 10000, // 10 seconds
    debug: process.env.NODE_ENV === 'development',
  },
  
  sender: {
    name: process.env.EMAIL_FROM_NAME || 'Collaborative Editor',
    email: process.env.EMAIL_FROM_ADDRESS || 'noreply@collabeditor.com',
  },
  
  support: {
    name: process.env.SUPPORT_NAME || 'Collaborative Editor Support',
    email: process.env.SUPPORT_EMAIL || 'support@collabeditor.com',
  },
  
  templates: {
    dir: process.env.EMAIL_TEMPLATES_DIR || 'src/views/emails',
    defaultLayout: 'base',
  },
  
  behavior: {
    sendEmails: process.env.SEND_EMAILS !== 'false',
    logEmails: process.env.LOG_EMAILS === 'true' || process.env.NODE_ENV !== 'production',
    defaultLocale: process.env.DEFAULT_LOCALE || 'en',
  },
  
  rateLimit: {
    maxPerHour: parseInt(process.env.EMAIL_RATE_LIMIT || '100'),
    maxPasswordResetsPerDay: parseInt(process.env.PASSWORD_RESET_LIMIT || '5'),
  },
};

export default emailConfig;
