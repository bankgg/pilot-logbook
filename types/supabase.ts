/**
 * Supabase Database Types
 *
 * To generate updated types after schema changes, run:
 *
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
 *
 * Or if using Supabase CLI:
 * npx supabase gen types typescript --local > types/supabase.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      airports: {
        Row: {
          icao: string
          iata: string | null
          location: string | null // PostGIS geography point
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          icao: string
          iata?: string | null
          location?: string | null
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          icao?: string
          iata?: string | null
          location?: string | null
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      flights: {
        Row: {
          id: string
          user_id: string
          flight_number: string | null
          aircraft_reg: string
          aircraft_type: string
          dep_airport: string
          arr_airport: string
          block_off: string | null
          takeoff: string | null
          landing: string | null
          block_on: string | null
          duration_block: number | null
          duration_flight: number | null
          day_landings: number
          night_landings: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          flight_number?: string | null
          aircraft_reg: string
          aircraft_type: string
          dep_airport: string
          arr_airport: string
          block_off?: string | null
          takeoff?: string | null
          landing?: string | null
          block_on?: string | null
          duration_block?: number | null
          duration_flight?: number | null
          day_landings?: number
          night_landings?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          flight_number?: string | null
          aircraft_reg?: string
          aircraft_type?: string
          dep_airport?: string
          arr_airport?: string
          block_off?: string | null
          takeoff?: string | null
          landing?: string | null
          block_on?: string | null
          duration_block?: number | null
          duration_flight?: number | null
          day_landings?: number
          night_landings?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      flight_paths: {
        Row: {
          id: string
          user_id: string
          flight_number: string | null
          aircraft_reg: string
          aircraft_type: string
          dep_airport: string
          dep_airport_name: string
          dep_location: string | null
          arr_airport: string
          arr_airport_name: string
          arr_location: string | null
          block_off: string | null
          takeoff: string | null
          landing: string | null
          block_on: string | null
          duration_block: number | null
          duration_flight: number | null
          day_landings: number
          night_landings: number
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
    }
    Functions: {
      calculate_duration_minutes: {
        Args: {
          start_time: string
          end_time: string
        }
        Returns: number
      }
    }
    Enums: {
      // Add any enums here if needed
    }
  }
}

// Row type helpers
export type Airport = Database['public']['Tables']['airports']['Row']
export type AirportInsert = Database['public']['Tables']['airports']['Insert']
export type Flight = Database['public']['Tables']['flights']['Row']
export type FlightInsert = Database['public']['Tables']['flights']['Insert']
export type FlightPath = Database['public']['Views']['flight_paths']['Row']
