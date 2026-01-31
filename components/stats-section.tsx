'use client'

import { useState, useTransition } from 'react'
import { StatsFilter } from '@/components/stats-filter'
import { Card, CardContent } from '@/components/ui/card'
import { Plane, Clock, MapPin, Sun, Moon } from 'lucide-react'
import { getFlightStats } from '@/lib/actions/flights'

interface StatsData {
  total_flights: number
  total_hours: number
  total_landings: number
  total_day_landings: number
  total_night_landings: number
}

interface StatsSectionProps {
  initialStats: StatsData
}

type DateFilterType = 'all' | 'month' | 'range'

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-2">
        <div className="flex items-center gap-2 py-1">
          <div className="text-muted-foreground">{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsSection({ initialStats }: StatsSectionProps) {
  const [stats, setStats] = useState<StatsData>(initialStats)
  const [isPending, startTransition] = useTransition()

  const handleFilterChange = async (type: DateFilterType, startDate?: string, endDate?: string) => {
    startTransition(async () => {
      const result = await getFlightStats(startDate, endDate)
      if (result.success && result.data) {
        setStats(result.data)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h2 className="text-lg font-semibold">Statistics</h2>
        <StatsFilter onFilterChange={handleFilterChange} />
      </div>

      {/* Stats Cards */}
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
          title="Landings"
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

      {isPending && (
        <p className="text-sm text-muted-foreground text-center">Updating stats...</p>
      )}
    </div>
  )
}
