import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;

function hasSmtpConfig() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass
      }
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, text }) {
  if (hasSmtpConfig()) {
    const result = await getTransporter().sendMail({
      from: env.smtp.from,
      to,
      subject,
      text
    });

    return {
      provider: 'smtp',
      delivered: true,
      messageId: result.messageId
    };
  }

  console.log(`Email mock -> ${to}: ${subject} - ${text}`);
  return {
    provider: 'mock',
    delivered: true
  };
}
