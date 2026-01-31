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
import { getCachedAirports, filterAirports } from '@/lib/utils/airport-cache'
import type { Airport } from '@/types/supabase'

interface AirportSelectProps {
  value: string
  onChange: (value: string, airportName?: string) => void
  placeholder?: string
}

export function AirportSelect({ value, onChange, placeholder = 'Select airport...' }: AirportSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [allAirports, setAllAirports] = React.useState<Airport[]>([])
  const [filteredAirports, setFilteredAirports] = React.useState<Airport[]>([])
  const [search, setSearch] = React.useState('')
  const [loading, setLoading] = React.useState(true)

  // Fetch all airports on mount (uses cache if available)
  React.useEffect(() => {
    const loadAirports = async () => {
      setLoading(true)
      const airports = await getCachedAirports()
      setAllAirports(airports)
      setLoading(false)
    }

    loadAirports()
  }, [])

  // Filter airports when search changes (client-side filtering)
  React.useEffect(() => {
    const filtered = filterAirports(allAirports, search)
    setFilteredAirports(filtered)
  }, [search, allAirports])

  const selectedAirport = allAirports.find((a) => a.icao === value)

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
            ) : filteredAirports.length === 0 ? (
              <CommandEmpty>
                {search.length < 2 ? 'Type at least 2 characters...' : 'No airports found.'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredAirports.map((airport) => (
                  <CommandItem
                    key={airport.icao}
                    value={airport.icao}
                    keywords={[airport.icao, airport.iata || '', airport.name]}
                    onSelect={(currentValue) => {
                      onChange(currentValue, allAirports.find((a) => a.icao === currentValue)?.name)
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
