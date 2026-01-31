'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { FlightDetailModal, preloadFlightDataMultiple } from './flight-detail-modal'
import type { FlightPath } from '@/types/supabase'

interface RecentFlightsProps {
  flights: FlightPath[]
}

export function RecentFlights({ flights }: RecentFlightsProps) {
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Preload flight data when component mounts
  useEffect(() => {
    if (flights.length > 0) {
      const flightIds = flights.map(f => f.id)
      preloadFlightDataMultiple(flightIds)
    }
  }, [flights])

  const handleFlightClick = (flightId: string) => {
    setSelectedFlightId(flightId)
    setModalOpen(true)
  }

  return (
    <>
      <div className="space-y-4">
        {flights.map((flight) => (
          <div
            key={flight.id}
            onClick={() => handleFlightClick(flight.id)}
            className="block hover:bg-muted/50 rounded transition-colors -mx-2 px-2 py-2 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(flight.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{flight.dep_airport}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold">{flight.arr_airport}</span>
                  {flight.flight_number && (
                    <span className="text-sm text-muted-foreground">
                      ({flight.flight_number})
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {flight.aircraft_type} - {flight.aircraft_reg}
                </div>
              </div>
              <div className="text-right">
                {flight.duration_flight && (
                  <div className="text-sm font-medium">
                    {Math.floor(flight.duration_flight / 60)}h {flight.duration_flight % 60}m
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {flight.day_landings + flight.night_landings} landing(s)
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <FlightDetailModal
        flightId={selectedFlightId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}
