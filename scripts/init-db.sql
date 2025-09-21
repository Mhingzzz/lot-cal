-- Initialize the forex calculator database
-- This script runs automatically when the PostgreSQL container starts

-- Create a dedicated user for the forex calculator
CREATE USER IF NOT EXISTS forex_calculator_user WITH PASSWORD 'forex_calc_2024!';

-- Use the public schema (default schema) - keep it simple
-- No need to create additional schemas

-- Set default search path for the user (public is default)
ALTER ROLE forex_calculator_user SET search_path TO public;

-- Create extensions that might be useful for forex calculations
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Grant permissions on public schema (simple approach)
GRANT ALL PRIVILEGES ON DATABASE forex_calculator_db TO forex_calculator_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO forex_calculator_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO forex_calculator_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO forex_calculator_user;
GRANT USAGE ON SCHEMA public TO forex_calculator_user;

-- Allow creating tables in public schema
GRANT CREATE ON SCHEMA public TO forex_calculator_user;

-- Log successful initialization
CREATE TABLE IF NOT EXISTS initialization_log (
    id SERIAL PRIMARY KEY,
    initialized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT DEFAULT 'Forex calculator database initialized successfully'
);

INSERT INTO initialization_log (message) 
VALUES ('Simple database setup complete - using public schema only');

-- Log successful initialization
-- CREATE TABLE IF NOT EXISTS initialization_log (
--     id SERIAL PRIMARY KEY,
--     initialized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     message TEXT DEFAULT 'Forex calculator database initialized successfully'
-- );

-- INSERT INTO initialization_log (message) 
-- VALUES ('Simple database setup complete - using public schema only');