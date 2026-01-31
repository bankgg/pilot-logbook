import { FlightForm } from '@/components/flight-form'
import { FlightMapWrapper } from '@/components/flight-map-wrapper'
import { AuthSignIn } from '@/components/auth-signin'
import { StatsSection } from '@/components/stats-section'
import { getFlightPaths, getFlightStats } from '@/lib/actions/flights'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plane, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If not authenticated, show sign-in form
  if (!user) {
    return <AuthSignIn />
  }

  const [flightPathsResult, statsResult] = await Promise.all([
    getFlightPaths(),
    getFlightStats(),
  ])

  const flightPaths = flightPathsResult.success ? (flightPathsResult.data || []) : []
  const stats = statsResult.success ? statsResult.data : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plane className="h-6 w-6" />
            PilotLog
          </h1>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards with Filter */}
        {stats && <StatsSection initialStats={stats} />}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Flight Form */}
          <div className="lg:col-span-1">
            <FlightForm />
          </div>

          {/* Map */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Flight Map</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] w-full">
                  <FlightMapWrapper flightPaths={flightPaths} className="h-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Flights List */}
        {flightPaths.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Recent Flights</CardTitle>
              <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                <Link href="/dashboard">
                  See all
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flightPaths.slice(0, 10).map((flight) => (
                  <Link
                    key={flight.id}
                    href={`/dashboard/${flight.id}`}
                    className="block hover:bg-muted/50 rounded transition-colors -mx-2 px-2 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
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
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
