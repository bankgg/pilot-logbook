# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server (Next.js 16 with Turbopack)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

**Package Manager:** This project uses `pnpm` (specified in packageManager field).

## Architecture Overview

**PilotLog** is a mobile-first flight logbook application built with Next.js 16 App Router and Supabase.

### Tech Stack
- **Framework:** Next.js 16 with App Router (React Server Components by default)
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Styling:** Tailwind CSS v4 + Radix UI components (shadcn/ui)
- **Forms:** react-hook-form + Zod validation
- **Maps:** Leaflet + react-leaflet with PostGIS for geospatial data
- **Package Manager:** pnpm

### Key Architectural Patterns

#### Supabase Client Pattern (SSR)
The app uses three separate Supabase client instances for different contexts:
- `lib/supabase/client.ts` - Browser client (for Client Components)
- `lib/supabase/server.ts` - Server client with Next.js cookies (for Server Components/Actions)
- `lib/supabase/middleware.ts` - Middleware client for session refresh

All use `@supabase/ssr` package for proper cookie handling across server/client boundaries.

#### Server Actions with RLS
All database mutations use **Server Actions** (`lib/actions/flights.ts`) that:
1. Validate input with Zod schemas
2. Get the authenticated user via `supabase.auth.getUser()`
3. Enforce user ownership via RLS policies on the `user_id` column
4. Call `revalidatePath('/dashboard')` after mutations

**Never bypass Server Actions for database writes** - RLS depends on proper user context.

#### Database Schema
- **flights** table: Stores flight records with RLS enabled (users can only see their own flights)
- **airports** table: Public reference data with PostGIS `GEOGRAPHY(POINT, 4326)` for coordinates
- **flight_paths** view: Joins flights with airports to include coordinates for map rendering

Key PostgreSQL features:
- PostGIS extension for geospatial queries
- Row Level Security (RLS) on flights table
- Triggers for auto-updating `updated_at` timestamps

#### Client vs Server Components
- **Server Components (default):** `app/dashboard/page.tsx`, `app/page.tsx`
- **Client Components:** Components with `'use client'` directive (forms, maps, interactive UI)

When adding components that need interactivity (state, event handlers), add `'use client'` at the top.

#### Path Aliases
The `@/*` alias maps to the project root. Use it for all imports:
```ts
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
```

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
- `FlightForm` - Client component for logging flights with react-hook-form
- `FlightMap` - Client component rendering Leaflet map with geodesic flight paths
- `AirportSelect` - Async autocomplete for airport selection (searches Supabase)

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
PostGIS stores coordinates as `GEOGRAPHY(POINT, 4326)` which returns GeoJSON. The `extractCoordinates()` helper in `flight-map.tsx` handles parsing.
