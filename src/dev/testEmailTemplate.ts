import fs from 'fs'
import path from 'path'
import { generateLocationEmail } from '../lib/utils/emailGenerator'
import { ContactInfo, LocationResult } from '../lib/types'

// Sample test data
const mockContact: ContactInfo = {
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@example.com",
  company: "Test Company",
  title: "Manager"
}

const mockLocations: LocationResult[] = [
  {
    name: "Test Location 1",
    rating: 3.8,
    address: "123 Main St, Los Angeles, CA 90012",
    totalRatings: 150
  },
  {
    name: "Test Location 2",
    rating: 3.5,
    address: "456 Oak Ave, Los Angeles, CA 90014",
    totalRatings: 200
  }
]

// Generate test email
const emailTemplate = generateLocationEmail(mockContact, mockLocations)

// Create a complete HTML document for preview
const previewHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Email Preview</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    .preview-info {
      background: #f5f5f5;
      padding: 15px;
      margin-bottom: 30px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="preview-info">
    <strong>To:</strong> ${emailTemplate.to}<br>
    <strong>Subject:</strong> ${emailTemplate.subject}<br>
  </div>
  ${emailTemplate.html}
</body>
</html>
`

// Save the preview
const previewPath = path.join(process.cwd(), 'email-preview.html')
fs.writeFileSync(previewPath, previewHtml)

console.log(`✨ Email preview generated at: ${previewPath}`)
console.log('Open this file in your browser to see how the email will look!') 