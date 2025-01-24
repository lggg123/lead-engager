import { generateLocationEmail } from '@/lib/utils/emailGenerator'
import { ContactInfo, LocationResult } from '@/lib/types'

describe('generateLocationEmail', () => {
  const mockContact: ContactInfo = {
    firstName: 'Jeromy',
    lastName: 'Smith',
    email: 'jeromy.smith@example.com',
    title: 'Owner',
    company: 'Burger King'
  }

  const mockLocations: LocationResult[] = [
    {
      name: 'Burger King',
      rating: 3.6,
      address: '5540 Cherry Ave, Long Beach, CA 90805',
      totalRatings: 400
    },
    {
      name: 'Burger King',
      rating: 3.9,
      address: '10134 Artesia Blvd, Bellflower, CA 90706',
      totalRatings: 300
    }
  ]

  it('should generate a personalized email for multiple locations', () => {
    const result = generateLocationEmail(mockContact, mockLocations)

    expect(result).toMatchObject({
      to: mockContact.email,
      subject: expect.stringContaining(mockLocations[0].name)
    })

    // Test HTML content
    expect(result.html).toMatch(new RegExp(mockContact.firstName))
    expect(result.html).toMatch(new RegExp(mockLocations[0].address))
    expect(result.html).toMatch(new RegExp(mockLocations[1].address))
    expect(result.html).toMatch(/3\.6.*and.*3\.9/)
  })

  it('should mention the lowest rating in improvement message', () => {
    const result = generateLocationEmail(mockContact, mockLocations)
    expect(result.html).toMatch(/Your 3\.6 star rating can be improved/)
  })

  it('should include the 77% statistic', () => {
    const result = generateLocationEmail(mockContact, mockLocations)
    expect(result.html).toMatch(/77% of consumers are willing to leave a review/)
  })

  it('should describe the Revues AI product', () => {
    const result = generateLocationEmail(mockContact, mockLocations)
    expect(result.html).toMatch(/Revues AI is a simple and straightforward technology/)
    expect(result.html).toMatch(/unique QR code/)
    expect(result.html).toMatch(/scan, tap, and click submit/)
  })

  it('should have a professional signature', () => {
    const result = generateLocationEmail(mockContact, mockLocations)
    expect(result.html).toMatch(/Best regards,/)
    expect(result.html).toMatch(/\George Lugo/)
    expect(result.html).toMatch(/Account Executive \| Revues AI/)
    expect(result.html).toMatch(/\(562\) 323-4655/)
  })
}) 