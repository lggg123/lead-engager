import { generateLocationEmail } from '@/lib/utils/emailGenerator'
import { EmailSender } from '@/lib/utils/emailSender'
import { ContactInfo, LocationResult } from '@/lib/types'
import { findLowRatedLocations } from '@/lib/utils/locationFinder'
import { LocationCache } from '@/lib/utils/locationCache'
import { createReadStream } from 'fs'
import { parse, Parser } from 'csv-parse'
import path from 'path'

type CSVRow = string[]

async function processCSVRow(
  row: CSVRow,
  headers: string[],
  emailSender: EmailSender,
  locationCache: LocationCache,
  centerLocation: { lat: number; lng: number },
  rowNumber: number
): Promise<void> {
  console.log(`\n========== Processing Row ${rowNumber} ==========`)
  
  // Map CSV row to ContactInfo
  const contact: ContactInfo = {
    firstName: row[headers.indexOf('First Name')],
    lastName: row[headers.indexOf('Last Name')],
    email: row[headers.indexOf('Email')],
    company: row[headers.indexOf('Company')],
    title: row[headers.indexOf('Title')] || undefined
  }

  console.log(`Contact: ${contact.firstName} ${contact.lastName} (${contact.email})`)
  console.log(`Company: ${contact.company}`)

  try {
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
  } catch (error) {
    console.error(`❌ Error processing contact ${contact.email}:`, error)
  }
  
  console.log('==========================================\n')
}

async function sendLocationEmails(csvFilePath: string, centerLocation: { lat: number; lng: number }) {
  console.log('\n🚀 Starting email campaign...')
  const emailSender = new EmailSender()
  const locationCache = new LocationCache()
  
  // Load existing cache data
  console.log('📂 Loading cache...')
  await locationCache.load()
  const processedCount = locationCache.getProcessedEmailCount()
  console.log(`📊 Found ${processedCount} previously processed emails`)

  // Create CSV parser
  const parser: Parser = parse({
    delimiter: ',',
    from_line: 1 // Start from first line to get headers
  })

  let headers: string[] = []
  let isFirstRow = true
  let rowNumber = 0

  // Process the CSV file
  const processFile = new Promise((resolve, reject) => {
    console.log(`📑 Reading CSV file: ${csvFilePath}`)
    createReadStream(path.resolve(csvFilePath))
      .pipe(parser)
      .on('data', async (row: CSVRow) => {
        if (isFirstRow) {
          headers = row
          console.log('📋 CSV Headers:', headers.join(', '))
          isFirstRow = false
          return
        }
        
        rowNumber++
        // Pause the stream while processing the row
        parser.pause()
        await processCSVRow(row, headers, emailSender, locationCache, centerLocation, rowNumber)
        parser.resume()
      })
      .on('end', () => {
        console.log('\n📊 Final Statistics:')
        console.log(`📧 Total Rows Processed: ${rowNumber}`)
        console.log(`✅ Processed Emails: ${locationCache.getProcessedEmailCount()}`)
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

// Example usage:
if (require.main === module) {
  const csvFilePath = 'leads.csv' // CSV file in project root
  const centerLocation = {
    lat: 33.8617,
    lng: -118.1671
  }

  sendLocationEmails(csvFilePath, centerLocation)
    .then(() => console.log('🎉 Script finished successfully'))
    .catch(error => console.error('❌ Script failed:', error))
} 