import nodemailer from 'nodemailer';
import { config } from '../config/config.js';
import path from 'path';
import fs from 'fs';
import ejs from 'ejs';
import { UserRole } from '../models/Room.js';

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: config.email.smtp.secure, // true for 465, false for other ports
  auth: {
    user: config.email.smtp.auth.user,
    pass: config.email.smtp.auth.pass,
  },
});

// Load email templates
const invitationTemplate = fs.readFileSync(
  path.join(__dirname, '../../templates/emails/room-invitation.ejs'),
  'utf-8'
);

// Types for email data
type InvitationEmailData = {
  inviterName: string;
  roomName: string;
  role: UserRole;
  acceptUrl: string;
  expiresInHours: number;
};

/**
 * Send a room invitation email
 * @param to Email address of the recipient
 * @param data Invitation data
 * @param subject Optional custom subject
 * @returns Promise that resolves when the email is sent
 */
export const sendInvitationEmail = async (
  to: string,
  data: InvitationEmailData,
  subject = `You've been invited to join a room`
): Promise<void> => {
  try {
    // Render the email template with the provided data
    const html = ejs.render(invitationTemplate, {
      ...data,
      currentYear: new Date().getFullYear(),
      appName: config.app.name,
    });

    // Send the email
    await transporter.sendMail({
      from: `"${config.email.from.name}" <${config.email.from.address}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
};

/**
 * Send a password reset email
 * @param to Email address of the recipient
 * @param resetUrl Password reset URL
 * @param expiresInMinutes Expiration time in minutes
 * @returns Promise that resolves when the email is sent
 */
export const sendPasswordResetEmail = async (
  to: string,
  resetUrl: string,
  expiresInMinutes: number
): Promise<void> => {
  try {
    const subject = 'Password Reset Request';
    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in ${expiresInMinutes} minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await transporter.sendMail({
      from: `"${config.email.from.name}" <${config.email.from.address}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send a verification email
 * @param to Email address of the recipient
 * @param verificationUrl Verification URL
 * @returns Promise that resolves when the email is sent
 */
export const sendVerificationEmail = async (
  to: string,
  verificationUrl: string
): Promise<void> => {
  try {
    const subject = 'Verify Your Email Address';
    const html = `
      <h2>Welcome to ${config.app.name}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationUrl}">Verify Email</a></p>
      <p>If you didn't create an account, please ignore this email.</p>
    `;

    await transporter.sendMail({
      from: `"${config.email.from.name}" <${config.email.from.address}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
};
