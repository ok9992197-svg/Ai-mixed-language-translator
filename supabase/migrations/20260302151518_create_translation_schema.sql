/*
  # Create Bilingual Subtitle Translation Schema

  1. New Tables
    - `language_pairs` - Supported hybrid language pairs (e.g., English→Hinglish)
    - `translation_projects` - User translation projects
    - `subtitle_batches` - Uploaded subtitle files
    - `translated_subtitles` - Individual translated subtitle lines
    - `user_preferences` - User language and style preferences

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own projects
    - Public read access for language pair definitions

  3. Important Notes
    - Supports SRT/VTT format parsing and storage
    - Stores timestamps and formatting tags
    - Tracks original and translated content for quality assurance
*/

CREATE TABLE IF NOT EXISTS language_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_language text NOT NULL,
  base_language text NOT NULL,
  secondary_language text NOT NULL,
  display_name text NOT NULL,
  description text,
  code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS translation_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_pair_id uuid NOT NULL REFERENCES language_pairs(id),
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subtitle_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES translation_projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_format text NOT NULL,
  original_content text NOT NULL,
  total_lines integer DEFAULT 0,
  translated_lines integer DEFAULT 0,
  status text DEFAULT 'pending',
  uploaded_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS translated_subtitles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES subtitle_batches(id) ON DELETE CASCADE,
  sequence_number integer NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  original_text text NOT NULL,
  translated_text text,
  tags text,
  is_translated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(batch_id, sequence_number)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language_pair_id uuid REFERENCES language_pairs(id),
  tone_style text DEFAULT 'natural',
  context_awareness boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE language_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtitle_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE translated_subtitles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Language pairs are publicly readable"
  ON language_pairs FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Users can view own projects"
  ON translation_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects"
  ON translation_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON translation_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON translation_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view batches in own projects"
  ON subtitle_batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM translation_projects
      WHERE translation_projects.id = subtitle_batches.project_id
      AND translation_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create batches in own projects"
  ON subtitle_batches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM translation_projects
      WHERE translation_projects.id = subtitle_batches.project_id
      AND translation_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update batches in own projects"
  ON subtitle_batches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM translation_projects
      WHERE translation_projects.id = subtitle_batches.project_id
      AND translation_projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM translation_projects
      WHERE translation_projects.id = subtitle_batches.project_id
      AND translation_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view subtitles in own batches"
  ON translated_subtitles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subtitle_batches
      JOIN translation_projects ON translation_projects.id = subtitle_batches.project_id
      WHERE subtitle_batches.id = translated_subtitles.batch_id
      AND translation_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create subtitles in own batches"
  ON translated_subtitles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subtitle_batches
      JOIN translation_projects ON translation_projects.id = subtitle_batches.project_id
      WHERE subtitle_batches.id = translated_subtitles.batch_id
      AND translation_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subtitles in own batches"
  ON translated_subtitles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subtitle_batches
      JOIN translation_projects ON translation_projects.id = subtitle_batches.project_id
      WHERE subtitle_batches.id = translated_subtitles.batch_id
      AND translation_projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subtitle_batches
      JOIN translation_projects ON translation_projects.id = subtitle_batches.project_id
      WHERE subtitle_batches.id = translated_subtitles.batch_id
      AND translation_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

INSERT INTO language_pairs (source_language, base_language, secondary_language, display_name, description, code)
VALUES
  ('English', 'Hindi', 'English', 'Hinglish', 'English to Hindi with English vocabulary blend', 'en-hi'),
  ('English', 'Spanish', 'English', 'Spanglish', 'English to Spanish with English vocabulary blend', 'en-es'),
  ('English', 'Tagalog', 'English', 'Taglish', 'English to Tagalog with English vocabulary blend', 'en-tl'),
  ('English', 'Japanese', 'English', 'Janglish', 'English to Japanese with English vocabulary blend', 'en-ja'),
  ('English', 'Korean', 'English', 'Konglish', 'English to Korean with English vocabulary blend', 'en-ko')
ON CONFLICT (code) DO NOTHING;