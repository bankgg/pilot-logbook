'use client'

import * as React from 'react'
import { MapContainer, TileLayer, Polyline, Popup, Marker, useMap } from 'react-leaflet'
import type { FlightPath } from '@/types/supabase'
import 'leaflet/dist/leaflet.css'

// Component to configure Leaflet icons on client side only
function LeafletIconConfig() {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        // @ts-expect-error - Leaflet internal property
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/marker-icon-2x.png',
          iconUrl: '/marker-icon.png',
          shadowUrl: '/marker-shadow.png',
        })
      })
    }
  }, [])
  return null
}

interface FlightMapProps {
  flightPaths: FlightPath[]
  className?: string
}

/**
 * Calculate intermediate points for a geodesic (curved) line between two coordinates
 * Uses a simple quadratic bezier curve approximation for visual effect
 * @param offset - Index to vary the curve for multiple flights on same route (0, 1, 2, etc.)
 */
function createGeodesicPath(
  start: [number, number],
  end: [number, number],
  offset: number = 0,
  numPoints: number = 50
): [number, number][] {
  const [startLng, startLat] = start
  const [endLng, endLat] = end

  // Calculate midpoint with "bulge" for curve effect
  const midLng = (startLng + endLng) / 2
  const midLat = (startLat + endLat) / 2

  // Add curvature based on distance (simple visual approximation)
  const distance = Math.sqrt(
    Math.pow(endLng - startLng, 2) + Math.pow(endLat - startLat, 2)
  )

  // Vary bulge amount and direction based on offset
  // Even offsets curve one way, odd offsets curve the other way
  const baseBulge = Math.min(distance * 0.2, 30)
  const bulgeVariance = 8 // How much to vary per flight
  const bulge = Math.max(5, baseBulge + (offset % 2 === 0 ? 1 : -1) * Math.floor(offset / 2 + 1) * bulgeVariance)

  // Calculate perpendicular direction for curve
  // Alternate direction for odd/even offsets to spread curves on both sides
  const angle = Math.atan2(endLat - startLat, endLng - startLng)
  const perpAngle = angle + Math.PI / 2 * (offset % 2 === 0 ? 1 : -1)

  const controlLng = midLng + Math.cos(perpAngle) * bulge
  const controlLat = midLat + Math.sin(perpAngle) * bulge

  // Generate points along quadratic bezier curve
  const points: [number, number][] = []
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const lng =
      Math.pow(1 - t, 2) * startLng +
      2 * (1 - t) * t * controlLng +
      Math.pow(t, 2) * endLng
    const lat =
      Math.pow(1 - t, 2) * startLat +
      2 * (1 - t) * t * controlLat +
      Math.pow(t, 2) * endLat
    points.push([lng, lat])
  }

  return points
}

/**
 * Extract coordinates from PostGIS GEOGRAPHY point
 * PostGIS returns ST_AsGeoJSON in format: {"type":"Point","coordinates":[lng,lat]}
 */
function extractCoordinates(geojson: string | null): [number, number] | null {
  if (!geojson) return null
  try {
    const parsed = JSON.parse(geojson)
    if (parsed.type === 'Point' && Array.isArray(parsed.coordinates)) {
      // PostGIS returns [longitude, latitude]
      return [parsed.coordinates[0], parsed.coordinates[1]]
    }
  } catch {
    // Invalid GeoJSON
  }
  return null
}

function MapBounds({ flightPaths }: { flightPaths: FlightPath[] }) {
  const map = useMap()

  React.useEffect(() => {
    if (flightPaths.length === 0) return

    const bounds: [number, number][] = []
    flightPaths.forEach((flight) => {
      const depCoords = extractCoordinates(flight.dep_location)
      const arrCoords = extractCoordinates(flight.arr_location)

      if (depCoords) bounds.push([depCoords[1], depCoords[0]])
      if (arrCoords) bounds.push([arrCoords[1], arrCoords[0]])
    })

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [flightPaths, map])

  return null
}

export function FlightMap({ flightPaths, className }: FlightMapProps) {
  // Group flights by route to assign offsets for overlapping paths
  const routeGroups = new Map<string, FlightPath[]>()
  flightPaths.forEach((flight) => {
    const routeKey = `${flight.dep_airport}-${flight.arr_airport}`
    if (!routeGroups.has(routeKey)) {
      routeGroups.set(routeKey, [])
    }
    routeGroups.get(routeKey)!.push(flight)
  })

  // Assign offset to each flight based on its position in the route group
  const flightOffsets = new Map<FlightPath, number>()
  routeGroups.forEach((flights) => {
    flights.forEach((flight, idx) => {
      flightOffsets.set(flight, idx)
    })
  })

  // Create flight path polylines with geodesic curves
  const flightPolylines = flightPaths.map((flight) => {
    const depCoords = extractCoordinates(flight.dep_location)
    const arrCoords = extractCoordinates(flight.arr_location)

    if (!depCoords || !arrCoords) return null

    const offset = flightOffsets.get(flight) || 0

    // createGeodesicPath returns [lng, lat], convert to [lat, lng] for Leaflet Polyline
    const curvedPath = createGeodesicPath(depCoords, arrCoords, offset)
    const pathForLeaflet = curvedPath.map(([lng, lat]) => [lat, lng] as [number, number])

    return {
      flight,
      path: pathForLeaflet,
      depCoords: [depCoords[1], depCoords[0]] as [number, number], // Leaflet uses [lat, lng]
      arrCoords: [arrCoords[1], arrCoords[0]] as [number, number],
    }
  }).filter(Boolean)

  // Default center (will be overridden by MapBounds if there are flights)
  const defaultCenter: [number, number] = [30, 0]
  const defaultZoom = 2

  return (
    <div className={className}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full rounded-lg overflow-hidden"
        scrollWheelZoom={true}
      >
        <LeafletIconConfig />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds flightPaths={flightPaths} />

        {flightPolylines.map((item: any, idx) => (
          <React.Fragment key={item.flight.id || idx}>
            {/* Invisible hit area for easier clicking - wider transparent line */}
            <Polyline
              positions={item.path}
              color="transparent"
              weight={20}
              opacity={0}
            >
              <Popup>
                <div className="text-sm space-y-2">
                  <div>
                    <p className="font-semibold text-lg">
                      {item.flight.dep_airport} → {item.flight.arr_airport}
                    </p>
                    {item.flight.flight_number && (
                      <p className="text-muted-foreground">Flight: {item.flight.flight_number}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-medium">Aircraft</p>
                      <p className="text-muted-foreground">{item.flight.aircraft_type}</p>
                      <p className="text-muted-foreground">{item.flight.aircraft_reg}</p>
                    </div>
                    <div>
                      <p className="font-medium">Duration</p>
                      {item.flight.duration_flight ? (
                        <p className="text-muted-foreground">
                          {Math.floor(item.flight.duration_flight / 60)}h {item.flight.duration_flight % 60}m
                        </p>
                      ) : (
                        <p className="text-muted-foreground">-</p>
                      )}
                    </div>
                  </div>
                  {(item.flight.day_landings > 0 || item.flight.night_landings > 0) && (
                    <div className="text-xs">
                      <p className="font-medium">Landings</p>
                      <p className="text-muted-foreground">
                        Day: {item.flight.day_landings} | Night: {item.flight.night_landings}
                      </p>
                    </div>
                  )}
                  {item.flight.notes && (
                    <div className="text-xs">
                      <p className="font-medium">Notes</p>
                      <p className="text-muted-foreground">{item.flight.notes}</p>
                    </div>
                  )}
                </div>
              </Popup>
            </Polyline>

            {/* Visible geodesic flight path */}
            <Polyline
              positions={item.path}
              color="#3b82f6"
              weight={3}
              opacity={0.8}
              dashArray="5, 10"
            />

            {/* Departure marker */}
            <Marker position={item.depCoords}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{item.flight.dep_airport}</p>
                  <p className="text-muted-foreground">{item.flight.dep_airport_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Departure</p>
                </div>
              </Popup>
            </Marker>

            {/* Arrival marker */}
            <Marker position={item.arrCoords}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{item.flight.arr_airport}</p>
                  <p className="text-muted-foreground">{item.flight.arr_airport_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Arrival</p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  )
}
