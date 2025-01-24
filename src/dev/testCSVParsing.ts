require('dotenv').config()

import { createReadStream } from 'fs'
import { parse, Parser } from 'csv-parse'
import path from 'path'

async function testCSVParsing(csvFilePath: string) {
  console.log('\n🔍 Testing CSV parsing...')
  
  // Create CSV parser with strict options
  const parser: Parser = parse({
    delimiter: ',',
    columns: true,
    skip_empty_lines: true,
    trim: true,
    skipRecordsWithEmptyValues: true
  })

  // Process the CSV file
  const processFile = new Promise((resolve, reject) => {
    console.log(`📑 Reading CSV file: ${csvFilePath}`)
    let rowCount = 0
    
    createReadStream(path.resolve(csvFilePath))
      .pipe(parser)
      .on('headers', (headers: string[]) => {
        console.log('\n📋 CSV Headers found:')
        headers.forEach(header => console.log(`  - ${header}`))
        
        // Validate required columns
        const requiredColumns = ['First Name', 'Last Name', 'Email', 'Company']
        const missingColumns = requiredColumns.filter(col => !headers.includes(col))
        
        if (missingColumns.length > 0) {
          reject(new Error(`❌ Missing required columns: ${missingColumns.join(', ')}`))
        } else {
          console.log('✅ All required columns present')
        }
      })
      .on('data', (row: any) => {
        rowCount++
        if (rowCount <= 3) {
          // Print first 3 rows as samples
          console.log(`\n📝 Sample Row ${rowCount}:`)
          console.log('  First Name:', row['First Name'])
          console.log('  Last Name:', row['Last Name'])
          console.log('  Email:', row['Email'])
          console.log('  Company:', row['Company'])
          console.log('  Title:', row['Title'])
        }
      })
      .on('end', () => {
        console.log(`\n📊 Total Rows Processed: ${rowCount}`)
        resolve(null)
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error)
        reject(error)
      })
  })

  try {
    await processFile
    console.log('\n✅ CSV parsing test completed successfully!')
  } catch (error) {
    console.error('\n❌ CSV parsing test failed:', error)
  }
}

// Run the test
const csvFilePath = 'leads.csv'
testCSVParsing(csvFilePath) 