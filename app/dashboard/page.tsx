import { getFlights } from '@/lib/actions/flights'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plane, Calendar, Clock, MapPin, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If not authenticated, redirect to home
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p>Please sign in to view your flights.</p>
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

  const flightsResult = await getFlights()
  const flights = flightsResult.success ? (flightsResult.data || []) : []

  // Calculate summary statistics
  const totalFlights = flights.length
  const totalHours = flights.reduce((sum, f) => sum + (f.duration_flight || 0), 0) / 60
  const totalLandings = flights.reduce((sum, f) => sum + f.day_landings + f.night_landings, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Plane className="h-6 w-6" />
              Flight Log Dashboard
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
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="text-muted-foreground"><Plane className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Flights</p>
                  <p className="text-2xl font-bold">{totalFlights}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="text-muted-foreground"><Clock className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="text-muted-foreground"><MapPin className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Landings</p>
                  <p className="text-2xl font-bold">{totalLandings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flights Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Flights ({totalFlights})</CardTitle>
          </CardHeader>
          <CardContent>
            {flights.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No flights logged yet</p>
                <p className="text-sm">Log your first flight from the home page</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">Route</th>
                      <th className="text-left p-3 font-semibold">Flight #</th>
                      <th className="text-left p-3 font-semibold">Aircraft</th>
                      <th className="text-left p-3 font-semibold">Duration</th>
                      <th className="text-left p-3 font-semibold">Landings</th>
                      <th className="text-left p-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flights.map((flight) => (
                      <tr key={flight.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3 whitespace-nowrap">
                          <Link href={`/dashboard/${flight.id}`} className="flex items-center gap-2 hover:underline">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(flight.created_at).toLocaleDateString()}
                          </Link>
                        </td>
                        <td className="p-3">
                          <Link href={`/dashboard/${flight.id}`} className="hover:underline">
                            <span className="font-semibold">{flight.dep_airport}</span>
                            <span className="text-muted-foreground mx-1">→</span>
                            <span className="font-semibold">{flight.arr_airport}</span>
                          </Link>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <Link href={`/dashboard/${flight.id}`} className="hover:underline">
                            {flight.flight_number || '-'}
                          </Link>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <Link href={`/dashboard/${flight.id}`} className="block hover:underline">
                            <div>{flight.aircraft_type}</div>
                            <div className="text-xs text-muted-foreground">{flight.aircraft_reg}</div>
                          </Link>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <Link href={`/dashboard/${flight.id}`} className="block hover:underline">
                            {flight.duration_flight ? (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {Math.floor(flight.duration_flight / 60)}h {flight.duration_flight % 60}m
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </Link>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <Link href={`/dashboard/${flight.id}`} className="block hover:underline">
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
                          </Link>
                        </td>
                        <td className="p-3 max-w-xs truncate text-muted-foreground">
                          <Link href={`/dashboard/${flight.id}`} className="block hover:underline truncate">
                            {flight.notes || '-'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
