-- Create baby log tables

-- Sleep Logs
CREATE TABLE IF NOT EXISTS sleep_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feed Logs
CREATE TABLE IF NOT EXISTS feed_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT NOT NULL,
    amount NUMERIC,
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Growth Logs
CREATE TABLE IF NOT EXISTS growth_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    height NUMERIC NOT NULL,
    weight NUMERIC NOT NULL,
    bmi NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Logs
CREATE TABLE IF NOT EXISTS health_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    condition TEXT NOT NULL,
    notes TEXT,
    severity TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vaccine Logs
CREATE TABLE IF NOT EXISTS vaccine_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    vaccine_name TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
