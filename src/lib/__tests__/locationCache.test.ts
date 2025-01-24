import { LocationCache } from '@/lib/utils/locationCache'
import { LocationResult } from '@/lib/types'

describe('LocationCache', () => {
  let cache: LocationCache

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

  beforeEach(() => {
    cache = new LocationCache()
  })

  it('should store and retrieve locations', () => {
    cache.set('Burger King', mockLocations)
    const retrieved = cache.get('Burger King')
    expect(retrieved).toEqual(mockLocations)
  })

  it('should return null for non-existent company', () => {
    const retrieved = cache.get('Non Existent Company')
    expect(retrieved).toBeNull()
  })

  it('should check if company exists in cache', () => {
    cache.set('Burger King', mockLocations)
    expect(cache.has('Burger King')).toBe(true)
    expect(cache.has('Non Existent Company')).toBe(false)
  })

  it('should track cache hits', () => {
    cache.set('Burger King', mockLocations)
    
    // Access the cache multiple times
    cache.get('Burger King')
    cache.get('Burger King')
    cache.get('Burger King')

    const stats = cache.getStats()
    expect(stats).toContainEqual({
      company: 'Burger King',
      hits: 3
    })
  })

  it('should clear the cache', () => {
    cache.set('Burger King', mockLocations)
    cache.clear()
    
    expect(cache.has('Burger King')).toBe(false)
    expect(cache.get('Burger King')).toBeNull()
    expect(cache.getStats()).toHaveLength(0)
  })

  it('should handle multiple companies', () => {
    const mcdonaldsLocations: LocationResult[] = [
      {
        name: "McDonald's",
        rating: 3.8,
        address: '123 Main St',
        totalRatings: 500
      }
    ]

    cache.set('Burger King', mockLocations)
    cache.set("McDonald's", mcdonaldsLocations)

    expect(cache.get('Burger King')).toEqual(mockLocations)
    expect(cache.get("McDonald's")).toEqual(mcdonaldsLocations)
  })
}) 