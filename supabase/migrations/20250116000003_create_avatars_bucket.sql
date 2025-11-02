/*
# [Create Avatars Storage Bucket]
This migration creates the avatars bucket in Supabase Storage for user profile photos.

## Metadata:
- Schema-Category: "Storage"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the bucket and policies)

## Structure Details:
- Bucket: avatars (public bucket for storing user profile photos)
- Policies: INSERT, SELECT, UPDATE, DELETE policies for authenticated users (own avatars only)

## Security Implications:
- Bucket is public for easier avatar access
- Only authenticated users can upload their own avatars
- Only authenticated users can read avatars
*/

-- Insert bucket into storage.buckets if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket for easier avatar access
  2097152, -- 2MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'] -- Allowed image types
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Policy for users to upload their own avatar
-- Avatares são salvos com o caminho: avatars/{user_id}_{timestamp}.{ext}
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] = (auth.uid()::text || '_')
);

-- Policy for users to read avatars (public read)
CREATE POLICY "Users can read avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Policy for users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] = (auth.uid()::text || '_')
);

-- Policy for users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] = (auth.uid()::text || '_')
);

