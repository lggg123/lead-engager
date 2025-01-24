import { google } from 'googleapis'

interface ContactRow {
  firstName: string
  lastName: string
  company: string
  email: string
}

export async function readContactsFromSheets(): Promise<ContactRow[]> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    })

    const sheets = google.sheets('v4')
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:D',
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return []
    }

    const headers = rows[0]
    const requiredColumns = ['First Name', 'Last Name', 'Company', 'Email']
    
    const hasAllColumns = requiredColumns.every(col => 
      headers.includes(col)
    )

    if (!hasAllColumns) {
      throw new Error('Missing required columns')
    }

    const firstNameIndex = headers.indexOf('First Name')
    const lastNameIndex = headers.indexOf('Last Name')
    const companyIndex = headers.indexOf('Company')
    const emailIndex = headers.indexOf('Email')

    return rows.slice(1).map(row => ({
      firstName: row[firstNameIndex],
      lastName: row[lastNameIndex],
      company: row[companyIndex],
      email: row[emailIndex]
    }))
  } catch (error) {
    throw error
  }
} 