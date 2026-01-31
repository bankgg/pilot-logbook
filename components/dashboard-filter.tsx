'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { addMonths, format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

type DateFilterType = 'all' | 'month' | 'range'

export interface DashboardFilters {
  dateFilter: DateFilterType
  startDate?: string
  endDate?: string
  aircraftType?: string
  aircraftReg?: string
  depAirport?: string
  arrAirport?: string
}

interface DashboardFilterProps {
  onFilterChange: (filters: DashboardFilters) => void
  availableAircraftTypes?: string[]
  availableAircraftRegs?: string[]
  availableAirports?: string[]
}

export function DashboardFilter({
  onFilterChange,
  availableAircraftTypes = [],
  availableAircraftRegs = [],
  availableAirports = [],
}: DashboardFilterProps) {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all')
  const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to?: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [aircraftType, setAircraftType] = useState<string>('__all__')
  const [aircraftReg, setAircraftReg] = useState<string>('__all__')
  const [depAirport, setDepAirport] = useState<string>('__all__')
  const [arrAirport, setArrAirport] = useState<string>('__all__')
  const [isTransition, startTransition] = useTransition()

  // Apply all filters - uses closure values instead of refs
  const applyFilters = (currentDateFilter: DateFilterType, currentDateRange: typeof dateRange, currentType: string, currentReg: string, currentDep: string, currentArr: string) => {
    const filters: DashboardFilters = {
      dateFilter: currentDateFilter,
      aircraftType: currentType === '__all__' ? undefined : currentType,
      aircraftReg: currentReg === '__all__' ? undefined : currentReg,
      depAirport: currentDep === '__all__' ? undefined : currentDep,
      arrAirport: currentArr === '__all__' ? undefined : currentArr,
    }

    if (currentDateFilter === 'month') {
      const now = new Date()
      filters.startDate = startOfMonth(now).toISOString()
      filters.endDate = endOfMonth(now).toISOString()
    } else if (currentDateFilter === 'range' && currentDateRange.from) {
      filters.startDate = startOfDay(currentDateRange.from).toISOString()
      filters.endDate = currentDateRange.to
        ? endOfDay(currentDateRange.to).toISOString()
        : endOfDay(currentDateRange.from).toISOString()
    }

    onFilterChange(filters)
  }

  // Handle date filter type change
  const handleDateFilterChange = (type: DateFilterType) => {
    setDateFilter(type)
    const newDateRange = type === 'month'
      ? { from: startOfMonth(new Date()), to: endOfMonth(new Date()) }
      : dateRange

    if (type === 'month') {
      setDateRange(newDateRange)
    }

    startTransition(() => {
      setTimeout(() => applyFilters(type, newDateRange, aircraftType, aircraftReg, depAirport, arrAirport), 0)
    })
  }

  // Handle date range changes
  const handleDateRangeChange = (range: { from: Date | undefined; to?: Date } | undefined) => {
    if (!range?.from) return

    const newRange: { from: Date; to?: Date } = {
      from: range.from,
      to: range.to || range.from,
    }
    setDateRange(newRange)

    // Auto-switch to range mode when dates are selected
    if (dateFilter !== 'range') {
      setDateFilter('range')
    }

    startTransition(() => {
      setTimeout(() => {
        applyFilters('range', newRange, aircraftType, aircraftReg, depAirport, arrAirport)
      }, 0)
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setDateFilter('all')
    setAircraftType('__all__')
    setAircraftReg('__all__')
    setDepAirport('__all__')
    setArrAirport('__all__')
    onFilterChange({ dateFilter: 'all' })
  }

  // Get display text for current filter
  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'all':
        return 'All Time'
      case 'month':
        return format(new Date(), 'MMM yy')
      case 'range':
        if (!dateRange.from) return 'Select dates'
        if (!dateRange.to) return format(dateRange.from, 'd MMM yy')
        return `${format(dateRange.from, 'd MMM')} - ${format(dateRange.to, 'd MMM yy')}`
    }
  }

  // Count active filters
  const activeFilterCount = [
    dateFilter !== 'all',
    aircraftType !== '__all__',
    aircraftReg !== '__all__',
    depAirport !== '__all__',
    arrAirport !== '__all__',
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center gap-3">
          <Label className="text-sm text-muted-foreground">Date Range:</Label>
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={dateFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleDateFilterChange('all')}
              className="text-xs h-7 px-2.5"
            >
              All Time
            </Button>
            <Button
              variant={dateFilter === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleDateFilterChange('month')}
              className="text-xs h-7 px-2.5"
            >
              Current Month
            </Button>
            <Button
              variant={dateFilter === 'range' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleDateFilterChange('range')}
              className="text-xs h-7 px-2.5"
            >
              Custom Range
            </Button>
          </div>

          {/* Date Picker (only show for range mode) */}
          {dateFilter === 'range' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'justify-start text-left font-normal h-7 px-2',
                    !dateRange.from && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-1 h-3 w-3 shrink-0" />
                  <span className="truncate text-xs">{getFilterLabel()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Additional Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Aircraft Type Filter */}
          <div className="space-y-1.5">
            <Label htmlFor="aircraft-type" className="text-xs text-muted-foreground">
              Aircraft Type
            </Label>
            {availableAircraftTypes.length > 0 ? (
              <Select
                value={aircraftType}
                onValueChange={(value) => {
                  setAircraftType(value)
                  startTransition(() => {
                    setTimeout(() => applyFilters(dateFilter, dateRange, value, aircraftReg, depAirport, arrAirport), 0)
                  })
                }}
              >
                <SelectTrigger id="aircraft-type" className="h-8">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All types</SelectItem>
                  {availableAircraftTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="aircraft-type"
                placeholder="e.g. B737-800"
                value={aircraftType === '__all__' ? '' : aircraftType}
                onChange={(e) => {
                  setAircraftType(e.target.value || '__all__')
                  startTransition(() => {
                    setTimeout(applyFilters, 0)
                  })
                }}
                className="h-8"
              />
            )}
          </div>

          {/* Aircraft Registration Filter */}
          <div className="space-y-1.5">
            <Label htmlFor="aircraft-reg" className="text-xs text-muted-foreground">
              Registration
            </Label>
            {availableAircraftRegs.length > 0 ? (
              <Select
                value={aircraftReg}
                onValueChange={(value) => {
                  setAircraftReg(value)
                  startTransition(() => {
                    setTimeout(() => applyFilters(dateFilter, dateRange, aircraftType, value, depAirport, arrAirport), 0)
                  })
                }}
              >
                <SelectTrigger id="aircraft-reg" className="h-8">
                  <SelectValue placeholder="All registrations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All registrations</SelectItem>
                  {availableAircraftRegs.map((reg) => (
                    <SelectItem key={reg} value={reg}>
                      {reg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="aircraft-reg"
                placeholder="e.g. N12345"
                value={aircraftReg === '__all__' ? '' : aircraftReg}
                onChange={(e) => {
                  setAircraftReg(e.target.value || '__all__')
                  startTransition(() => {
                    setTimeout(applyFilters, 0)
                  })
                }}
                className="h-8"
              />
            )}
          </div>

          {/* Departure Airport Filter */}
          <div className="space-y-1.5">
            <Label htmlFor="dep-airport" className="text-xs text-muted-foreground">
              Departure Airport
            </Label>
            {availableAirports.length > 0 ? (
              <Select
                value={depAirport}
                onValueChange={(value) => {
                  setDepAirport(value)
                  startTransition(() => {
                    setTimeout(() => applyFilters(dateFilter, dateRange, aircraftType, aircraftReg, value, arrAirport), 0)
                  })
                }}
              >
                <SelectTrigger id="dep-airport" className="h-8">
                  <SelectValue placeholder="All airports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All airports</SelectItem>
                  {availableAirports.map((airport) => (
                    <SelectItem key={airport} value={airport}>
                      {airport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="dep-airport"
                placeholder="e.g. KLAX"
                maxLength={4}
                value={depAirport === '__all__' ? '' : depAirport}
                onChange={(e) => {
                  setDepAirport(e.target.value.toUpperCase() || '__all__')
                  startTransition(() => {
                    setTimeout(applyFilters, 0)
                  })
                }}
                className="h-8"
              />
            )}
          </div>

          {/* Arrival Airport Filter */}
          <div className="space-y-1.5">
            <Label htmlFor="arr-airport" className="text-xs text-muted-foreground">
              Arrival Airport
            </Label>
            {availableAirports.length > 0 ? (
              <Select
                value={arrAirport}
                onValueChange={(value) => {
                  setArrAirport(value)
                  startTransition(() => {
                    setTimeout(() => applyFilters(dateFilter, dateRange, aircraftType, aircraftReg, depAirport, value), 0)
                  })
                }}
              >
                <SelectTrigger id="arr-airport" className="h-8">
                  <SelectValue placeholder="All airports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All airports</SelectItem>
                  {availableAirports.map((airport) => (
                    <SelectItem key={airport} value={airport}>
                      {airport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="arr-airport"
                placeholder="e.g. KJFK"
                maxLength={4}
                value={arrAirport === '__all__' ? '' : arrAirport}
                onChange={(e) => {
                  setArrAirport(e.target.value.toUpperCase() || '__all__')
                  startTransition(() => {
                    setTimeout(applyFilters, 0)
                  })
                }}
                className="h-8"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
