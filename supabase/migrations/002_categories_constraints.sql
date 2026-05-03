-- ============================================================
-- StudyHub - Eje 2: Constraints sobre la tabla categories
-- Ejecutar en el SQL Editor de Supabase después de 001_initial.sql
-- ============================================================

-- Unicidad: un usuario no puede tener dos categorías con el mismo nombre
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_user_name_unique'
  ) THEN
    ALTER TABLE categories
      ADD CONSTRAINT categories_user_name_unique UNIQUE (user_id, name);
  END IF;
END $$;

-- Integridad: el nombre no puede estar vacío ni tener solo espacios
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_not_empty'
  ) THEN
    ALTER TABLE categories
      ADD CONSTRAINT categories_name_not_empty CHECK (length(trim(name)) >= 2);
  END IF;
END $$;

-- Integridad: el color debe ser un hex válido (#RRGGBB)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_color_hex'
  ) THEN
    ALTER TABLE categories
      ADD CONSTRAINT categories_color_hex CHECK (color ~ '^#[0-9a-fA-F]{6}$');
  END IF;
END $$;

-- Política RLS revisada (reemplaza la política "all-in-one" existente por
-- políticas granulares para mayor claridad académica)
DROP POLICY IF EXISTS "categories_all_own" ON categories;

CREATE POLICY "categories_select_own" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "categories_insert_own" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_update_own" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "categories_delete_own" ON categories
  FOR DELETE USING (auth.uid() = user_id);
