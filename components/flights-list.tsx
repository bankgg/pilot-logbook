'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, MapPin, Plane, ChevronLeft, ChevronRight } from 'lucide-react'
import { FlightDetailModal, preloadFlightDataMultiple } from './flight-detail-modal'
import { Button } from '@/components/ui/button'
import type { Flight } from '@/types/supabase'

interface FlightsListProps {
  flights: Flight[]
  onDelete?: () => void
}

const ITEMS_PER_PAGE = 20

export function FlightsList({ flights, onDelete }: FlightsListProps) {
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate pagination
  const totalPages = Math.ceil(flights.length / ITEMS_PER_PAGE)
  const paginatedFlights = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return flights.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [flights, currentPage])

  // Reset to page 1 when flights change
  useEffect(() => {
    setCurrentPage(1)
  }, [flights])

  // Preload flight data when component mounts or flights change
  useEffect(() => {
    if (flights.length > 0) {
      const flightIds = flights.map(f => f.id)
      preloadFlightDataMultiple(flightIds)
    }
  }, [flights])

  const handleRowClick = (flightId: string) => {
    setSelectedFlightId(flightId)
    setModalOpen(true)
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-semibold">Date</th>
              <th className="text-left p-3 font-semibold">Route</th>
              <th className="text-left p-3 font-semibold">Flight</th>
              <th className="text-left p-3 font-semibold">Aircraft</th>
              <th className="text-left p-3 font-semibold">Duration</th>
              <th className="text-left p-3 font-semibold">Landings</th>
              <th className="text-left p-3 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFlights.map((flight) => (
              <tr
                key={flight.id}
                className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleRowClick(flight.id)}
              >
                <td className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {new Date(flight.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </div>
                </td>
                <td className="p-3">
                  <span className="font-semibold">{flight.dep_airport}</span>
                  <span className="text-muted-foreground mx-1">→</span>
                  <span className="font-semibold">{flight.arr_airport}</span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {flight.flight_number || '-'}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <div>{flight.aircraft_type}</div>
                  <div className="text-xs text-muted-foreground">{flight.aircraft_reg}</div>
                </td>
                <td className="p-3 whitespace-nowrap">
                  {flight.duration_flight ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {Math.floor(flight.duration_flight / 60)}h {flight.duration_flight % 60}m
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <div className="flex gap-2">
                    {flight.day_landings > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-2 py-0.5 rounded">
                        {flight.day_landings} day
                      </span>
                    )}
                    {flight.night_landings > 0 && (
                      <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 px-2 py-0.5 rounded">
                        {flight.night_landings} night
                      </span>
                    )}
                    {flight.day_landings === 0 && flight.night_landings === 0 && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </td>
                <td className="p-3 max-w-xs text-muted-foreground">
                  <p className="line-clamp-2 whitespace-pre-wrap">{flight.notes || '-'}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, flights.length)} of {flights.length} flights
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)

                if (!showPage) {
                  // Show ellipsis for hidden pages
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="text-muted-foreground px-1">...</span>
                  }
                  return null
                }

                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <FlightDetailModal
        flightId={selectedFlightId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onDelete={onDelete}
      />
    </>
  )
}
