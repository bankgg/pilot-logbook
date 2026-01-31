'use server'

import { revalidatePath } from 'next/cache'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { Flight, FlightPath, Airport, Database } from '@/types/supabase'

// ============================================
// VALIDATION SCHEMAS
// ============================================

const LogFlightSchema = z.object({
  flight_number: z.string().optional(),
  aircraft_reg: z.string().min(1, 'Aircraft registration is required'),
  aircraft_type: z.string().min(1, 'Aircraft type is required'),
  dep_airport: z.string().length(4, 'Departure airport must be a 4-character ICAO code').toUpperCase(),
  arr_airport: z.string().length(4, 'Arrival airport must be a 4-character ICAO code').toUpperCase(),
  block_off: z.string().datetime().nullable().optional(),
  takeoff: z.string().datetime().nullable().optional(),
  landing: z.string().datetime().nullable().optional(),
  block_on: z.string().datetime().nullable().optional(),
  day_landings: z.number().int().min(0).default(0),
  night_landings: z.number().int().min(0).default(0),
  notes: z.string().optional(),
})

const AirportLookupSchema = z.object({
  icao: z.string().length(4, 'ICAO must be 4 characters').toUpperCase(),
})

// Types from schemas
export type LogFlightInput = z.infer<typeof LogFlightSchema>

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Cached function to get authenticated user
 * Uses React.cache() to deduplicate multiple calls in the same request
 */
const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return null
  }
  return user
})

/**
 * Calculate duration in minutes between two timestamps
 */
function calculateDuration(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.round((endDate.getTime() - startDate.getTime()) / 60000)
}

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Log a new flight
 * - Validates input with Zod
 * - Calculates block/flight durations automatically
 * - Inserts into Supabase
 * - Revalidates the dashboard path
 */
export async function logFlight(input: LogFlightInput) {
  // Validate input
  const validated = LogFlightSchema.parse(input)

  // Get the current user (cached)
  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: 'Authentication required' }
  }

  const supabase = await createClient()

  // Calculate durations
  const duration_block = calculateDuration(
    validated.block_off ?? null,
    validated.block_on ?? null
  )
  const duration_flight = calculateDuration(
    validated.takeoff ?? null,
    validated.landing ?? null
  )

  // Insert flight
  const { data, error } = await (supabase.from('flights') as any)
    .insert({
      user_id: user.id,
      flight_number: validated.flight_number ?? null,
      aircraft_reg: validated.aircraft_reg,
      aircraft_type: validated.aircraft_type,
      dep_airport: validated.dep_airport,
      arr_airport: validated.arr_airport,
      block_off: validated.block_off ?? null,
      takeoff: validated.takeoff ?? null,
      landing: validated.landing ?? null,
      block_on: validated.block_on ?? null,
      duration_block,
      duration_flight,
      day_landings: validated.day_landings,
      night_landings: validated.night_landings,
      notes: validated.notes ?? null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidate dashboard to show new flight
  revalidatePath('/dashboard')

  return { success: true, data }
}

/**
 * Get all flights for the current user
 */
export async function getFlights(): Promise<{ success: boolean; data?: Flight[]; error?: string }> {
  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: 'Authentication required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Get flight paths with airport coordinates for map rendering
 * Returns GeoJSON-ready coordinates for each flight
 */
export async function getFlightPaths(): Promise<{
  success: boolean
  data?: FlightPath[]
  error?: string
}> {
  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: 'Authentication required' }
  }

  const supabase = await createClient()

  // Query the flight_paths view which includes airport coordinates
  const { data, error } = await supabase
    .from('flight_paths')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Get airport by ICAO code
 * Used for dynamic airport name lookup in the form
 */
export async function getAirportByIcao(icao: string): Promise<{
  success: boolean
  data?: Airport
  error?: string
}> {
  // Validate input
  const validated = AirportLookupSchema.parse({ icao })

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('airports')
    .select('*')
    .eq('icao', validated.icao)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Get all airports (for client-side caching and filtering)
 * Returns all airports with essential fields for autocomplete
 * Server-side cached for 1 day using React.cache()
 */
const fetchAllAirportsFromDb = cache(async () => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('airports')
    .select('*')
    .order('icao', { ascending: true })

  if (error) {
    return { success: false, error: error.message } as const
  }

  return { success: true, data } as const
})

export async function getAllAirports(): Promise<{
  success: boolean
  data?: Airport[]
  error?: string
}> {
  return fetchAllAirportsFromDb()
}

/**
 * Search airports by ICAO or name (for autocomplete)
 * @deprecated Use getAllAirports with client-side filtering instead
 */
export async function searchAirports(query: string): Promise<{
  success: boolean
  data?: Airport[]
  error?: string
}> {
  if (query.length < 2) {
    return { success: true, data: [] }
  }

  const supabase = await createClient()
  const upperQuery = query.toUpperCase()

  const { data, error } = await supabase
    .from('airports')
    .select('*')
    .or(`icao.ilike.%${upperQuery}%,iata.ilike.%${upperQuery}%,name.ilike.%${query}%`)
    .limit(20)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Delete a flight (only if owned by current user)
 */
export async function deleteFlight(flightId: string): Promise<{
  success: boolean
  error?: string
}> {
  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: 'Authentication required' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('flights')
    .delete()
    .eq('id', flightId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Get a single flight by ID (only if owned by current user)
 */
export async function getFlightById(flightId: string): Promise<{
  success: boolean
  data?: Flight
  error?: string
}> {
  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: 'Authentication required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('id', flightId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Get flights with optional filters for the dashboard
 * @param startDate - Optional start date (ISO string) for filtering
 * @param endDate - Optional end date (ISO string) for filtering
 * @param aircraftType - Optional aircraft type filter
 * @param aircraftReg - Optional aircraft registration filter
 * @param depAirport - Optional departure airport filter
 * @param arrAirport - Optional arrival airport filter
 */
export async function getFilteredFlights(filters?: {
  startDate?: string
  endDate?: string
  aircraftType?: string
  aircraftReg?: string
  depAirport?: string
  arrAirport?: string
}): Promise<{ success: boolean; data?: Flight[]; error?: string }> {
  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: 'Authentication required' }
  }

  const supabase = await createClient()

  // Build filters array for Supabase
  const dbFilters: any[] = []

  // Always filter by user_id
  dbFilters.push({ column: 'user_id', value: user.id, operator: 'eq' })

  // Apply filters if provided
  if (filters) {
    if (filters.startDate) {
      dbFilters.push({ column: 'created_at', value: filters.startDate, operator: 'gte' })
    }
    if (filters.endDate) {
      dbFilters.push({ column: 'created_at', value: filters.endDate, operator: 'lte' })
    }
    if (filters.aircraftType) {
      dbFilters.push({ column: 'aircraft_type', value: filters.aircraftType, operator: 'ilike' })
    }
    if (filters.aircraftReg) {
      dbFilters.push({ column: 'aircraft_reg', value: filters.aircraftReg, operator: 'ilike' })
    }
    if (filters.depAirport) {
      dbFilters.push({ column: 'dep_airport', value: filters.depAirport.toUpperCase(), operator: 'eq' })
    }
    if (filters.arrAirport) {
      dbFilters.push({ column: 'arr_airport', value: filters.arrAirport.toUpperCase(), operator: 'eq' })
    }
  }

  // Build the query with all filters
  let query = (supabase
    .from('flights') as any)
    .select('*')

  for (const filter of dbFilters) {
    if (filter.operator === 'eq') {
      query = query.eq(filter.column, filter.value)
    } else if (filter.operator === 'ilike') {
      query = query.ilike(filter.column, filter.value)
    } else if (filter.operator === 'gte') {
      query = query.gte(filter.column, filter.value)
    } else if (filter.operator === 'lte') {
      query = query.lte(filter.column, filter.value)
    }
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Get flight statistics for the current user
 * @param startDate - Optional start date (ISO string) for filtering
 * @param endDate - Optional end date (ISO string) for filtering
 */
export async function getFlightStats(startDate?: string, endDate?: string): Promise<{
  success: boolean
  data?: {
    total_flights: number
    total_hours: number
    total_landings: number
    total_day_landings: number
    total_night_landings: number
  }
  error?: string
}> {
  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: 'Authentication required' }
  }

  const supabase = await createClient()

  let query = (supabase
    .from('flights') as any)
    .select('duration_flight, day_landings, night_landings, created_at')
    .eq('user_id', user.id)

  // Apply date filters if provided
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  const total_flights = data?.length || 0
  const total_minutes = data?.reduce((sum: number, f: any) => sum + (f.duration_flight || 0), 0) || 0
  const total_hours = Math.round((total_minutes / 60) * 10) / 10 // Round to 1 decimal
  const total_landings = data?.reduce((sum: number, f: any) => sum + f.day_landings + f.night_landings, 0) || 0
  const total_day_landings = data?.reduce((sum: number, f: any) => sum + f.day_landings, 0) || 0
  const total_night_landings = data?.reduce((sum: number, f: any) => sum + f.night_landings, 0) || 0

  return {
    success: true,
    data: {
      total_flights,
      total_hours,
      total_landings,
      total_day_landings,
      total_night_landings,
    },
  }
}
