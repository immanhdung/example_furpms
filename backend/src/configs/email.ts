import nodemailer from 'nodemailer';
import { logger } from './logger';

export const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async (options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<void> => {
  const transporter = createTransporter();
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'FURPMS'}" <${process.env.EMAIL_FROM || 'noreply@furpms.edu.vn'}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};
