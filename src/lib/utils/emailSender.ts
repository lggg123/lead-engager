import { EmailTemplate } from '../types'
import nodemailer from 'nodemailer'
import { google } from 'googleapis'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
const OAuth2 = google.auth.OAuth2

/**
 * Service for sending emails using Gmail
 */
export class EmailSender {
  private transporter!: nodemailer.Transporter
  private fromEmail: string
  private static isTestEnvironment = false
  private initialized: boolean = false

  static setTestMode(enabled: boolean) {
    EmailSender.isTestEnvironment = enabled
  }

  constructor(fromEmail: string = 'george@revuescentral.com') {
    this.fromEmail = fromEmail
  }

  /**
   * Initializes the email transporter with OAuth2 credentials
   */
  private async initialize() {
    if (this.initialized) return

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
      this.initialized = true
      return
    }

    // Verify required environment variables
    const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN']
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`)
      }
    }

    try {
      const oauth2Client = new OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      )

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      })

      const accessToken = await oauth2Client.getAccessToken()
      if (!accessToken.token) {
        throw new Error('Failed to get access token')
      }

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: this.fromEmail,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
          accessToken: accessToken.token,
        }
      } as SMTPTransport.Options)

      // Verify the connection
      await this.transporter.verify()
      console.log('✅ SMTP connection verified successfully')
      this.initialized = true
    } catch (error) {
      console.error('❌ Error initializing email transporter:', error)
      throw error
    }
  }

  /**
   * Sends an email using the provided template
   * @param template The email template to send
   * @returns The message ID of the sent email
   */
  async sendEmail(template: EmailTemplate): Promise<string> {
    if (!this.initialized) {
      await this.initialize()
    }

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