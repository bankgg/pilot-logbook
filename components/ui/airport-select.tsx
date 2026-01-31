'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { searchAirports } from '@/lib/actions/flights'
import type { Airport } from '@/types/supabase'

interface AirportSelectProps {
  value: string
  onChange: (value: string, airportName?: string) => void
  placeholder?: string
}

export function AirportSelect({ value, onChange, placeholder = 'Select airport...' }: AirportSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [airports, setAirports] = React.useState<Airport[]>([])
  const [search, setSearch] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  // Fetch airports when search changes
  React.useEffect(() => {
    const fetchAirports = async () => {
      if (search.length < 2) {
        setAirports([])
        return
      }

      setLoading(true)
      const result = await searchAirports(search)
      if (result.success && result.data) {
        setAirports(result.data)
      }
      setLoading(false)
    }

    const timeout = setTimeout(fetchAirports, 300)
    return () => clearTimeout(timeout)
  }, [search])

  const selectedAirport = airports.find((a) => a.icao === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedAirport ? (
            <span className="truncate">
              {selectedAirport.icao} - {selectedAirport.name}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search ICAO or airport name..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : airports.length === 0 ? (
              <CommandEmpty>
                {search.length < 2 ? 'Type at least 2 characters...' : 'No airports found.'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {airports.map((airport) => (
                  <CommandItem
                    key={airport.icao}
                    value={airport.icao}
                    keywords={[airport.icao, airport.iata || '', airport.name]}
                    onSelect={(currentValue) => {
                      onChange(currentValue, airports.find((a) => a.icao === currentValue)?.name)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === airport.icao ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {airport.icao}
                        {airport.iata && <span className="text-muted-foreground"> ({airport.iata})</span>}
                      </span>
                      <span className="text-sm text-muted-foreground">{airport.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
