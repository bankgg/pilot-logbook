'use client'

import * as React from 'react'
import { addMonths, format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DateFilterType = 'all' | 'month' | 'range'

interface StatsFilterProps {
  onFilterChange: (type: DateFilterType, startDate?: string, endDate?: string) => void
}

export function StatsFilter({ onFilterChange }: StatsFilterProps) {
  const [filterType, setFilterType] = React.useState<DateFilterType>('all')
  const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to?: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  // Handle filter type changes
  const handleFilterChange = (type: DateFilterType) => {
    setFilterType(type)

    if (type === 'all') {
      onFilterChange('all')
    } else if (type === 'month') {
      const now = new Date()
      const start = startOfMonth(now)
      const end = endOfMonth(now)
      setDateRange({ from: start, to: end })
      onFilterChange('month', start.toISOString(), end.toISOString())
    } else if (type === 'range') {
      if (dateRange.from && dateRange.to) {
        onFilterChange(
          'range',
          startOfDay(dateRange.from).toISOString(),
          endOfDay(dateRange.to).toISOString()
        )
      }
    }
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
    if (filterType !== 'range') {
      setFilterType('range')
    }

    onFilterChange(
      'range',
      startOfDay(newRange.from).toISOString(),
      endOfDay(newRange.to || newRange.from).toISOString()
    )
  }

  // Get display text for current filter
  const getFilterLabel = () => {
    switch (filterType) {
      case 'all':
        return 'All Time'
      case 'month':
        return format(new Date(), 'MMMM yyyy')
      case 'range':
        if (!dateRange.from) return 'Select dates'
        if (!dateRange.to) return format(dateRange.from, 'MMM dd, yyyy')
        return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {/* Filter Type Buttons */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <Button
          variant={filterType === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('all')}
          className="text-xs h-7 px-1.5 sm:px-2.5"
        >
          All
        </Button>
        <Button
          variant={filterType === 'month' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('month')}
          className="text-xs h-7 px-1.5 sm:px-2.5"
        >
          Current Month
        </Button>
        <Button
          variant={filterType === 'range' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('range')}
          className="text-xs h-7 px-1.5 sm:px-2.5"
        >
          Range
        </Button>
      </div>

      {/* Date Picker (only show for range mode) */}
      {filterType === 'range' && (
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
  )
}
