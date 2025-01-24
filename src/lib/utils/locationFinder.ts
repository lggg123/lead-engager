import { 
  Client,
  PlaceDetailsResponse
} from '@googlemaps/google-maps-services-js'

interface Location {
  lat: number
  lng: number
}

interface LocationSearchParams {
  companyName: string
  centerLocation: Location
  radiusInMiles: number
  maxRating: number
  minRatings: number
}

interface LocationResult {
  name: string
  rating: number
  address: string
  totalRatings: number
}

const METERS_PER_MILE = 1609.34

export async function findLowRatedLocations(params: LocationSearchParams): Promise<LocationResult[]> {
  const client = new Client({})
  const { companyName, centerLocation, radiusInMiles, maxRating, minRatings } = params

  try {
    // Search for places
    const searchResponse = await client.textSearch({
      params: {
        query: companyName,
        location: centerLocation,
        radius: radiusInMiles * METERS_PER_MILE,
        key: process.env.GOOGLE_MAPS_API_KEY || ''
      }
    })

    if (searchResponse.data.status !== 'OK' || !searchResponse.data.results.length) {
      return []
    }

    // Get details for each place
    const detailsPromises = searchResponse.data.results.map(place => 
      client.placeDetails({
        params: {
          place_id: place.place_id!,
          key: process.env.GOOGLE_MAPS_API_KEY || ''
        }
      })
    )

    const detailsResponses = await Promise.all(detailsPromises)

    // Filter and map the results
    return detailsResponses
      .filter(response => {
        const { rating, user_ratings_total } = response.data.result
        return (
          rating !== undefined &&
          rating <= maxRating &&
          user_ratings_total !== undefined &&
          user_ratings_total >= minRatings
        )
      })
      .map(response => ({
        name: response.data.result.name!,
        rating: response.data.result.rating || 0,
        address: response.data.result.formatted_address!,
        totalRatings: response.data.result.user_ratings_total || 0
      }))
      .slice(0, 3) // Return only top 3 results
  } catch (error) {
    console.error('Error finding locations:', error)
    return []
  }
} 