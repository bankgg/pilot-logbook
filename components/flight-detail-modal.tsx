'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plane, Calendar, Clock, PlaneTakeoff, PlaneLanding, Timer, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card } from '@/components/ui/card'
import { getFlightById, deleteFlight } from '@/lib/actions/flights'
import type { Flight } from '@/types/supabase'

interface FlightDetailModalProps {
  flightId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete?: () => void
}

// In-memory cache for flight data
const flightCache = new Map<string, { data: Flight; timestamp: number }>()
const pendingRequests = new Map<string, Promise<{ success: boolean; data?: Flight; error?: string }>>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

// Function to preload flight data (can be called from parent components)
export function preloadFlightData(flightId: string) {
  // Check cache first
  const cached = flightCache.get(flightId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return
  }

  // Check if there's already a pending request
  if (pendingRequests.has(flightId)) {
    return
  }

  // Start fetching
  const promise = getFlightById(flightId)
  pendingRequests.set(flightId, promise)

  promise.then(result => {
    pendingRequests.delete(flightId)
    if (result.success && result.data) {
      flightCache.set(flightId, { data: result.data, timestamp: Date.now() })
    }
  })
}

// Function to preload multiple flights
export function preloadFlightDataMultiple(flightIds: string[]) {
  flightIds.forEach(id => preloadFlightData(id))
}

export function FlightDetailModal({ flightId, open, onOpenChange, onDelete }: FlightDetailModalProps) {
  const [flight, setFlight] = useState<Flight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const currentFlightIdRef = useRef<string | null>(null)

  // Fetch flight data when modal opens or flightId changes
  useEffect(() => {
    if (!flightId) {
      setFlight(null)
      setError(null)
      return
    }

    // Avoid refetching if it's the same flight
    if (currentFlightIdRef.current === flightId && flight) {
      return
    }

    currentFlightIdRef.current = flightId

    // Check cache first
    const cached = flightCache.get(flightId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setFlight(cached.data)
      setError(null)
      setLoading(false)
      return
    }

    // Check if there's a pending request
    const pending = pendingRequests.get(flightId)
    if (pending) {
      setLoading(true)
      setError(null)
      pending.then(result => {
        if (currentFlightIdRef.current === flightId) {
          if (result.success && result.data) {
            setFlight(result.data)
          } else {
            setError(result.error || 'Failed to load flight details')
          }
          setLoading(false)
        }
      })
      return
    }

    // Fetch new data
    setLoading(true)
    setError(null)
    getFlightById(flightId).then(result => {
      // Only update state if this is still the current flight
      if (currentFlightIdRef.current === flightId) {
        if (result.success && result.data) {
          setFlight(result.data)
          flightCache.set(flightId, { data: result.data, timestamp: Date.now() })
        } else {
          setError(result.error || 'Failed to load flight details')
        }
        setLoading(false)
      }
    })
  }, [flightId, flight])

  const handleDelete = async () => {
    if (!flightId) return

    setDeleting(true)
    const result = await deleteFlight(flightId)

    setDeleting(false)
    setDeleteDialogOpen(false)

    if (result.success) {
      // Clear the cache for this flight
      flightCache.delete(flightId)
      // Close the modal and notify parent
      onOpenChange(false)
      onDelete?.()
    } else {
      setError(result.error || 'Failed to delete flight')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plane className="h-5 w-5" />
            Flight Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading flight details...</div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">{error}</div>
        ) : flight ? (
          <div className="space-y-4 mt-2">
              {/* Flight Header */}
              <Card className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{flight.dep_airport}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-2xl font-bold">{flight.arr_airport}</span>
                  </div>
                  {flight.flight_number && (
                    <span className="text-sm text-muted-foreground">
                      {flight.flight_number}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Aircraft:</span>
                      <span className="font-semibold">{flight.aircraft_type}</span>
                    </div>
                    <div className="ml-6 mt-0.5 text-xs text-muted-foreground">
                      ({flight.aircraft_reg})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-semibold">{new Date(flight.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>

              {/* Times Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Block Off */}
                <Card className="p-3">
                  <div className="text-xs font-medium flex items-center gap-2 mb-1">
                    <Timer className="h-3 w-3 text-amber-600" />
                    Block Off
                  </div>
                  <p className="text-lg font-semibold">{formatDateTime(flight.block_off)}</p>
                </Card>

                {/* Takeoff */}
                <Card className="p-3">
                  <div className="text-xs font-medium flex items-center gap-2 mb-1">
                    <PlaneTakeoff className="h-3 w-3 text-green-600" />
                    Takeoff
                  </div>
                  <p className="text-lg font-semibold">{formatDateTime(flight.takeoff)}</p>
                </Card>

                {/* Landing */}
                <Card className="p-3">
                  <div className="text-xs font-medium flex items-center gap-2 mb-1">
                    <PlaneLanding className="h-3 w-3 text-blue-600" />
                    Landing
                  </div>
                  <p className="text-lg font-semibold">{formatDateTime(flight.landing)}</p>
                </Card>

                {/* Block On */}
                <Card className="p-3">
                  <div className="text-xs font-medium flex items-center gap-2 mb-1">
                    <Timer className="h-3 w-3 text-amber-600" />
                    Block On
                  </div>
                  <p className="text-lg font-semibold">{formatDateTime(flight.block_on)}</p>
                </Card>
              </div>

              {/* Durations */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="text-xs font-medium flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    Flight Time
                  </div>
                  <p className="text-xl font-bold">{formatDuration(flight.duration_flight)}</p>
                </Card>

                <Card className="p-3">
                  <div className="text-xs font-medium flex items-center gap-2 mb-1">
                    <Timer className="h-3 w-3 text-muted-foreground" />
                    Block Time
                  </div>
                  <p className="text-xl font-bold">{formatDuration(flight.duration_block)}</p>
                </Card>
              </div>

              {/* Landings */}
              <Card className="p-3">
                <div className="text-xs font-medium mb-2">Landings</div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Day:</span>
                    <span className="text-lg font-bold">{flight.day_landings}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Night:</span>
                    <span className="text-lg font-bold">{flight.night_landings}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Total:</span>
                    <span className="text-lg font-bold">{flight.day_landings + flight.night_landings}</span>
                  </div>
                </div>
              </Card>

              {/* Notes */}
              {flight.notes && (
                <Card className="p-3">
                  <div className="text-xs font-medium mb-1">Notes</div>
                  <p className="text-sm whitespace-pre-wrap">{flight.notes}</p>
                </Card>
              )}
            </div>
        ) : null}

        {/* Footer with Delete button */}
        {flight && (
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Flight
            </Button>
          </DialogFooter>
        )}
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flight Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this flight from {flight?.dep_airport} to {flight?.arr_airport}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
