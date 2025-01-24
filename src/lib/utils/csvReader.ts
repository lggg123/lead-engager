import fs from 'fs/promises'
import path from 'path'

interface ContactRow {
  firstName: string
  lastName: string
  company: string
  email: string
}

export async function readContactsFromCsv(filePath: string = 'leads.csv'): Promise<ContactRow[]> {
  try {
    const csvContent = await fs.readFile(path.join(process.cwd(), filePath), 'utf-8')
    const rows = csvContent.split('\n')
    
    // Get headers and validate required columns
    const headers = rows[0].split(',')
    const requiredColumns = ['First Name', 'Last Name', 'Company', 'Email']
    
    const hasAllColumns = requiredColumns.every(col => 
      headers.includes(col)
    )

    if (!hasAllColumns) {
      throw new Error('Missing required columns')
    }

    // Find column indexes
    const firstNameIndex = headers.indexOf('First Name')
    const lastNameIndex = headers.indexOf('Last Name')
    const companyIndex = headers.indexOf('Company')
    const emailIndex = headers.indexOf('Email')

    // Skip header row and empty rows
    const dataRows = rows.slice(1).filter(row => row.trim())

    return dataRows.map(row => {
      const columns = row.split(',')
      return {
        firstName: columns[firstNameIndex],
        lastName: columns[lastNameIndex],
        company: columns[companyIndex],
        email: columns[emailIndex]
      }
    })
  } catch (error) {
    throw error
  }
} 