/*
  # Remove questions system and update chapters for file upload

  1. Changes
    - Drop questions table and related policies
    - Update chapters table to support file uploads instead of URLs
    - Remove video_url column and add video_file_path column
    - Update policies accordingly

  2. Security
    - Maintain existing RLS policies for chapters
    - Remove all question-related policies
*/

-- Drop questions table and related objects
DROP TABLE IF EXISTS questions CASCADE;

-- Update chapters table for file upload
ALTER TABLE chapters 
DROP COLUMN IF EXISTS video_url CASCADE;

ALTER TABLE chapters 
ADD COLUMN IF NOT EXISTS video_file_path text;

-- Update chapters table comment
COMMENT ON TABLE chapters IS 'Course chapters with uploaded video files';
COMMENT ON COLUMN chapters.video_file_path IS 'Path to uploaded video file in storage';