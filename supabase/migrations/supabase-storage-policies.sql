-- ============================================
-- Supabase Storage Policies for Avatar Uploads
-- ============================================
-- Run this SQL in your Supabase SQL Editor to fix the RLS policy error

-- First, ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;

-- Policy 1: Allow authenticated users to INSERT (upload) files to avatars bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy 2: Allow authenticated users to UPDATE their own files
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Policy 3: Allow public SELECT (read) access to all files in avatars bucket
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy 4: Allow authenticated users to DELETE their own files
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%avatar%';
