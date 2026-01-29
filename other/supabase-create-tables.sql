-- SQL скрипт для создания всех таблиц в Supabase
-- Выполните этот скрипт в Supabase SQL Editor

-- ============================================
-- 1. Таблица User
-- ============================================
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL DEFAULT '',
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Связь с auth.users
ALTER TABLE "User" 
ADD CONSTRAINT "User_id_fkey" 
FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;

-- ============================================
-- 2. Таблица Account
-- ============================================
CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "initialBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'BYN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");

-- ============================================
-- 3. Таблица Category
-- ============================================
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "icon" TEXT,
  "color" TEXT DEFAULT '#2196F3',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Category_userId_idx" ON "Category"("userId");

-- ============================================
-- 4. Таблица Transaction
-- ============================================
CREATE TABLE IF NOT EXISTS "Transaction" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" UUID NOT NULL,
  "accountId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "type" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "description" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE,
  CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_date_idx" ON "Transaction"("date");
CREATE INDEX IF NOT EXISTS "Transaction_type_idx" ON "Transaction"("type");
CREATE INDEX IF NOT EXISTS "Transaction_categoryId_idx" ON "Transaction"("categoryId");

-- ============================================
-- 5. Таблица Transfer
-- ============================================
CREATE TABLE IF NOT EXISTS "Transfer" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "fromUserId" UUID NOT NULL,
  "toUserId" UUID NOT NULL,
  "fromAccountId" TEXT NOT NULL,
  "toAccountId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "exchangeRate" DOUBLE PRECISION,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Transfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Transfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Transfer_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "Account"("id") ON DELETE CASCADE,
  CONSTRAINT "Transfer_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "Account"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Transfer_fromUserId_idx" ON "Transfer"("fromUserId");
CREATE INDEX IF NOT EXISTS "Transfer_date_idx" ON "Transfer"("date");

-- ============================================
-- 6. Таблица Budget
-- ============================================
CREATE TABLE IF NOT EXISTS "Budget" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" UUID NOT NULL,
  "categoryId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "limit" DOUBLE PRECISION NOT NULL,
  "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Budget_userId_idx" ON "Budget"("userId");
CREATE INDEX IF NOT EXISTS "Budget_categoryId_idx" ON "Budget"("categoryId");

-- ============================================
-- 7. Таблица CurrencyRate
-- ============================================
CREATE TABLE IF NOT EXISTS "CurrencyRate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "fromCurrency" TEXT NOT NULL,
  "toCurrency" TEXT NOT NULL,
  "rate" DOUBLE PRECISION NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'myfin.by',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CurrencyRate_fromCurrency_toCurrency_source_key" UNIQUE ("fromCurrency", "toCurrency", "source")
);

CREATE INDEX IF NOT EXISTS "CurrencyRate_fromCurrency_toCurrency_idx" ON "CurrencyRate"("fromCurrency", "toCurrency");

-- ============================================
-- Включить Row Level Security
-- ============================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transfer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Budget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CurrencyRate" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Политики для User
-- ============================================
CREATE POLICY "Users can view own profile"
ON "User" FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON "User" FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- RLS Политики для Account
-- ============================================
CREATE POLICY "Users can view own accounts"
ON "Account" FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own accounts"
ON "Account" FOR INSERT
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own accounts"
ON "Account" FOR UPDATE
USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own accounts"
ON "Account" FOR DELETE
USING (auth.uid() = "userId");

-- ============================================
-- RLS Политики для Category
-- ============================================
CREATE POLICY "Users can view own categories"
ON "Category" FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own categories"
ON "Category" FOR INSERT
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own categories"
ON "Category" FOR UPDATE
USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own categories"
ON "Category" FOR DELETE
USING (auth.uid() = "userId");

-- ============================================
-- RLS Политики для Transaction
-- ============================================
CREATE POLICY "Users can view own transactions"
ON "Transaction" FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own transactions"
ON "Transaction" FOR INSERT
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own transactions"
ON "Transaction" FOR UPDATE
USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own transactions"
ON "Transaction" FOR DELETE
USING (auth.uid() = "userId");

-- ============================================
-- RLS Политики для Transfer
-- ============================================
CREATE POLICY "Users can view own transfers"
ON "Transfer" FOR SELECT
USING (auth.uid() = "fromUserId" OR auth.uid() = "toUserId");

CREATE POLICY "Users can insert own transfers"
ON "Transfer" FOR INSERT
WITH CHECK (auth.uid() = "fromUserId" AND auth.uid() = "toUserId");

-- ============================================
-- RLS Политики для Budget
-- ============================================
CREATE POLICY "Users can view own budgets"
ON "Budget" FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own budgets"
ON "Budget" FOR INSERT
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own budgets"
ON "Budget" FOR UPDATE
USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own budgets"
ON "Budget" FOR DELETE
USING (auth.uid() = "userId");

-- ============================================
-- RLS Политики для CurrencyRate (публичные данные)
-- ============================================
CREATE POLICY "Anyone can view currency rates"
ON "CurrencyRate" FOR SELECT
USING (true);

-- ============================================
-- Функция для автоматического создания профиля
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, password)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    '' -- Password handled by Supabase Auth
  )
  ON CONFLICT (id) DO UPDATE
  SET email = NEW.email,
      "updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания профиля при регистрации
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Функция для обновления updatedAt
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updatedAt
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_updated_at BEFORE UPDATE ON "Account"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_updated_at BEFORE UPDATE ON "Category"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_updated_at BEFORE UPDATE ON "Transaction"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_updated_at BEFORE UPDATE ON "Transfer"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_updated_at BEFORE UPDATE ON "Budget"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_currencyrate_updated_at BEFORE UPDATE ON "CurrencyRate"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Готово! ✅
-- ============================================
-- Все таблицы созданы, индексы добавлены, RLS политики настроены
-- Триггеры для автоматического создания профиля и обновления updatedAt установлены
