import { getFlightById } from '@/lib/actions/flights'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plane,
  Calendar,
  Clock,
  ArrowLeft,
  PlaneTakeoff,
  PlaneLanding,
  Timer,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
}

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

export default async function FlightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If not authenticated, redirect to home
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p>Please sign in to view flight details.</p>
            <Button className="mt-4" asChild>
              <Link href="/">
                Go Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { id } = await params
  const flightResult = await getFlightById(id)

  if (!flightResult.success || !flightResult.data) {
    notFound()
  }

  const flight = flightResult.data

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Plane className="h-6 w-6" />
              Flight Details
            </h1>
          </div>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit">
              Sign Out
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Flight Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold">{flight.dep_airport}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-3xl font-bold">{flight.arr_airport}</span>
              </div>
              {flight.flight_number && (
                <span className="text-lg text-muted-foreground">
                  {flight.flight_number}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Aircraft:</span>
                <span className="font-semibold">{flight.aircraft_type}</span>
                <span className="text-muted-foreground">({flight.aircraft_reg})</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Date:</span>
                <span className="font-semibold">{new Date(flight.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Times Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Block Off */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Timer className="h-4 w-4 text-amber-600" />
                Block Off
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatDateTime(flight.block_off)}</p>
            </CardContent>
          </Card>

          {/* Takeoff */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PlaneTakeoff className="h-4 w-4 text-green-600" />
                Takeoff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatDateTime(flight.takeoff)}</p>
            </CardContent>
          </Card>

          {/* Landing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PlaneLanding className="h-4 w-4 text-blue-600" />
                Landing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatDateTime(flight.landing)}</p>
            </CardContent>
          </Card>

          {/* Block On */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Timer className="h-4 w-4 text-amber-600" />
                Block On
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatDateTime(flight.block_on)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Durations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Flight Time (Takeoff to Landing)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatDuration(flight.duration_flight)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                Block Time (Block Off to Block On)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatDuration(flight.duration_block)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Landings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Landings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Day:</span>
                <span className="text-xl font-bold">{flight.day_landings}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Night:</span>
                <span className="text-xl font-bold">{flight.night_landings}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="text-xl font-bold">{flight.day_landings + flight.night_landings}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {flight.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{flight.notes}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
