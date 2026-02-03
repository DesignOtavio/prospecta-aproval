-- Enable RLS and add policies for Activity Logs
ALTER TABLE prpsct_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON prpsct_activity_logs;
CREATE POLICY "Enable insert for authenticated users" ON prpsct_activity_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for authenticated users" ON prpsct_activity_logs;
CREATE POLICY "Enable select for authenticated users" ON prpsct_activity_logs FOR SELECT TO authenticated USING (true);

-- Add markers column to comments if it doesn't exist
ALTER TABLE prpsct_comments ADD COLUMN IF NOT EXISTS markers JSONB;
