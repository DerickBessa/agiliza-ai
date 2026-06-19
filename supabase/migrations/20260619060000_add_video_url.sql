-- Add video_url column for video attachments on cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS video_url TEXT;
