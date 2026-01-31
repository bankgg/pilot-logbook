'use client'

import { useEffect } from 'react'
import { preloadAirports } from '@/lib/utils/airport-cache'

/**
 * Preloads airport data on component mount.
 * Place this component in the layout or page to pre-warm the airport cache.
 */
export function AirportPreloader() {
  useEffect(() => {
    // Preload airports in the background without blocking render
    preloadAirports().catch((error) => {
      console.error('Failed to preload airports:', error)
    })
  }, [])

  // This component doesn't render anything
  return null
}
