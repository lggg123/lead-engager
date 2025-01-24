export interface ContactInfo {
  firstName: string
  lastName: string
  email: string
  title?: string
  company: string
}

export interface LocationResult {
  name: string
  rating: number
  address: string
  totalRatings: number
}

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    path: string
    cid: string
  }>
} 