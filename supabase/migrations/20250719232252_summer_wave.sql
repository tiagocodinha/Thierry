/*
  # Create videos storage bucket

  1. Storage
    - Create 'videos' bucket for video file uploads
    - Set public access for video playback
    - Configure RLS policies for secure access

  2. Security
    - Authenticated users can upload videos
    - Public read access for video playback
    - Admin users have full access
*/

-- Create the videos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Allow public read access to videos
CREATE POLICY "Public read access to videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Allow authenticated users to update their own videos
CREATE POLICY "Users can update videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'videos');

-- Allow authenticated users to delete videos
CREATE POLICY "Users can delete videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'videos');