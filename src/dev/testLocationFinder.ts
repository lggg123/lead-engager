require('dotenv').config()
const { findLowRatedLocations } = require('../lib/utils/locationFinder')
import { AxiosError } from 'axios'

const testSearch = async () => {
  try {
    // Verify API key is loaded
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY is not set in environment variables')
    }

    console.log('Using API Key:', process.env.GOOGLE_MAPS_API_KEY.substring(0, 10) + '...')

    const results = await findLowRatedLocations({
      companyName: 'Starbucks',
      centerLocation: { lat: 37.7749, lng: -122.4194 }, // San Francisco
      radiusInMiles: 5,
      maxRating: 4.1,
      minRatings: 50
    })

    console.log('Search Results:', JSON.stringify(results, null, 2))
  } catch (error) {
    if (error instanceof Error) {
      console.error('Test failed:', error.message)
      if ((error as AxiosError).response?.data) {
        console.error('API Response:', (error as AxiosError).response?.data)
      }
    } else {
      console.error('Test failed with unknown error')
    }
  }
}

testSearch() 