'use client'

import { useState, useTransition, useRef, useMemo, memo } from 'react'
import { Plane, Clock, MapPin, Sun, Moon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardFilter, type DashboardFilters } from '@/components/dashboard-filter'
import { FlightsList } from '@/components/flights-list'
import { getFilteredFlights, getFlightStats } from '@/lib/actions/flights'
import type { Flight } from '@/types/supabase'

interface DashboardContentProps {
  initialFlights: Flight[]
}

interface StatsData {
  total_flights: number
  total_hours: number
  total_landings: number
  total_day_landings: number
  total_night_landings: number
}

const StatCard = memo(function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground">{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export function DashboardContent({ initialFlights }: DashboardContentProps) {
  const [flights, setFlights] = useState<Flight[]>(initialFlights)
  const [stats, setStats] = useState<StatsData>(() => {
    // Single pass initialization for better performance
    let totalMinutes = 0
    let totalDayLandings = 0
    let totalNightLandings = 0

    for (const flight of initialFlights) {
      totalMinutes += flight.duration_flight || 0
      totalDayLandings += flight.day_landings
      totalNightLandings += flight.night_landings
    }

    return {
      total_flights: initialFlights.length,
      total_hours: Math.round((totalMinutes / 60) * 10) / 10,
      total_landings: totalDayLandings + totalNightLandings,
      total_day_landings: totalDayLandings,
      total_night_landings: totalNightLandings,
    }
  })
  const [isPending, startTransition] = useTransition()
  const currentFiltersRef = useRef<DashboardFilters>({ dateFilter: 'all' })

  // Handle flight deletion by refreshing data
  const handleFlightDelete = () => {
    startTransition(async () => {
      const filters = currentFiltersRef.current
      const [flightsResult, statsResult] = await Promise.all([
        getFilteredFlights({
          startDate: filters.startDate,
          endDate: filters.endDate,
          aircraftType: filters.aircraftType,
          aircraftReg: filters.aircraftReg,
          depAirport: filters.depAirport,
          arrAirport: filters.arrAirport,
        }),
        getFlightStats(filters.startDate, filters.endDate),
      ])

      if (flightsResult.success && flightsResult.data) {
        setFlights(flightsResult.data)
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }
    })
  }

  // Extract unique values for filter dropdowns - single pass optimization
  const { availableAircraftTypes, availableAircraftRegs, availableAirports } = useMemo(() => {
    const aircraftTypesSet = new Set<string>()
    const aircraftRegsSet = new Set<string>()
    const airportsSet = new Set<string>()

    for (const flight of initialFlights) {
      aircraftTypesSet.add(flight.aircraft_type)
      aircraftRegsSet.add(flight.aircraft_reg)
      airportsSet.add(flight.dep_airport)
      airportsSet.add(flight.arr_airport)
    }

    return {
      availableAircraftTypes: Array.from(aircraftTypesSet).sort(),
      availableAircraftRegs: Array.from(aircraftRegsSet).sort(),
      availableAirports: Array.from(airportsSet).sort(),
    }
  }, [initialFlights])

  const handleFilterChange = async (filters: DashboardFilters) => {
    currentFiltersRef.current = filters
    startTransition(async () => {
      const [flightsResult, statsResult] = await Promise.all([
        getFilteredFlights({
          startDate: filters.startDate,
          endDate: filters.endDate,
          aircraftType: filters.aircraftType,
          aircraftReg: filters.aircraftReg,
          depAirport: filters.depAirport,
          arrAirport: filters.arrAirport,
        }),
        getFlightStats(filters.startDate, filters.endDate),
      ])

      if (flightsResult.success && flightsResult.data) {
        setFlights(flightsResult.data)
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <DashboardFilter
            onFilterChange={handleFilterChange}
            availableAircraftTypes={availableAircraftTypes}
            availableAircraftRegs={availableAircraftRegs}
            availableAirports={availableAirports}
          />
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Flights"
          value={stats.total_flights.toString()}
          icon={<Plane className="h-4 w-4" />}
        />
        <StatCard
          title="Total Hours"
          value={`${stats.total_hours}h`}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Total Landings"
          value={stats.total_landings.toString()}
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatCard
          title="Day Landings"
          value={stats.total_day_landings.toString()}
          icon={<Sun className="h-4 w-4" />}
        />
        <StatCard
          title="Night Landings"
          value={stats.total_night_landings.toString()}
          icon={<Moon className="h-4 w-4" />}
        />
      </div>

      {/* Flights Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Flights {isPending && <span className="text-sm text-muted-foreground font-normal ml-2">(Updating...)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {flights.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No flights match your filters</p>
              <p className="text-sm">Try adjusting your filter criteria</p>
            </div>
          ) : (
            <FlightsList flights={flights} onDelete={handleFlightDelete} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
