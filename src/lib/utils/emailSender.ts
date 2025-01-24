import { EmailTemplate } from '@/lib/types'
import nodemailer from 'nodemailer'
import { google } from 'googleapis'
import type { TransportOptions } from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
const OAuth2 = google.auth.OAuth2

/**
 * Service for sending emails using Gmail
 */
export class EmailSender {
  private transporter!: nodemailer.Transporter
  private fromEmail: string
  private static isTestEnvironment = false

  static setTestMode(enabled: boolean) {
    EmailSender.isTestEnvironment = enabled
  }

  constructor(fromEmail: string = 'george@revuescentral.com') {
    this.fromEmail = fromEmail
    
    if (EmailSender.isTestEnvironment) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: this.fromEmail,
          pass: 'test-password'
        }
      } as SMTPTransport.Options)
      return
    }

    const oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    )

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    })

    const createTransporter = async () => {
      const accessToken = await oauth2Client.getAccessToken()
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: this.fromEmail,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
          accessToken: accessToken.token || '',
        }
      } as SMTPTransport.Options)
    }

    createTransporter()
  }

  /**
   * Sends an email using the provided template
   * @param template The email template to send
   * @returns The message ID of the sent email
   */
  async sendEmail(template: EmailTemplate): Promise<string> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: template.to,
        subject: template.subject,
        html: template.html,
        attachments: template.attachments
      })

      return info.messageId
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Email sending failed: ${error.message}`)
      }
      throw new Error('Email sending failed: Unknown error')
    }
  }
} 