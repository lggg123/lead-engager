require('dotenv').config()

import { generateLocationEmail } from '../lib/utils/emailGenerator'
import { EmailSender } from '../lib/utils/emailSender'
import { ContactInfo, LocationResult } from '../lib/types'
import { findLowRatedLocations } from '../lib/utils/locationFinder'
import { LocationCache } from '../lib/utils/locationCache'
import { createReadStream } from 'fs'
import { parse, Parser } from 'csv-parse'
import path from 'path'

// Verify environment variables are loaded
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REFRESH_TOKEN',
  'GOOGLE_MAPS_API_KEY'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

console.log('Environment variables loaded successfully')

async function sendLocationEmails(csvFilePath: string, centerLocation: { lat: number; lng: number }) {
  console.log('\n🚀 Starting email campaign...')
  
  // Initialize services
  console.log('🔧 Initializing services...')
  const emailSender = new EmailSender()
  const locationCache = new LocationCache()
  
  // Load existing cache data
  console.log('📂 Loading cache...')
  await locationCache.load()
  const processedCount = locationCache.getProcessedEmailCount()
  console.log(`📊 Found ${processedCount} previously processed emails`)

  // Create CSV parser with strict options
  const parser: Parser = parse({
    delimiter: ',',
    columns: true, // Use first row as headers
    skip_empty_lines: true,
    trim: true,
    skipRecordsWithEmptyValues: true
  })

  // Process the CSV file
  const processFile = new Promise((resolve, reject) => {
    console.log(`📑 Reading CSV file: ${csvFilePath}`)
    
    createReadStream(path.resolve(csvFilePath))
      .pipe(parser)
      .on('headers', (headers: string[]) => {
        console.log('📋 CSV Headers:', headers.join(', '))
        
        // Validate required columns with actual column names from file
        const columnMap = {
          firstName: 'First Name',
          lastName: 'Last Name',
          email: 'Email',
          company: 'Company'
        }
        
        const missingColumns = Object.values(columnMap).filter(col => !headers.includes(col))
        
        if (missingColumns.length > 0) {
          reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`))
        }
      })
      .on('data', async (row: any) => {
        // Pause the stream while processing the row
        parser.pause()
        
        const contact: ContactInfo = {
          firstName: row['First Name'],
          lastName: row['Last Name'],
          email: row['Email'],
          company: row['Company'],
          title: row['Title']
        }

        try {
          await processContact(contact, emailSender, locationCache, centerLocation)
        } catch (error) {
          console.error(`❌ Error processing contact ${contact.email}:`, error)
        }

        parser.resume()
      })
      .on('end', () => {
        console.log('\n📊 Final Statistics:')
        console.log(`📧 Total Emails Processed: ${locationCache.getProcessedEmailCount()}`)
        console.log('\n📈 Cache Statistics:')
        locationCache.getStats().forEach(({ company, hits }) => {
          console.log(`${company}: ${hits} cache hits`)
        })
        resolve(null)
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error)
        reject(error)
      })
  })

  await processFile
  console.log('\n✨ Email campaign completed!')
}

async function processContact(
  contact: ContactInfo,
  emailSender: EmailSender,
  locationCache: LocationCache,
  centerLocation: { lat: number; lng: number }
): Promise<void> {
  console.log(`\n========== Processing Contact: ${contact.firstName} ${contact.lastName} ==========`)
  console.log(`📧 Email: ${contact.email}`)
  console.log(`🏢 Company: ${contact.company}`)

  // Skip if email already processed
  if (locationCache.isEmailProcessed(contact.email)) {
    console.log('⏭️  Skipping: Email already processed')
    return
  }

  // Try to get locations from cache first
  let locations = locationCache.get(contact.company)

  // If not in cache, fetch from API
  if (!locations) {
    console.log('🔍 Location not in cache, fetching from API...')
    locations = await findLowRatedLocations({
      companyName: contact.company,
      centerLocation,
      radiusInMiles: 25,
      maxRating: 4.0,
      minRatings: 100
    })
    console.log(`📍 Found ${locations.length} locations for ${contact.company}`)
    locationCache.set(contact.company, locations)
    await locationCache.save()
    console.log('💾 Saved locations to cache')
  } else {
    console.log(`📂 Using ${locations.length} cached locations for ${contact.company}`)
  }

  if (locations.length === 0) {
    console.log('❌ No low-rated locations found')
    return
  }

  // Generate and send email
  console.log('📧 Generating email...')
  const emailTemplate = generateLocationEmail(contact, locations)
  console.log('📤 Sending email...')
  const emailId = await emailSender.sendEmail(emailTemplate)
  console.log(`✅ Email sent successfully (ID: ${emailId})`)
  
  // Mark as processed and save cache
  locationCache.markEmailProcessed(contact.email)
  await locationCache.save()
  console.log('💾 Updated processed emails cache')

  // Wait between sends to avoid rate limits
  console.log('⏳ Waiting before next operation...')
  await new Promise(resolve => setTimeout(resolve, 1000))
}

// Example usage:
if (require.main === module) {
  const csvFilePath = 'leads.csv'
  const centerLocation = {
    lat: 33.8617,
    lng: -118.1671
  }

  sendLocationEmails(csvFilePath, centerLocation)
    .then(() => console.log('🎉 Script finished successfully'))
    .catch(error => console.error('❌ Script failed:', error))
} 