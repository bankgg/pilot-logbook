-- Add indexes for improved stats filtering performance
-- These indexes optimize queries that filter flights by user and date range

-- Composite index on user_id and created_at for stats filtering
-- This covers RLS policy lookups AND date range queries in a single index scan
CREATE INDEX IF NOT EXISTS idx_flights_user_created
    ON flights (user_id, created_at DESC);

-- Index for sorting flights by creation date (dashboard list view)
CREATE INDEX IF NOT EXISTS idx_flights_created_at
    ON flights (created_at DESC);

-- Comment explaining the index usage
COMMENT ON INDEX idx_flights_user_created IS 'Optimizes stats queries filtering by user_id and date range (RLS + created_at)';
COMMENT ON INDEX idx_flights_created_at IS 'Optimizes dashboard queries that display recent flights ordered by date';
