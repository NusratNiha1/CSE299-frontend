-- ============================================
-- SIMPLE SOLUTION: Public Avatar Uploads
-- ============================================
-- This is the simplest approach - allows anyone to upload to the avatars bucket
-- Run this SQL in your Supabase SQL Editor

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop all existing policies for avatars
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create a single policy that allows all operations for authenticated users
CREATE POLICY "Public Access"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Verify the policy was created
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'objects' AND policyname = 'Public Access';
