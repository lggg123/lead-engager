import { ContactInfo, LocationResult, EmailTemplate } from '@/lib/types'
import path from 'path'

/**
 * Generates a personalized email for a contact regarding low-rated locations
 * @param contact The contact information of the recipient
 * @param locations Array of location details with low ratings
 * @returns An email template with personalized content
 */
export function generateLocationEmail(
  contact: ContactInfo,
  locations: LocationResult[]
): EmailTemplate {
  // Format locations string and find lowest rating
  const locationsList = locations.map(loc => 
    `${loc.address} has Google ratings of ${loc.rating}`
  ).join(' and ')
  
  const lowestRating = Math.min(...locations.map(loc => loc.rating))

  // Get absolute path to logo
  const logoPath = path.join(process.cwd(), 'public', 'assets', 'images', 'revues-logo.png')

  // Create HTML signature with logo
  const signature = `
    <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
      <p style="margin: 0;">Best regards,</p>
      <p style="margin: 0;">George Lugo</p>
      <p style="margin: 0; color: #666;">Account Executive | Revues AI</p>
      <p style="margin: 0;">(562) 323-4655</p>
      <div style="margin-top: 15px;">
        <img src="cid:revues-logo" alt="Revues AI" style="height: 40px; width: auto;">
      </div>
    </div>
  `.trim()

  const emailContent = `
    Hi ${contact.firstName},\n\n

    I noticed the businesses at locations ${locationsList} respectively.\n\n

    Your ${lowestRating} star rating can be improved upon pretty easily. 77% of consumers are willing to leave a review if asked.\n\n

    Revues AI is a simple and straightforward technology that makes it easier for customers to leave high quality, SEO rich reviews.\n\n

    We'd give you a unique QR code to put into your customer communications (post service). All customers have to do is scan, tap, and click submit and we'll start generating strong reviews and ratings for your business.\n\n

    It's a minimal effort solution for a high impact return.\n\n

    Let me know if you're open to trying it for a few weeks.\n\n

    ${signature}
  `.trim().replace(/\n\s+/g, '\n')

  return {
    to: contact.email,
    subject: `Improve ${locations[0].name} Customer Reviews`,
    html: emailContent.replace(/\n/g, '<br><br>'),
    attachments: [
      {
        filename: 'revues-logo.png',
        path: logoPath,
        cid: 'revues-logo' // Content ID referenced in the HTML
      }
    ]
  }
} 