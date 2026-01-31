-- Enable PostGIS extension for geospatial data (airport coordinates)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- AIRPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS airports (
    icao TEXT PRIMARY KEY,
    iata TEXT,
    name TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326), -- WGS84 coordinate system (Lat/Long)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on location for efficient geospatial queries
CREATE INDEX idx_airports_location ON airports USING GIST (location);

-- ============================================
-- FLIGHTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS flights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flight_number TEXT,
    aircraft_reg TEXT NOT NULL,
    aircraft_type TEXT NOT NULL,

    -- Airport identifiers (ICAO codes)
    dep_airport TEXT NOT NULL REFERENCES airports(icao),
    arr_airport TEXT NOT NULL REFERENCES airports(icao),

    -- Timestamps (stored in UTC/Zulu time - aviation standard)
    block_off TIMESTAMPTZ,
    takeoff TIMESTAMPTZ,
    landing TIMESTAMPTZ,
    block_on TIMESTAMPTZ,

    -- Durations (stored in minutes for easier calculations)
    duration_block INTEGER, -- Block time: block_off to block_on
    duration_flight INTEGER, -- Flight time: takeoff to landing

    -- Landing counts
    day_landings INTEGER DEFAULT 0,
    night_landings INTEGER DEFAULT 0,

    -- Optional notes
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on flights table
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;

-- Users can only see their own flights
CREATE POLICY "Users can view own flights"
    ON flights
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own flights
CREATE POLICY "Users can insert own flights"
    ON flights
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own flights
CREATE POLICY "Users can update own flights"
    ON flights
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can only delete their own flights
CREATE POLICY "Users can delete own flights"
    ON flights
    FOR DELETE
    USING (auth.uid() = user_id);

-- Airports are publicly readable (reference data)
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Airports are publicly readable" ON airports FOR SELECT USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate duration in minutes between two timestamps
CREATE OR REPLACE FUNCTION calculate_duration_minutes(start_time TIMESTAMPTZ, end_time TIMESTAMPTZ)
RETURNS INTEGER AS $$
BEGIN
    IF start_time IS NULL OR end_time IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER / 60;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at on flights
CREATE TRIGGER update_flights_updated_at
    BEFORE UPDATE ON flights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on airports
CREATE TRIGGER update_airports_updated_at
    BEFORE UPDATE ON airports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE AIRPORT DATA (Optional - for testing)
-- ============================================

-- Insert a few sample airports
INSERT INTO airports (icao, iata, name, location) VALUES
    ('KLAX', 'LAX', 'Los Angeles International Airport', ST_SetSRID(ST_MakePoint(-118.4085, 33.9425), 4326)::GEOGRAPHY),
    ('KJFK', 'JFK', 'John F. Kennedy International Airport', ST_SetSRID(ST_MakePoint(-73.7781, 40.6413), 4326)::GEOGRAPHY),
    ('KORD', 'ORD', 'O''Hare International Airport', ST_SetSRID(ST_MakePoint(-87.9048, 41.9742), 4326)::GEOGRAPHY),
    ('EGLL', 'LHR', 'London Heathrow Airport', ST_SetSRID(ST_MakePoint(-0.4614, 51.4700), 4326)::GEOGRAPHY),
    ('RJTT', 'HND', 'Tokyo Haneda Airport', ST_SetSRID(ST_MakePoint(139.7797, 35.5494), 4326)::GEOGRAPHY)
ON CONFLICT (icao) DO NOTHING;

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- View for flight paths with airport coordinates (ready for GeoJSON/map rendering)
CREATE OR REPLACE VIEW flight_paths AS
SELECT
    f.id,
    f.user_id,
    f.flight_number,
    f.aircraft_reg,
    f.aircraft_type,
    f.dep_airport,
    dep.name AS dep_airport_name,
    dep.location AS dep_location,
    f.arr_airport,
    arr.name AS arr_airport_name,
    arr.location AS arr_location,
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
