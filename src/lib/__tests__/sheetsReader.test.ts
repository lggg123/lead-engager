import { readContactsFromSheets } from '@/lib/utils/sheetsReader'
import { google } from 'googleapis'

jest.mock('googleapis', () => {
  const mockSpreadsheetValues = {
    get: jest.fn()
  }

  return {
    google: {
      sheets: jest.fn(() => ({
        spreadsheets: {
          values: mockSpreadsheetValues
        }
      })),
      auth: {
        GoogleAuth: jest.fn().mockImplementation(() => ({
          getClient: jest.fn().mockResolvedValue({})
        }))
      }
    }
  }
})

describe('readContactsFromSheets', () => {
  let mockGet: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GOOGLE_SHEET_ID = 'test-sheet-id'
    process.env.GOOGLE_CREDENTIALS = JSON.stringify({
      client_email: 'test@example.com',
      private_key: 'test-key'
    })
    
    const sheets = google.sheets('v4')
    mockGet = sheets.spreadsheets.values.get as jest.Mock
    mockGet.mockImplementation(() => 
      Promise.resolve({
        data: {
          values: []
        }
      })
    )
  })

  it('should successfully fetch and parse data from Google Sheets', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        values: [
          ['First Name', 'Last Name', 'Company', 'Email'],
          ['John', 'Doe', 'Acme Inc', 'john@acme.com']
        ]
      }
    })

    const result = await readContactsFromSheets()

    expect(result).toStrictEqual([
      { 
        firstName: 'John',
        lastName: 'Doe',
        company: 'Acme Inc',
        email: 'john@acme.com'
      }
    ])

    expect(mockGet).toHaveBeenCalledWith({
      auth: expect.any(Object),
      spreadsheetId: 'test-sheet-id',
      range: 'Sheet1!A:D'
    })
  })

  it('should handle empty response from Google Sheets', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        values: [['First Name', 'Last Name', 'Company', 'Email']]
      }
    })

    const result = await readContactsFromSheets()
    expect(result).toStrictEqual([])
  })

  it('should handle missing required columns', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        values: [
          ['First Name', 'Company', 'Email'], // Missing Last Name
          ['John', 'Acme Inc', 'john@acme.com']
        ]
      }
    })

    await expect(readContactsFromSheets())
      .rejects.toThrow('Missing required columns')
  })

  it('should handle invalid credentials error', async () => {
    mockGet.mockRejectedValueOnce(new Error('Invalid credentials'))
    await expect(readContactsFromSheets())
      .rejects.toThrow('Invalid credentials')
  })
}) 