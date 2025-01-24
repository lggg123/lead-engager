import { EmailSender } from '@/lib/utils/emailSender'
import { EmailTemplate } from '@/lib/types'
import nodemailer from 'nodemailer'

// Enable test mode
EmailSender.setTestMode(true)

// Mock nodemailer
jest.mock('nodemailer', () => {
  const mockSendMail = jest.fn()
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: mockSendMail
    })
  }
})

describe('EmailSender', () => {
  let emailSender: EmailSender
  let mockSendMail: jest.Mock

  const mockTemplate: EmailTemplate = {
    to: 'test@example.com',
    subject: 'Test Subject',
    html: '<p>Test content</p>'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    emailSender = new EmailSender()
    mockSendMail = (nodemailer.createTransport() as any).sendMail
  })

  afterAll(() => {
    EmailSender.setTestMode(false)
  })

  it('should successfully send an email', async () => {
    const mockMessageId = 'message_123'
    mockSendMail.mockResolvedValue({ messageId: mockMessageId })

    const result = await emailSender.sendEmail(mockTemplate)

    expect(result).toBe(mockMessageId)
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'george@revuescentral.com',
      to: mockTemplate.to,
      subject: mockTemplate.subject,
      html: mockTemplate.html,
      attachments: undefined
    })
  })

  it('should allow custom from email', async () => {
    const customFromEmail = 'custom@example.com'
    const customEmailSender = new EmailSender(customFromEmail)
    
    mockSendMail.mockResolvedValue({ messageId: 'message_123' })

    await customEmailSender.sendEmail(mockTemplate)

    expect(mockSendMail).toHaveBeenCalledWith({
      from: customFromEmail,
      to: mockTemplate.to,
      subject: mockTemplate.subject,
      html: mockTemplate.html,
      attachments: undefined
    })
  })

  it('should handle email sending errors', async () => {
    const errorMessage = 'Failed to send'
    mockSendMail.mockRejectedValue(new Error(errorMessage))

    await expect(emailSender.sendEmail(mockTemplate)).rejects
      .toThrow(`Email sending failed: ${errorMessage}`)
  })
}) 