'use client'

import type { Airport } from '@/types/supabase'
import { getAllAirports } from '@/lib/actions/flights'

// Cache configuration
const AIRPORT_CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours
const AIRPORT_CACHE_KEY = 'pilotlog_airport_cache_v1'

interface CacheEntry {
  data: Airport[]
  timestamp: number
}

/**
 * Get cache from localStorage
 */
function getCacheFromStorage(): CacheEntry | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(AIRPORT_CACHE_KEY)
    if (!cached) return null

    const parsed = JSON.parse(cached) as CacheEntry
    const now = Date.now()

    // Check if cache is still valid
    if (now - parsed.timestamp > AIRPORT_CACHE_TTL) {
      localStorage.removeItem(AIRPORT_CACHE_KEY)
      return null
    }

    return parsed
  } catch {
    // If localStorage is not available or corrupted, return null
    return null
  }
}

/**
 * Save cache to localStorage
 */
function saveCacheToStorage(data: Airport[]): void {
  if (typeof window === 'undefined') return

  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(AIRPORT_CACHE_KEY, JSON.stringify(entry))
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Get all airports from cache or fetch fresh data
 * @param forceRefresh - Force refresh even if cache is valid
 */
export async function getCachedAirports(forceRefresh = false): Promise<Airport[]> {
  // Check if we have valid cached data in localStorage
  if (!forceRefresh) {
    const cached = getCacheFromStorage()
    if (cached) {
      return cached.data
    }
  }

  // Fetch fresh data from server
  const result = await getAllAirports()
  if (result.success && result.data) {
    // Save to localStorage for persistence across page refreshes
    saveCacheToStorage(result.data)
    return result.data
  }

  // Return empty array on error
  return []
}

/**
 * Preload airports into cache (call this on page mount for better UX)
 */
export async function preloadAirports(): Promise<void> {
  await getCachedAirports()
}

/**
 * Filter airports by search query (client-side)
 */
export function filterAirports(airports: Airport[], query: string): Airport[] {
  if (query.length < 2) {
    return []
  }

  const upperQuery = query.toUpperCase()
  const lowerQuery = query.toLowerCase()

  return airports.filter((airport) => {
    return (
      airport.icao.toUpperCase().includes(upperQuery) ||
      (airport.iata && airport.iata.toUpperCase().includes(upperQuery)) ||
      airport.name.toLowerCase().includes(lowerQuery)
    )
  }).slice(0, 20) // Limit to 20 results
}

/**
 * Clear the airport cache from localStorage (useful for testing or manual refresh)
 */
export function clearAirportCache(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(AIRPORT_CACHE_KEY)
  } catch {
    // Silently fail if localStorage is not available
  }
}
