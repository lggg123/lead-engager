import { readContactsFromCsv } from '@/lib/utils/csvReader'
import fs from 'fs/promises'

jest.mock('fs/promises', () => ({
  readFile: jest.fn()
}))

describe('readContactsFromCsv', () => {
  let mockReadFile: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockReadFile = fs.readFile as jest.Mock
  })

  it('should successfully parse data from CSV', async () => {
    const csvContent = `First Name,Last Name,Company,Email
Brian,Kierath,Burger King,brian.kierath@whopper.com
Ahmed,Riad,Popeyes Louisiana Kitchen,ahmed.riad@popeyes.com`

    mockReadFile.mockResolvedValueOnce(csvContent)

    const result = await readContactsFromCsv()

    expect(result).toStrictEqual([
      { 
        firstName: 'Brian',
        lastName: 'Kierath',
        company: 'Burger King',
        email: 'brian.kierath@whopper.com'
      },
      {
        firstName: 'Ahmed',
        lastName: 'Riad',
        company: 'Popeyes Louisiana Kitchen',
        email: 'ahmed.riad@popeyes.com'
      }
    ])
  })

  it('should handle empty CSV file', async () => {
    mockReadFile.mockResolvedValueOnce('First Name,Last Name,Company,Email\n')
    const result = await readContactsFromCsv()
    expect(result).toStrictEqual([])
  })

  it('should handle missing required columns', async () => {
    const csvContent = `First Name,Company,Email
Brian,Burger King,brian.kierath@whopper.com`

    mockReadFile.mockResolvedValueOnce(csvContent)

    await expect(readContactsFromCsv())
      .rejects.toThrow('Missing required columns')
  })

  it('should handle file read errors', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('File not found'))
    await expect(readContactsFromCsv())
      .rejects.toThrow('File not found')
  })
}) 