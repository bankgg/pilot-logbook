import { getFlights } from '@/lib/actions/flights'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Plane, ArrowLeft, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { DashboardContent } from '@/components/dashboard-content'

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Back button + Title */}
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="outline" size="sm" className="shrink-0" asChild>
                <Link href="/" aria-label="Go home">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-lg sm:text-xl font-bold flex items-center gap-1.5 truncate">
                <Plane className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">Flight Log Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </h1>
            </div>
            {/* Right: Theme toggle + Sign out */}
            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle />
              <form action={signOut}>
                <Button variant="outline" size="sm" className="shrink-0" type="submit" aria-label="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <DashboardContent initialFlights={flights} />
      </main>
    </div>
  )
}
