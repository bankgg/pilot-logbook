# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server (Next.js 16 with Turbopack)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

**Package Manager:** This project uses `pnpm` (specified in packageManager field).

## Architecture Overview

**GG Log** is a mobile-first flight logbook application built with Next.js 16 App Router and Supabase.

### Tech Stack
- **Framework:** Next.js 16 with App Router (React Server Components by default)
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Styling:** Tailwind CSS v4 + Radix UI components (shadcn/ui)
- **Forms:** react-hook-form + Zod validation
- **Maps:** Leaflet + react-leaflet with PostGIS for geospatial data
- **Date Handling:** date-fns
- **Package Manager:** pnpm

### Key Architectural Patterns

#### Supabase Client Pattern (SSR)
The app uses three separate Supabase client instances for different contexts:
- `lib/supabase/client.ts` - Browser client (for Client Components)
- `lib/supabase/server.ts` - Server client with Next.js cookies (for Server Components/Actions)
- `lib/supabase/middleware.ts` - Middleware client for session refresh

All use `@supabase/ssr` package for proper cookie handling across server/client boundaries.

#### Server Actions with RLS
All database mutations and queries use **Server Actions** (`lib/actions/flights.ts`) that:
1. Validate input with Zod schemas
2. Get the authenticated user via `supabase.auth.getUser()`
3. Enforce user ownership via RLS policies on the `user_id` column
4. Call `revalidatePath('/dashboard')` after mutations
5. Return `{ success: boolean, data?, error? }` shape

**Never bypass Server Actions for database operations** - RLS depends on proper user context.

#### Database Schema
- **flights** table: Stores flight records with RLS enabled (users can only see their own flights)
- **airports** table: Public reference data with PostGIS `GEOGRAPHY(POINT, 4326)` for coordinates
- **flight_paths** view: Joins flights with airports to include coordinates for map rendering

Key PostgreSQL features:
- PostGIS extension for geospatial queries
- Row Level Security (RLS) on flights table
- Triggers for auto-updating `updated_at` timestamps

#### Client vs Server Components
- **Server Components (default):** [app/dashboard/page.tsx](app/dashboard/page.tsx), [app/page.tsx](app/page.tsx)
- **Client Components:** Components with `'use client'` directive (forms, maps, interactive UI, filters)

When adding components that need interactivity (state, event handlers), add `'use client'` at the top.

#### Path Aliases
The `@/*` alias maps to the project root. Use it for all imports:
```ts
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
```

## Page Structure

### Home Page (`app/page.tsx`)
Landing page that shows:
- Sign-in form for unauthenticated users (`AuthSignIn`)
- For authenticated users:
  - `StatsSection` - Flight statistics with date filtering
  - `FlightForm` - Form to log new flights
  - `FlightMapWrapper` - Map showing recent flight paths
  - `RecentFlights` - List of recent flights (clickable for details)

### Dashboard Page (`app/dashboard/page.tsx`)
Full flight logbook dashboard with:
- `DashboardContent` - Main container managing filter state and flight data
  - `DashboardFilter` - Date range, aircraft type/reg, airport filters
  - Summary stats cards (total flights, hours, landings)
  - `FlightsList` - Paginated table of flights (20 per page)
- `FlightDetailModal` - Modal for viewing detailed flight information

## Database Type Generation

After modifying the database schema (via migrations), regenerate TypeScript types:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

The `types/supabase.ts` file defines all database types including Tables, Views, and Functions.

## Component Architecture

### UI Components (`components/ui/`)
These are generated Radix UI primitives via shadcn/ui. Use existing components before adding new ones.

### Feature Components
#### Home Page Components
- `FlightForm` - Client component for logging flights with react-hook-form
- `FlightMapWrapper` - Wrapper for map with dynamic import (Leaflet)
- `FlightMap` - Client component rendering Leaflet map with geodesic flight paths
- `StatsSection` - Statistics cards with date range filter
- `RecentFlights` - List of recent flights (clickable for detail modal)
- `AuthSignIn` - Sign-in form for unauthenticated users

#### Dashboard Components
- `DashboardContent` - Main container managing filter state, stats, and flight list
- `DashboardFilter` - Multi-filter component (date range, aircraft, airports)
- `FlightsList` - Paginated table with flight detail modal on row click
- `FlightDetailModal` - Modal showing full flight details with caching

#### Shared Components
- `AirportSelect` - Async autocomplete for airport selection (searches Supabase)

### Data Fetching Patterns

#### Server Actions (`lib/actions/flights.ts`)
- `logFlight(input)` - Create a new flight record
- `getFlights()` - Get all flights for current user
- `getFlightPaths()` - Get flights with airport coordinates (for map)
- `getFilteredFlights(filters)` - Get flights with optional filters
- `getFlightStats(startDate?, endDate?)` - Get aggregated statistics
- `getFlightById(flightId)` - Get single flight by ID
- `searchAirports(query)` - Search airports by ICAO/IATA/name
- `getAirportByIcao(icao)` - Get single airport
- `deleteFlight(flightId)` - Delete a flight

#### Client-Side Caching Pattern
`FlightDetailModal` implements an in-memory cache with:
- Cache TTL of 5 minutes
- Request deduplication (prevents duplicate pending requests)
- `preloadFlightData()` function for preloading data on hover/component mount

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Common Patterns

### Adding a new Server Action
1. Add the function to `lib/actions/flights.ts` (or create a new actions file)
2. Mark with `'use server'` at the top
3. Use Zod for input validation
4. Get the authenticated user before any database operations
5. Return `{ success: boolean, data?, error? }` shape

### Adding database migrations
Place new migrations in `supabase/migrations/` with numbered prefix:
```
supabase/migrations/002_new_feature.sql
```

### Map coordinates handling
PostGIS stores coordinates as `GEOGRAPHY(POINT, 4326)` which returns GeoJSON. The `extractCoordinates()` helper in [flight-map.tsx](components/flight-map.tsx) handles parsing.

### Filter Pattern
Dashboard filters use `useTransition()` for non-blocking updates:
- Filter changes trigger server actions via `startTransition()`
- Server returns filtered data
- Component state updates with new results
- UI shows loading indicator during transitions

### Pagination Pattern
`FlightsList` implements client-side pagination:
- 20 items per page (`ITEMS_PER_PAGE` constant)
- Page state resets when flight data changes
- Smooth scroll to top on page change
