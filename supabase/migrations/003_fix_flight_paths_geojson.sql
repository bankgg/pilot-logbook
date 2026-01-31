-- Fix flight_paths view to return GeoJSON for coordinates
-- The FlightMap component expects GeoJSON format: {"type":"Point","coordinates":[lng,lat]}

DROP VIEW IF EXISTS flight_paths;

CREATE VIEW flight_paths AS
SELECT
    f.id,
    f.user_id,
    f.flight_number,
    f.aircraft_reg,
    f.aircraft_type,
    f.dep_airport,
    dep.name AS dep_airport_name,
    ST_AsGeoJSON(dep.location)::text AS dep_location,
    f.arr_airport,
    arr.name AS arr_airport_name,
    ST_AsGeoJSON(arr.location)::text AS arr_location,
    f.block_off,
    f.takeoff,
    f.landing,
    f.block_on,
    f.duration_block,
    f.duration_flight,
    f.day_landings,
    f.night_landings,
    f.notes,
    f.created_at,
    f.updated_at
FROM flights f
JOIN airports dep ON f.dep_airport = dep.icao
JOIN airports arr ON f.arr_airport = arr.icao;
