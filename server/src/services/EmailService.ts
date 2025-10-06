import nodemailer from 'nodemailer';
import { logger } from './LoggingService.js';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, any>;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private static instance: EmailService;

  private constructor() {
    // Create reusable transporter object using the default SMTP transport
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('SMTP server connection verified');
    } catch (error) {
      logger.error('Error verifying SMTP connection:', error);
      // Don't throw error to allow application to start without email service
    }
  }

  private async renderTemplate(templateName: string, context: Record<string, any> = {}): Promise<string> {
    try {
      const templatePath = path.join(
        __dirname,
        '..',
        'views',
        'emails',
        `${templateName}.ejs`
      );

      const template = await fs.promises.readFile(templatePath, 'utf-8');
      return ejs.render(template, {
        ...context,
        appName: process.env.APP_NAME || 'Collaborative Editor',
        appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
        year: new Date().getFullYear(),
      });
    } catch (error) {
      logger.error(`Error rendering email template ${templateName}:`, error);
      throw new Error(`Failed to render email template: ${templateName}`);
    }
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, template, context = {} } = options;

    try {
      // Don't send emails in test environment
      if (process.env.NODE_ENV === 'test') {
        logger.info(`[TEST] Email would be sent to ${to} with subject: ${subject}`);
        return true;
      }

      const html = await this.renderTemplate(template, context);
      
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Collaborative Editor'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@collabeditor.com'}>`,
        to,
        subject,
        html,
        // Add text version for email clients that don't support HTML
        text: html.replace(/<[^>]*>/g, ''), // Simple HTML to text conversion
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent to ${to} with message ID: ${info.messageId}`, {
        to,
        subject,
        messageId: info.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Error sending email:', error, { to, subject, template });
      throw new Error('Failed to send email');
    }
  }

  public async sendVerificationEmail(email: string, token: string, user: { firstName?: string; username: string }): Promise<boolean> {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'verify-email',
      context: {
        name: user.firstName || user.username,
        verificationUrl,
        token,
      },
    });
  }

  public async sendPasswordResetEmail(email: string, token: string, user: { firstName?: string; username: string }): Promise<boolean> {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        name: user.firstName || user.username,
        resetUrl,
        token,
        expiresIn: '1 hour', // Should match TOKEN_EXPIRY in AuthService
      },
    });
  }

  public async sendWelcomeEmail(email: string, user: { firstName?: string; username: string }): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Collaborative Editor!',
      template: 'welcome',
      context: {
        name: user.firstName || user.username,
        loginUrl: `${process.env.CLIENT_URL}/login`,
      },
    });
  }

  public async sendPasswordChangedNotification(email: string, user: { firstName?: string; username: string }): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Your Password Has Been Changed',
      template: 'password-changed',
      context: {
        name: user.firstName || user.username,
        timestamp: new Date().toLocaleString(),
        supportEmail: process.env.SUPPORT_EMAIL || 'support@collabeditor.com',
      },
    });
  }
}

export default EmailService.getInstance();
