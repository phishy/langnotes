-- Create words table
CREATE TABLE IF NOT EXISTS words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  translation text,
  type text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- Create policy for words
CREATE POLICY "Users can manage their own words"
  ON words
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create unique constraint for user_id and word combination
CREATE UNIQUE INDEX words_user_id_word_idx ON words (user_id, word);
