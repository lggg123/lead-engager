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
npm install
# or
yarn install
```

2. Set up Gmail OAuth2 credentials:
   - Create a project in Google Cloud Console
   - Enable Gmail API
   - Create OAuth2 credentials
   - Add authorized redirect URI: `https://developers.google.com/oauthplayground`

3. Configure environment variables in `.env`:
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
```

4. Prepare your leads data:
   - Create a `leads.csv` file in the project root
   - Required columns: firstName, lastName, email, title, company

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

## Scripts

- `@sendLocationEmails.ts`: Main script for processing leads and sending emails
  - Reads from `leads.csv`
  - Fetches location data
  - Sends personalized emails
  - Includes logging for tracking progress

## Testing

Run the test suite:
```bash
npm test
# or
yarn test
```

Key test files:
- `emailGenerator.test.ts`: Tests email template generation
- `emailSender.test.ts`: Tests email sending functionality with Gmail

## Project Structure

- `/src/lib/utils/`
  - `emailGenerator.ts`: Email template generation
  - `emailSender.ts`: Gmail OAuth2 email sending
  - `@sendLocationEmails.ts`: Main automation script

## Assets

- `/public/assets/images/`
  - `revues-logo.png`: Company logo for email signatures

## Learn More

To learn more about the technologies used:
- [Next.js Documentation](https://nextjs.org/docs)
- [Gmail OAuth2](https://developers.google.com/gmail/api/auth/web-server)
- [Nodemailer](https://nodemailer.com/about/)
