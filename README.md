# Lead Engager

A Next.js application for automating personalized email outreach to business owners based on their Google review ratings.

## Features

- **CSV Processing**: Processes lead data from `leads.csv` file
- **Location Analysis**: Fetches and analyzes Google review ratings for business locations
- **Automated Emails**: Sends personalized emails using Gmail OAuth2 authentication
- **Smart Caching**: Caches processed emails and location data to prevent duplicates
- **Professional Templates**: Includes customized email templates with company branding

## Getting Started

1. Install dependencies:
```bash
pnpm install
# or
yarn install
```

2. Set up Gmail OAuth2 credentials:
   - Create a project in Google Cloud Console
   - Enable Gmail API
   - Create OAuth2 credentials
   - Add authorized redirect URI: `https://developers.google.com/oauthplayground`

3. Set up Google Maps API:
   - In the same Google Cloud Console project
   - Enable Places API, Maps JavaScript API, and Geocoding API
   - Create an API key
   - (Optional) Restrict the API key to only these APIs and your IP address

4. Configure environment variables in `.env`:
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_MAPS_API_KEY=your_maps_api_key
```

5. Prepare your leads data:
   - Create a `leads.csv` file in the project root by exporting a csv from Google Sheets
   - Required columns: First Name, Last Name, Email, Title, Company

## Available Scripts

### Development
```bash
pnpm dev        # Start Next.js development server
pnpm build      # Build the application
pnpm start      # Start production server
pnpm lint       # Run ESLint
```

### Testing
```bash
pnpm test           # Run all Jest tests
pnpm test:ci        # Run tests in CI environment
pnpm test:location  # Test Google Maps API integration
pnpm test:csv       # Test CSV file parsing
pnpm test:email     # Preview email template in browser
```

### Main Script
```bash
pnpm send-emails    # Run the main email campaign script
```

## Testing Details

- `test:location`: Verifies Google Maps API integration and location finding
  - Requires valid `GOOGLE_MAPS_API_KEY`
  - Tests business location lookup and rating retrieval

- `test:csv`: Validates CSV file processing
  - Checks required column presence
  - Verifies data parsing
  - Tests error handling

- `test:email`: Generates email preview
  - Creates `email-preview.html` in project root
  - Shows exact email layout and formatting
  - Includes signature and logo

## Project Structure

- `/src/lib/utils/`
  - `emailGenerator.ts`: Email template generation
  - `emailSender.ts`: Gmail OAuth2 email sending
  - `locationFinder.ts`: Google Maps API integration
  - `locationCache.ts`: Caching system

## Assets

- `/public/assets/images/`
  - `revues-logo.png`: Company logo for email signatures

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Gmail OAuth2](https://developers.google.com/gmail/api/auth/web-server)
- [Google Maps Platform](https://developers.google.com/maps/documentation)
- [Nodemailer](https://nodemailer.com/about/)

## CI/CD Setup

1. Go to your GitHub repository's Settings > Secrets and Variables > Actions
2. Click "New repository secret"
3. Add the following repository secrets:
   ```
   GOOGLE_MAPS_API_KEY
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   GOOGLE_REFRESH_TOKEN
   ```
4. These secrets will be automatically used by GitHub Actions for testing
