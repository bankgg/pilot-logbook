import { FlightForm } from '@/components/flight-form'
import { FlightMapWrapper } from '@/components/flight-map-wrapper'
import { AuthSignIn } from '@/components/auth-signin'
import { StatsSection } from '@/components/stats-section'
import { RecentFlights } from '@/components/recent-flights'
import { AirportPreloader } from '@/components/airport-preloader'
import { ThemeToggle } from '@/components/theme-toggle'
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
      {/* Preload airports for better UX */}
      <AirportPreloader />

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-3 py-3 flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <Plane className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="truncate">GG Log</span>
          </h1>
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <form action={signOut}>
              <Button variant="outline" size="sm" className="shrink-0" type="submit" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
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
              <RecentFlights flights={flightPaths.slice(0, 10)} />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
