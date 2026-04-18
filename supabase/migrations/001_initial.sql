-- ============================================================
-- StudyHub - Migración inicial
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABLA: profiles
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger: crear perfil al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ────────────────────────────────────────────────────────────
-- TABLA: categories
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text NOT NULL DEFAULT '#67b31f',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_all_own" ON categories
  FOR ALL USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- TABLA: folders
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folders_all_own" ON folders
  FOR ALL USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- TABLA: notes
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id    uuid REFERENCES folders(id) ON DELETE SET NULL,
  title        text NOT NULL DEFAULT 'Sin título',
  content      jsonb NOT NULL DEFAULT '{}',
  content_text text NOT NULL DEFAULT '',
  tags         text[] NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_all_own" ON notes
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notes_search_idx
  ON notes USING gin(to_tsvector('spanish', title || ' ' || content_text));

CREATE INDEX IF NOT EXISTS notes_user_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_folder_idx ON notes(folder_id);

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- TABLA: tasks
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE task_quadrant AS ENUM (
    'urgent_important',
    'not_urgent_important',
    'urgent_not_important',
    'not_urgent_not_important'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  quadrant     task_quadrant NOT NULL DEFAULT 'not_urgent_important',
  deadline     timestamptz,
  category_id  uuid REFERENCES categories(id) ON DELETE SET NULL,
  completed    boolean NOT NULL DEFAULT false,
  position     integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_all_own" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tasks_user_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_quadrant_idx ON tasks(user_id, quadrant);


-- ────────────────────────────────────────────────────────────
-- TABLA: subtasks
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subtasks (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id   uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title     text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  position  integer NOT NULL DEFAULT 0
);

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subtasks_all_own" ON subtasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
        AND tasks.user_id = auth.uid()
    )
  );


-- ────────────────────────────────────────────────────────────
-- TABLA: study_sessions
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE study_mode AS ENUM ('simple', 'pomodoro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS study_sessions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id              uuid REFERENCES categories(id) ON DELETE SET NULL,
  duration_minutes         integer NOT NULL CHECK (duration_minutes BETWEEN 1 AND 120),
  actual_duration_seconds  integer NOT NULL DEFAULT 0,
  mode                     study_mode NOT NULL DEFAULT 'simple',
  pomodoro_cycles_completed integer NOT NULL DEFAULT 0,
  started_at               timestamptz NOT NULL DEFAULT now(),
  completed_at             timestamptz,
  notes                    text
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_all_own" ON study_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_date_idx ON study_sessions(user_id, started_at);


-- ────────────────────────────────────────────────────────────
-- STORAGE: bucket para imágenes de notas
-- ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes-images', 'notes-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "notes_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'notes-images');

CREATE POLICY "notes_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'notes-images' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "notes_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'notes-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );
