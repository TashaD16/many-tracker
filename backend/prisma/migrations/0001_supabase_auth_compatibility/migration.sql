-- Migration для совместимости с Supabase Auth
-- Выполните в Supabase SQL Editor или через Prisma migrate

-- Изменить тип ID на UUID для совместимости с auth.users
-- ВАЖНО: Это миграция для существующей базы. Для новой базы используйте Prisma schema с UUID

-- Связь User с auth.users
ALTER TABLE "User" 
ADD CONSTRAINT "User_id_fkey" 
FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;

-- Включить RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Политика для User
CREATE POLICY "Users can view own profile"
ON "User" FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON "User" FOR UPDATE
USING (auth.uid() = id);
