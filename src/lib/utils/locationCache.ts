import { LocationResult } from '@/lib/types'
import fs from 'fs/promises'
import path from 'path'

interface CacheData {
  locations: Map<string, LocationResult[]>
  hits: Map<string, number>
  processedEmails: Set<string>  // Track which emails have been sent
}

/**
 * Service for caching location results by company name with persistence
 */
export class LocationCache {
  private cache: Map<string, LocationResult[]>
  private cacheHits: Map<string, number>
  private processedEmails: Set<string>
  private cacheFile: string

  constructor(cacheFile: string = 'location-cache.json') {
    this.cache = new Map()
    this.cacheHits = new Map()
    this.processedEmails = new Set()
    this.cacheFile = path.join(process.cwd(), cacheFile)
  }

  /**
   * Load cache data from disk
   */
  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf-8')
      const parsed = JSON.parse(data)
      
      // Convert plain objects back to Maps and Sets
      this.cache = new Map(Object.entries(parsed.locations))
      this.cacheHits = new Map(Object.entries(parsed.hits))
      this.processedEmails = new Set(parsed.processedEmails)
      
      console.log('Cache loaded from disk')
    } catch (error) {
      // If file doesn't exist or is invalid, start with empty cache
      console.log('Starting with empty cache')
    }
  }

  /**
   * Save cache data to disk
   */
  async save(): Promise<void> {
    const data = {
      locations: Object.fromEntries(this.cache),
      hits: Object.fromEntries(this.cacheHits),
      processedEmails: Array.from(this.processedEmails)
    }

    await fs.writeFile(this.cacheFile, JSON.stringify(data, null, 2))
    console.log('Cache saved to disk')
  }

  /**
   * Store locations for a company
   */
  set(companyName: string, locations: LocationResult[]): void {
    this.cache.set(companyName, locations)
    this.cacheHits.set(companyName, 0)
  }

  /**
   * Get cached locations for a company
   */
  get(companyName: string): LocationResult[] | null {
    const locations = this.cache.get(companyName)
    if (locations) {
      const hits = this.cacheHits.get(companyName) || 0
      this.cacheHits.set(companyName, hits + 1)
    }
    return locations || null
  }

  /**
   * Mark an email as processed
   */
  markEmailProcessed(email: string): void {
    this.processedEmails.add(email)
  }

  /**
   * Check if an email has been processed
   */
  isEmailProcessed(email: string): boolean {
    return this.processedEmails.has(email)
  }

  /**
   * Check if a company's locations are cached
   */
  has(companyName: string): boolean {
    return this.cache.has(companyName)
  }

  /**
   * Get cache statistics
   */
  getStats(): { company: string; hits: number }[] {
    return Array.from(this.cacheHits.entries()).map(([company, hits]) => ({
      company,
      hits
    }))
  }

  /**
   * Get number of processed emails
   */
  getProcessedEmailCount(): number {
    return this.processedEmails.size
  }

  /**
   * Clear the cache
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.cacheHits.clear()
    this.processedEmails.clear()
    try {
      await fs.unlink(this.cacheFile)
      console.log('Cache file deleted')
    } catch {
      // Ignore if file doesn't exist
    }
  }
} 