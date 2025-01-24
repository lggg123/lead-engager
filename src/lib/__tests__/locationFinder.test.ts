import { findLowRatedLocations } from '@/lib/utils/locationFinder'
import { 
  Client, 
  PlacesNearbyResponse, 
  PlaceDetailsResponse,
  PlacesNearbyResponseData,
  AddressGeometry
} from '@googlemaps/google-maps-services-js'
import { AxiosHeaders } from 'axios'

// Define interfaces we need
interface LatLngBounds {
  northeast: { lat: number; lng: number }
  southwest: { lat: number; lng: number }
}

// Define Status enum since the import might not be working correctly
enum Status {
  OK = 'OK',
  ZERO_RESULTS = 'ZERO_RESULTS',
  OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
  REQUEST_DENIED = 'REQUEST_DENIED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Create interfaces for our mocked client
interface MockedClient extends Client {
  textSearch: jest.Mock
  placeDetails: jest.Mock
}

const mockBounds: LatLngBounds = {
  northeast: { lat: 40.7580, lng: -73.9855 },
  southwest: { lat: 40.7128, lng: -74.0060 }
}

const mockHeaders = new AxiosHeaders({
  'Content-Type': 'application/json'
})

// First, modify the mock setup
jest.mock('@googlemaps/google-maps-services-js', () => {
  const mockClient = {
    textSearch: jest.fn(),
    placeDetails: jest.fn()
  }
  return {
    Client: jest.fn(() => mockClient)
  }
})

describe('findLowRatedLocations', () => {
  let mockClient: MockedClient
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Get the mocked client instance
    mockClient = new (jest.requireMock('@googlemaps/google-maps-services-js').Client)()
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key'
  })

  it('should find low rated locations for a given company', async () => {
    // Mock the places search response
    const mockPlacesResponse: PlacesNearbyResponse = {
      data: {
        results: [
          {
            place_id: 'place1',
            name: 'Burger King',
            geometry: {
              location: { lat: 40.7128, lng: -74.0060 },
              viewport: mockBounds
            },
            vicinity: '',
            rating: 0,
            user_ratings_total: 0
          },
          {
            place_id: 'place2',
            name: 'Burger King',
            geometry: {
              location: { lat: 40.7580, lng: -73.9855 },
              viewport: mockBounds
            },
            vicinity: '',
            rating: 0,
            user_ratings_total: 0
          },
          {
            place_id: 'place3',
            name: 'Burger King',
            geometry: {
              location: { lat: 40.7829, lng: -73.9654 },
              viewport: mockBounds
            },
            vicinity: '',
            rating: 0,
            user_ratings_total: 0
          }
        ],
        status: Status.OK as PlacesNearbyResponseData['status'],
        html_attributions: [],
        error_message: ''
      },
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
      config: { headers: mockHeaders }
    }

    // Mock the place details responses with similar structure
    const mockDetailsResponses: PlaceDetailsResponse[] = [
      {
        data: {
          result: {
            place_id: 'place1',
            name: 'Burger King',
            rating: 3.5,
            formatted_address: '123 Main St, New York, NY 10001',
            user_ratings_total: 500,
            geometry: {
              location: { lat: 40.7128, lng: -74.0060 },
              viewport: mockBounds
            },
            vicinity: '',
            types: []
          },
          html_attributions: [],
          status: Status.OK,
          error_message: ''
        },
        status: 200,
        statusText: 'OK',
        headers: mockHeaders,
        config: { headers: mockHeaders }
      },
      {
        data: {
          result: {
            place_id: 'place2',
            name: 'Burger King',
            rating: 3.8,
            formatted_address: '456 Park Ave, New York, NY 10022',
            user_ratings_total: 300,
            geometry: {
              location: { lat: 40.7580, lng: -73.9855 },
              viewport: mockBounds
            },
            vicinity: '',
            types: []
          },
          html_attributions: [],
          status: Status.OK,
          error_message: ''
        },
        status: 200,
        statusText: 'OK',
        headers: mockHeaders,
        config: { headers: mockHeaders }
      },
      {
        data: {
          result: {
            place_id: 'place3',
            name: 'Burger King',
            rating: 3.2,
            formatted_address: '789 Broadway, New York, NY 10003',
            user_ratings_total: 400,
            geometry: {
              location: { lat: 40.7829, lng: -73.9654 },
              viewport: mockBounds
            },
            vicinity: '',
            types: []
          },
          html_attributions: [],
          status: Status.OK,
          error_message: ''
        },
        status: 200,
        statusText: 'OK',
        headers: mockHeaders,
        config: { headers: mockHeaders }
      }
    ]

    // Set up the mocks
    mockClient.textSearch.mockResolvedValueOnce(mockPlacesResponse)
    mockDetailsResponses.forEach(response => {
      mockClient.placeDetails.mockResolvedValueOnce(response)
    })

    const result = await findLowRatedLocations({
      companyName: 'Burger King',
      centerLocation: { lat: 40.7128, lng: -74.0060 },
      radiusInMiles: 25,
      maxRating: 4.0,
      minRatings: 100
    })

    expect(result).toHaveLength(3)
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Burger King',
          rating: expect.any(Number),
          address: expect.any(String),
          totalRatings: expect.any(Number)
        })
      ])
    )

    expect(mockClient.textSearch).toHaveBeenCalledWith({
      params: {
        query: 'Burger King',
        location: { lat: 40.7128, lng: -74.0060 },
        radius: 40233.5,
        key: 'test-api-key'
      }
    })
  })

  it('should handle no locations found', async () => {
    mockClient.textSearch.mockResolvedValueOnce({
      data: {
        results: [],
        status: Status.ZERO_RESULTS,
        html_attributions: [],
        error_message: ''
      },
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
      config: { headers: mockHeaders }
    })

    const result = await findLowRatedLocations({
      companyName: 'Burger King',
      centerLocation: { lat: 40.7128, lng: -74.0060 },
      radiusInMiles: 25,
      maxRating: 4.0,
      minRatings: 100
    })

    expect(result).toHaveLength(0)
  })

  it('should filter out highly rated locations', async () => {
    // Fix the mock responses to match the proper format
    const mockPlacesResponse: PlacesNearbyResponse = {
      data: {
        results: [
          {
            place_id: 'place1',
            name: 'Burger King',
            geometry: {
              location: { lat: 40.7128, lng: -74.0060 },
              viewport: mockBounds
            },
            vicinity: '',
            rating: 0,
            user_ratings_total: 0
          },
          {
            place_id: 'place2',
            name: 'Burger King',
            geometry: {
              location: { lat: 40.7580, lng: -73.9855 },
              viewport: mockBounds
            },
            vicinity: '',
            rating: 0,
            user_ratings_total: 0
          }
        ],
        status: Status.OK as PlacesNearbyResponseData['status'],
        html_attributions: [],
        error_message: ''
      },
      status: 200,
      statusText: 'OK',
      headers: mockHeaders,
      config: { headers: mockHeaders }
    }

    const mockDetailsResponses: PlaceDetailsResponse[] = [
      {
        data: {
          result: {
            place_id: 'place1',
            name: 'Burger King',
            rating: 4.5,
            formatted_address: '123 Main St, New York, NY 10001',
            user_ratings_total: 500,
            geometry: {
              location: { lat: 40.7128, lng: -74.0060 },
              viewport: mockBounds
            },
            vicinity: '',
            types: []
          },
          html_attributions: [],
          status: Status.OK,
          error_message: ''
        },
        status: 200,
        statusText: 'OK',
        headers: mockHeaders,
        config: { headers: mockHeaders }
      },
      {
        data: {
          result: {
            place_id: 'place2',
            name: 'Burger King',
            rating: 3.5,
            formatted_address: '456 Park Ave, New York, NY 10022',
            user_ratings_total: 300,
            geometry: {
              location: { lat: 40.7580, lng: -73.9855 },
              viewport: mockBounds
            },
            vicinity: '',
            types: []
          },
          html_attributions: [],
          status: Status.OK,
          error_message: ''
        },
        status: 200,
        statusText: 'OK',
        headers: mockHeaders,
        config: { headers: mockHeaders }
      }
    ]

    mockClient.textSearch.mockResolvedValueOnce(mockPlacesResponse)
    mockDetailsResponses.forEach(response => {
      mockClient.placeDetails.mockResolvedValueOnce(response)
    })

    const result = await findLowRatedLocations({
      companyName: 'Burger King',
      centerLocation: { lat: 40.7128, lng: -74.0060 },
      radiusInMiles: 25,
      maxRating: 4.0,
      minRatings: 100
    })

    expect(result).toHaveLength(1)
    expect(result[0].rating).toBeLessThanOrEqual(4.0)
  })
}) 