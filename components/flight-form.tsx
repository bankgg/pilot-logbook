'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Plane } from 'lucide-react'
import { toast } from 'sonner'
import type { LogFlightInput } from '@/lib/actions/flights'
import { logFlight } from '@/lib/actions/flights'
import { AirportSelect } from '@/components/ui/airport-select'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Simple validation schema for the form
// VTBS (Suvarnabhumi Airport, Bangkok) is set as the default departure airport
const formSchema = {
  flight_number: '',
  aircraft_reg: '',
  aircraft_type: '',
  dep_airport: 'VTBS',
  arr_airport: '',
  block_off: '',
  takeoff: '',
  landing: '',
  block_on: '',
  day_landings: 0,
  night_landings: 0,
  notes: '',
}

export function FlightForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<LogFlightInput>({
    defaultValues: formSchema,
    resolver: zodResolver(
      // Inline schema for simplicity
      require('zod').object({
        flight_number: require('zod').string().optional(),
        aircraft_reg: require('zod').string().min(1, 'Required'),
        aircraft_type: require('zod').string().min(1, 'Required'),
        dep_airport: require('zod').string().length(4),
        arr_airport: require('zod').string().length(4),
        block_off: require('zod').string().datetime().nullable().optional(),
        takeoff: require('zod').string().datetime().nullable().optional(),
        landing: require('zod').string().datetime().nullable().optional(),
        block_on: require('zod').string().datetime().nullable().optional(),
        day_landings: require('zod').number().int().min(0).default(0),
        night_landings: require('zod').number().int().min(0).default(0),
        notes: require('zod').string().optional(),
      })
    ),
  })

  const onSubmit = async (data: LogFlightInput) => {
    setIsSubmitting(true)
    try {
      const result = await logFlight(data)

      if (result.success) {
        toast.success('Flight logged successfully!')
        form.reset()
      } else {
        toast.error(result.error || 'Failed to log flight')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Log Flight
        </CardTitle>
        <CardDescription>
          Record your flight details. All times are stored in UTC (Zulu).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Flight Number (Optional) */}
            <FormField
              control={form.control}
              name="flight_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flight Number</FormLabel>
                  <FormControl>
                    <Input placeholder="TG413" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Aircraft Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="aircraft_reg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aircraft Registration</FormLabel>
                    <FormControl>
                      <Input placeholder="HS-TOA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="aircraft_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aircraft Type</FormLabel>
                    <FormControl>
                      <Input placeholder="A320" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Departure & Arrival Airports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dep_airport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departure Airport (ICAO)</FormLabel>
                    <FormControl>
                      <AirportSelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select departure..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="arr_airport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arrival Airport (ICAO)</FormLabel>
                    <FormControl>
                      <AirportSelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select arrival..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateTimePicker
                control={form.control}
                name="block_off"
                label="Block Off"
                description="Chocks away / pushback"
              />
              <DateTimePicker
                control={form.control}
                name="takeoff"
                label="Takeoff"
                description="Wheels up"
              />
              <DateTimePicker
                control={form.control}
                name="landing"
                label="Landing"
                description="Wheels down"
              />
              <DateTimePicker
                control={form.control}
                name="block_on"
                label="Block On"
                description="Chocks to parking"
              />
            </div>

            {/* Landings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="day_landings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day Landings</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={9}
                        {...field}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          field.onChange(value)
                          if (e.target.value.length >= 1) {
                            e.target.blur()
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="night_landings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Night Landings</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={9}
                        {...field}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          field.onChange(value)
                          if (e.target.value.length >= 1) {
                            e.target.blur()
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional flight notes..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Logging Flight...' : 'Log Flight'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// Helper component for date/time picker
function DateTimePicker({
  control,
  name,
  label,
  description,
}: {
  control: any
  name: string
  label: string
  description?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [timeValue, setTimeValue] = React.useState('')

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Update time value when field value changes
        React.useEffect(() => {
          if (field.value) {
            const date = new Date(field.value)
            const hours = date.getHours().toString().padStart(2, '0')
            const minutes = date.getMinutes().toString().padStart(2, '0')
            setTimeValue(`${hours}:${minutes}`)
          }
        }, [field.value])

        const handleDateSelect = (date: Date | undefined) => {
          if (date) {
            const currentValue = field.value ? new Date(field.value) : new Date()
            date.setHours(currentValue.getHours(), currentValue.getMinutes())
            field.onChange(date.toISOString())
          }
        }

        const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newTimeValue = e.target.value
          setTimeValue(newTimeValue)

          if (field.value && newTimeValue) {
            const [hours, minutes] = newTimeValue.split(':').map(Number)
            const newDate = new Date(field.value)
            newDate.setHours(hours, minutes)
            field.onChange(newDate.toISOString())
          } else if (newTimeValue) {
            const [hours, minutes] = newTimeValue.split(':').map(Number)
            const newDate = new Date()
            newDate.setHours(hours, minutes)
            field.onChange(newDate.toISOString())
          }
        }

        return (
          <FormItem className="flex flex-col gap-2">
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(new Date(field.value), 'd MMM yy, p') : 'Pick date & time'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-3">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time</label>
                      <Input
                        type="time"
                        value={timeValue}
                        onChange={handleTimeChange}
                        className="w-full"
                      />
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => setOpen(false)}
                    >
                      Done
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </FormControl>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
