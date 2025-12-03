-- Migration script to create the new database schema
-- Run this in Supabase SQL Editor

-- Step 1: Create the persons table
-- Using BIGINT to match existing attendance table ID type
CREATE TABLE IF NOT EXISTS persons (
    id BIGSERIAL PRIMARY KEY,
    pass_number TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    team TEXT,
    birth_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all columns exist (in case table was created partially before)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'persons') THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'persons' AND column_name = 'pass_number') THEN
            ALTER TABLE persons ADD COLUMN pass_number TEXT;
            ALTER TABLE persons ADD CONSTRAINT persons_pass_number_key UNIQUE (pass_number);
            ALTER TABLE persons ALTER COLUMN pass_number SET NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'persons' AND column_name = 'first_name') THEN
            ALTER TABLE persons ADD COLUMN first_name TEXT NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'persons' AND column_name = 'last_name') THEN
            ALTER TABLE persons ADD COLUMN last_name TEXT NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'persons' AND column_name = 'team') THEN
            ALTER TABLE persons ADD COLUMN team TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'persons' AND column_name = 'birth_date') THEN
            ALTER TABLE persons ADD COLUMN birth_date DATE;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'persons' AND column_name = 'created_at') THEN
            ALTER TABLE persons ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'persons' AND column_name = 'updated_at') THEN
            ALTER TABLE persons ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Step 2: Update the existing attendance table (if it exists) or create new one
-- Note: If attendance table already exists with bigint id, we'll use that
-- If it doesn't exist, this will create it with bigint id
DO $$
BEGIN
    -- Check if attendance table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
        -- Create new attendance table
        CREATE TABLE attendance (
            id BIGSERIAL PRIMARY KEY,
            date DATE NOT NULL,
            activity_type TEXT NOT NULL,
            total_persons INTEGER NOT NULL DEFAULT 0,
            absent INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(date, activity_type)
        );
    ELSE
        -- Table exists, add new columns if they don't exist
        ALTER TABLE attendance 
            ADD COLUMN IF NOT EXISTS total_persons INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS absent INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add unique constraint if it doesn't exist (separate statement to avoid nested DO block)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'attendance_date_activity_type_key'
        ) THEN
            ALTER TABLE attendance ADD CONSTRAINT attendance_date_activity_type_key 
                UNIQUE(date, activity_type);
        END IF;
    END IF;
END $$;

-- Step 3: Create the junction table for many-to-many relationship
-- This links attendance records to persons (who was present)
-- Using BIGINT to match the attendance.id type
CREATE TABLE IF NOT EXISTS attendance_persons (
    id BIGSERIAL PRIMARY KEY,
    attendance_id BIGINT NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
    person_id BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure a person can only be marked present once per attendance record
    UNIQUE(attendance_id, person_id)
);

-- Step 4: Create indexes for better query performance
-- Only create indexes if the tables and columns exist
DO $$
BEGIN
    -- Index on attendance table
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_attendance_date') THEN
            CREATE INDEX idx_attendance_date ON attendance(date);
        END IF;
    END IF;
    
    -- Indexes on attendance_persons table
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance_persons') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_attendance_persons_attendance_id') THEN
            CREATE INDEX idx_attendance_persons_attendance_id ON attendance_persons(attendance_id);
        END IF;
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_attendance_persons_person_id') THEN
            CREATE INDEX idx_attendance_persons_person_id ON attendance_persons(person_id);
        END IF;
    END IF;
    
    -- Indexes on persons table (check if table and columns exist)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'persons') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'persons' AND column_name = 'pass_number') THEN
            IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_persons_pass_number') THEN
                CREATE INDEX idx_persons_pass_number ON persons(pass_number);
            END IF;
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'persons' AND column_name = 'team') THEN
            IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_persons_team') THEN
                CREATE INDEX idx_persons_team ON persons(team);
            END IF;
        END IF;
    END IF;
END $$;

-- Step 5: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create triggers to automatically update updated_at
CREATE TRIGGER update_persons_updated_at
    BEFORE UPDATE ON persons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Enable Row Level Security (RLS) on all tables
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_persons ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies to allow public access (adjust as needed for security)
-- Policy for persons table
CREATE POLICY "Allow public read on persons"
    ON persons FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow public insert on persons"
    ON persons FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow public update on persons"
    ON persons FOR UPDATE
    TO anon
    USING (true);

-- Policy for attendance table
CREATE POLICY "Allow public read on attendance"
    ON attendance FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow public insert on attendance"
    ON attendance FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow public update on attendance"
    ON attendance FOR UPDATE
    TO anon
    USING (true);

-- Policy for attendance_persons junction table
CREATE POLICY "Allow public read on attendance_persons"
    ON attendance_persons FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow public insert on attendance_persons"
    ON attendance_persons FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow public delete on attendance_persons"
    ON attendance_persons FOR DELETE
    TO anon
    USING (true);

-- Optional: Create a view for easier querying
CREATE OR REPLACE VIEW attendance_with_persons AS
SELECT 
    a.id as attendance_id,
    a.date,
    a.activity_type,
    a.total_persons,
    a.absent,
    a.created_at,
    COALESCE(
        json_agg(
            json_build_object(
                'id', p.id,
                'pass_number', p.pass_number,
                'first_name', p.first_name,
                'last_name', p.last_name,
                'team', p.team,
                'birth_date', p.birth_date
            )
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'::json
    ) as present_persons
FROM attendance a
LEFT JOIN attendance_persons ap ON a.id = ap.attendance_id
LEFT JOIN persons p ON ap.person_id = p.id
GROUP BY a.id, a.date, a.activity_type, a.total_persons, a.absent, a.created_at;

