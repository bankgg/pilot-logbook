'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plane, Calendar, Clock, PlaneTakeoff, PlaneLanding, Timer, Trash2, Edit, X, CalendarIcon, ArrowLeft, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { z } from 'zod'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { AirportSelect } from '@/components/ui/airport-select'
import { getFlightById, deleteFlight, updateFlight, type LogFlightInput } from '@/lib/actions/flights'
import { getCachedAirports } from '@/lib/utils/airport-cache'
import type { Flight, Airport } from '@/types/supabase'
import { cn } from '@/lib/utils'

interface FlightDetailModalProps {
  flightId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete?: () => void
  onUpdate?: () => void
}

// In-memory cache for flight data
const flightCache = new Map<string, { data: Flight; timestamp: number }>()
const pendingRequests = new Map<string, Promise<{ success: boolean; data?: Flight; error?: string }>>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Validation schema for edit form - datetime fields accept string|null|undefined
// Server-side .datetime() validation will still catch invalid formats
const editFlightSchema = z.object({
  flight_number: z.string().optional(),
  aircraft_reg: z.string().min(1, 'Required'),
  aircraft_type: z.string().min(1, 'Required'),
  dep_airport: z.string().length(4),
  arr_airport: z.string().length(4),
  block_off: z.string().nullable().optional(),
  takeoff: z.string().nullable().optional(),
  landing: z.string().nullable().optional(),
  block_on: z.string().nullable().optional(),
  day_landings: z.number().int().min(0),
  night_landings: z.number().int().min(0),
  notes: z.string().optional(),
})

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const datePart = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${datePart}, ${timePart}`
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

// DateTimePicker helper component for edit form
function DateTimePicker({
  control,
  name,
  label,
  description,
}: {
  control: any
  name: string
  label: string
  description?: string
}) {
  const [open, setOpen] = useState(false)
  const [timeValue, setTimeValue] = useState('')

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        useEffect(() => {
          if (field.value) {
            const date = new Date(field.value)
            const hours = date.getHours().toString().padStart(2, '0')
            const minutes = date.getMinutes().toString().padStart(2, '0')
            setTimeValue(`${hours}:${minutes}`)
          }
        }, [field.value])

        const handleDateSelect = (date: Date | undefined) => {
          if (date) {
            const currentValue = field.value ? new Date(field.value) : new Date()
            date.setHours(currentValue.getHours(), currentValue.getMinutes())
            field.onChange(date.toISOString())
          }
        }

        const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newTimeValue = e.target.value
          setTimeValue(newTimeValue)

          if (field.value && newTimeValue) {
            const [hours, minutes] = newTimeValue.split(':').map(Number)
            const newDate = new Date(field.value)
            newDate.setHours(hours, minutes)
            field.onChange(newDate.toISOString())
          } else if (newTimeValue) {
            const [hours, minutes] = newTimeValue.split(':').map(Number)
            const newDate = new Date()
            newDate.setHours(hours, minutes)
            field.onChange(newDate.toISOString())
          }
        }

        return (
          <FormItem className="flex flex-col gap-2">
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(new Date(field.value), 'd MMM yy, HH:mm') : 'Pick date & time'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-3">
                    <CalendarComponent
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time</label>
                      <Input
                        type="time"
                        value={timeValue}
                        onChange={handleTimeChange}
                        className="w-full"
                      />
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => setOpen(false)}
                    >
                      Done
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </FormControl>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
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

export function FlightDetailModal({ flightId, open, onOpenChange, onDelete, onUpdate }: FlightDetailModalProps) {
  const [flight, setFlight] = useState<Flight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [depAirportName, setDepAirportName] = useState<string>()
  const [arrAirportName, setArrAirportName] = useState<string>()
  const [depAirportIata, setDepAirportIata] = useState<string>()
  const [arrAirportIata, setArrAirportIata] = useState<string>()
  const [allAirports, setAllAirports] = useState<Airport[]>([])
  const currentFlightIdRef = useRef<string | null>(null)

  const form = useForm<LogFlightInput>({
    resolver: zodResolver(editFlightSchema),
    defaultValues: {
      flight_number: '',
      aircraft_reg: '',
      aircraft_type: '',
      dep_airport: '',
      arr_airport: '',
      block_off: '',
      takeoff: '',
      landing: '',
      block_on: '',
      day_landings: 0,
      night_landings: 0,
      notes: '',
    },
  })

  // Load all airports from cache on mount
  useEffect(() => {
    const loadAirports = async () => {
      const airports = await getCachedAirports()
      setAllAirports(airports)
    }
    loadAirports()
  }, [])

  // Reset edit mode when flight changes
  useEffect(() => {
    setIsEditing(false)
    setDepAirportName(undefined)
    setArrAirportName(undefined)
    setDepAirportIata(undefined)
    setArrAirportIata(undefined)
  }, [flightId])

  // Populate form when entering edit mode
  useEffect(() => {
    if (isEditing && flight) {
      form.reset({
        flight_number: flight.flight_number || '',
        aircraft_reg: flight.aircraft_reg,
        aircraft_type: flight.aircraft_type,
        dep_airport: flight.dep_airport,
        arr_airport: flight.arr_airport,
        block_off: flight.block_off || '',
        takeoff: flight.takeoff || '',
        landing: flight.landing || '',
        block_on: flight.block_on || '',
        day_landings: flight.day_landings,
        night_landings: flight.night_landings,
        notes: flight.notes || '',
      })

      // Find airport data from cache
      const depAirport = allAirports.find((a) => a.icao === flight.dep_airport)
      const arrAirport = allAirports.find((a) => a.icao === flight.arr_airport)

      setDepAirportName(depAirport?.name)
      setDepAirportIata(depAirport?.iata ?? undefined)
      setArrAirportName(arrAirport?.name)
      setArrAirportIata(arrAirport?.iata ?? undefined)
    }
  }, [isEditing, flight, form, allAirports])

  // Find airport data from cache for view mode
  useEffect(() => {
    if (!isEditing && flight && allAirports.length > 0) {
      const depAirport = allAirports.find((a) => a.icao === flight.dep_airport)
      const arrAirport = allAirports.find((a) => a.icao === flight.arr_airport)

      setDepAirportName(depAirport?.name)
      setDepAirportIata(depAirport?.iata ?? undefined)
      setArrAirportName(arrAirport?.name)
      setArrAirportIata(arrAirport?.iata ?? undefined)
    }
  }, [isEditing, flight, allAirports])

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

  const onSubmit = async (data: LogFlightInput) => {
    if (!flightId) return

    // Convert empty strings to null for datetime fields
    const cleanedData: LogFlightInput = {
      ...data,
      block_off: data.block_off === '' ? null : data.block_off,
      takeoff: data.takeoff === '' ? null : data.takeoff,
      landing: data.landing === '' ? null : data.landing,
      block_on: data.block_on === '' ? null : data.block_on,
    }

    setIsSubmitting(true)
    try {
      const result = await updateFlight(flightId, cleanedData)

      if (result.success) {
        toast.success('Flight updated successfully!')
        // Update cache
        flightCache.delete(flightId)
        // Update local state
        if (result.data) {
          setFlight(result.data)
        }
        setIsEditing(false)
        onUpdate?.()
      } else {
        toast.error(result.error || 'Failed to update flight')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) {
        setIsEditing(false)
        form.reset()
      }
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(false)}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plane className="h-5 w-5" />
              {isEditing ? 'Edit Flight' : 'Flight Details'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading flight details...</div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">{error}</div>
        ) : flight ? (
          <div className="mt-2">
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Flight Number */}
                  <FormField
                    control={form.control}
                    name="flight_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flight Number</FormLabel>
                        <FormControl>
                          <Input placeholder="TG413" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Aircraft Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="aircraft_reg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aircraft Registration</FormLabel>
                          <FormControl>
                            <Input placeholder="HS-TOA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="aircraft_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aircraft Type</FormLabel>
                          <FormControl>
                            <Input placeholder="A320" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Airports */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dep_airport"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departure Airport (ICAO)</FormLabel>
                          <FormControl>
                            <AirportSelect
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select departure..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="arr_airport"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Arrival Airport (ICAO)</FormLabel>
                          <FormControl>
                            <AirportSelect
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select arrival..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Timestamps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DateTimePicker
                      control={form.control}
                      name="block_off"
                      label="Block Off"
                      description="Chocks away / pushback"
                    />
                    <DateTimePicker
                      control={form.control}
                      name="takeoff"
                      label="Takeoff"
                      description="Wheels up"
                    />
                    <DateTimePicker
                      control={form.control}
                      name="landing"
                      label="Landing"
                      description="Wheels down"
                    />
                    <DateTimePicker
                      control={form.control}
                      name="block_on"
                      label="Block On"
                      description="Chocks to parking"
                    />
                  </div>

                  {/* Landings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="day_landings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day Landings</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={9}
                              {...field}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0
                                field.onChange(value)
                                if (e.target.value.length >= 1) {
                                  e.target.blur()
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="night_landings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Night Landings</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={9}
                              {...field}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0
                                field.onChange(value)
                                if (e.target.value.length >= 1) {
                                  e.target.blur()
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional flight notes..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
              {/* Flight Header */}
              <Card className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <PlaneTakeoff className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xl font-bold">{flight.dep_airport}</span>
                        {depAirportIata && (
                          <span className="text-sm text-muted-foreground">({depAirportIata})</span>
                        )}
                      </div>
                      {depAirportName && (
                        <span className="text-xs text-muted-foreground mt-0.5">{depAirportName}</span>
                      )}
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <PlaneLanding className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xl font-bold">{flight.arr_airport}</span>
                        {arrAirportIata && (
                          <span className="text-sm text-muted-foreground">({arrAirportIata})</span>
                        )}
                      </div>
                      {arrAirportName && (
                        <span className="text-xs text-muted-foreground mt-0.5">{arrAirportName}</span>
                      )}
                    </div>
                  </div>
                  {flight.flight_number && (
                    <span className="text-sm text-muted-foreground">
                      {flight.flight_number}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{flight.aircraft_type}</span>
                    <span className="text-muted-foreground">({flight.aircraft_reg})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{new Date(flight.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                  </div>
                </div>
              </Card>

              {/* Times Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Block Off */}
                <Card className="p-3">
                  <div className="text-xs font-medium flex items-center gap-2 mb-1">
                    <Timer className="h-3 w-3 text-muted-foreground" />
                    Block Off
                  </div>
                  <p className="text-lg font-semibold">{formatDateTime(flight.block_off)}</p>
                </Card>

                {/* Takeoff */}
                <Card className="p-3">
                  <div className="text-xs font-medium flex items-center gap-2 mb-1">
                    <PlaneTakeoff className="h-3 w-3 text-muted-foreground" />
                    Takeoff
                  </div>
                  <p className="text-lg font-semibold">{formatDateTime(flight.takeoff)}</p>
                </Card>

                {/* Landing */}
                <Card className="p-3">
                  <div className="text-xs font-medium flex items-center gap-2 mb-1">
                    <PlaneLanding className="h-3 w-3 text-muted-foreground" />
                    Landing
                  </div>
                  <p className="text-lg font-semibold">{formatDateTime(flight.landing)}</p>
                </Card>

                {/* Block On */}
                <Card className="p-3">
                  <div className="text-xs font-medium flex items-center gap-2 mb-1">
                    <Timer className="h-3 w-3 text-muted-foreground" />
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
                <div className="text-xs font-medium flex items-center gap-2 mb-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  Landings
                </div>
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
            )}
          </div>
        ) : null}

        {/* Footer - only show in view mode */}
        {flight && !isEditing && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="default"
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Flight
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleting}
              className="w-full sm:w-auto"
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
