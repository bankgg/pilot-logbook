'use client'

import dynamic from 'next/dynamic'
import type { FlightPath } from '@/types/supabase'

// Dynamically import FlightMap with SSR disabled to avoid Leaflet window errors
const FlightMap = dynamic(
  () => import('./flight-map').then(m => m.FlightMap),
  {
    ssr: false,
    loading: () => <div className="h-full flex items-center justify-center text-muted-foreground">Loading map...</div>
  }
)

interface FlightMapWrapperProps {
  flightPaths: FlightPath[]
  className?: string
}

export function FlightMapWrapper({ flightPaths, className }: FlightMapWrapperProps) {
  return <FlightMap flightPaths={flightPaths} className={className} />
}
