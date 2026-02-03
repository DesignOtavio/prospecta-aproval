-- Fix RLS for prpsct_activity_logs
ALTER TABLE prpsct_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for authenticated users" 
ON prpsct_activity_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" 
ON prpsct_activity_logs 
FOR SELECT 
TO authenticated 
USING (true);

-- Check prpsct_comments for metadata/markers support
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prpsct_comments';
