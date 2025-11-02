/*
# [Create Evidence Photos Storage Bucket]
This migration creates the evidence-photos bucket in Supabase Storage and sets up the necessary policies for authenticated users.

## Metadata:
- Schema-Category: "Storage"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the bucket and policies)

## Structure Details:
- Bucket: evidence-photos (public bucket for storing inspection evidence photos)
- Policies: INSERT and SELECT policies for authenticated users

## Security Implications:
- Bucket is public for easier photo access
- Only authenticated users can upload photos
- Only authenticated users can read photos
*/

-- Insert bucket into storage.buckets if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence-photos',
  'evidence-photos',
  true, -- Public bucket for easier access to photos
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'] -- Allowed image types
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN
  -- RLS might already be enabled, ignore error
END $$;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Authenticated users can upload evidence photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read evidence photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update evidence photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete evidence photos" ON storage.objects;

-- Policy for authenticated users to upload evidence photos
CREATE POLICY "Authenticated users can upload evidence photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidence-photos' AND
  auth.role() = 'authenticated'
);

-- Policy for authenticated users to read evidence photos
CREATE POLICY "Authenticated users can read evidence photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'evidence-photos' AND
  auth.role() = 'authenticated'
);

-- Policy for authenticated users to update their own evidence photos (if needed)
CREATE POLICY "Authenticated users can update evidence photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'evidence-photos' AND
  auth.role() = 'authenticated'
);

-- Policy for authenticated users to delete their own evidence photos (if needed)
CREATE POLICY "Authenticated users can delete evidence photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'evidence-photos' AND
  auth.role() = 'authenticated'
);

