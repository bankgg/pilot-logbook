-- Add indexes for dashboard filter performance
-- These indexes optimize queries that filter by aircraft type, registration, and airports

-- Index for aircraft type filtering
CREATE INDEX IF NOT EXISTS idx_flights_aircraft_type
    ON flights (aircraft_type);

-- Index for aircraft registration filtering
CREATE INDEX IF NOT EXISTS idx_flights_aircraft_reg
    ON flights (aircraft_reg);

-- Index for departure airport filtering
CREATE INDEX IF NOT EXISTS idx_flights_dep_airport
    ON flights (dep_airport);

-- Index for arrival airport filtering
CREATE INDEX IF NOT EXISTS idx_flights_arr_airport
    ON flights (arr_airport);

-- Composite index for user + aircraft_type (common filter combo)
CREATE INDEX IF NOT EXISTS idx_flights_user_aircraft_type
    ON flights (user_id, aircraft_type);

-- Composite index for user + dep_airport (common filter combo)
CREATE INDEX IF NOT EXISTS idx_flights_user_dep_airport
    ON flights (user_id, dep_airport);

-- Composite index for user + arr_airport (common filter combo)
CREATE INDEX IF NOT EXISTS idx_flights_user_arr_airport
    ON flights (user_id, arr_airport);

-- Comment explaining the index usage
COMMENT ON INDEX idx_flights_aircraft_type IS 'Optimizes dashboard filters by aircraft type';
COMMENT ON INDEX idx_flights_aircraft_reg IS 'Optimizes dashboard filters by aircraft registration';
COMMENT ON INDEX idx_flights_dep_airport IS 'Optimizes dashboard filters by departure airport';
COMMENT ON INDEX idx_flights_arr_airport IS 'Optimizes dashboard filters by arrival airport';
COMMENT ON INDEX idx_flights_user_aircraft_type IS 'Optimizes dashboard filters combining user and aircraft type (RLS + filter)';
COMMENT ON INDEX idx_flights_user_dep_airport IS 'Optimizes dashboard filters combining user and departure airport (RLS + filter)';
COMMENT ON INDEX idx_flights_user_arr_airport IS 'Optimizes dashboard filters combining user and arrival airport (RLS + filter)';
