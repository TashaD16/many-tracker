-- Row Level Security Policies для Money Tracker
-- Выполните этот скрипт в Supabase SQL Editor

-- Включить RLS для всех таблиц
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transfer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Budget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CurrencyRate" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- User Table Policies
-- ============================================

-- Пользователи могут видеть только свой профиль
CREATE POLICY "Users can view own profile"
ON "User" FOR SELECT
USING (auth.uid() = id);

-- Пользователи могут обновлять только свой профиль
CREATE POLICY "Users can update own profile"
ON "User" FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- Account Table Policies
-- ============================================

-- Пользователи могут видеть только свои счета
CREATE POLICY "Users can view own accounts"
ON "Account" FOR SELECT
USING (auth.uid() = "userId");

-- Пользователи могут создавать только свои счета
CREATE POLICY "Users can insert own accounts"
ON "Account" FOR INSERT
WITH CHECK (auth.uid() = "userId");

-- Пользователи могут обновлять только свои счета
CREATE POLICY "Users can update own accounts"
ON "Account" FOR UPDATE
USING (auth.uid() = "userId");

-- Пользователи могут удалять только свои счета
CREATE POLICY "Users can delete own accounts"
ON "Account" FOR DELETE
USING (auth.uid() = "userId");

-- ============================================
-- Category Table Policies
-- ============================================

-- Пользователи могут видеть только свои категории
CREATE POLICY "Users can view own categories"
ON "Category" FOR SELECT
USING (auth.uid() = "userId");

-- Пользователи могут создавать только свои категории
CREATE POLICY "Users can insert own categories"
ON "Category" FOR INSERT
WITH CHECK (auth.uid() = "userId");

-- Пользователи могут обновлять только свои категории
CREATE POLICY "Users can update own categories"
ON "Category" FOR UPDATE
USING (auth.uid() = "userId");

-- Пользователи могут удалять только свои категории
CREATE POLICY "Users can delete own categories"
ON "Category" FOR DELETE
USING (auth.uid() = "userId");

-- ============================================
-- Transaction Table Policies
-- ============================================

-- Пользователи могут видеть только свои транзакции
CREATE POLICY "Users can view own transactions"
ON "Transaction" FOR SELECT
USING (auth.uid() = "userId");

-- Пользователи могут создавать только свои транзакции
CREATE POLICY "Users can insert own transactions"
ON "Transaction" FOR INSERT
WITH CHECK (auth.uid() = "userId");

-- Пользователи могут обновлять только свои транзакции
CREATE POLICY "Users can update own transactions"
ON "Transaction" FOR UPDATE
USING (auth.uid() = "userId");

-- Пользователи могут удалять только свои транзакции
CREATE POLICY "Users can delete own transactions"
ON "Transaction" FOR DELETE
USING (auth.uid() = "userId");

-- ============================================
-- Transfer Table Policies
-- ============================================

-- Пользователи могут видеть только свои переводы
CREATE POLICY "Users can view own transfers"
ON "Transfer" FOR SELECT
USING (auth.uid() = "fromUserId" OR auth.uid() = "toUserId");

-- Пользователи могут создавать только свои переводы
CREATE POLICY "Users can insert own transfers"
ON "Transfer" FOR INSERT
WITH CHECK (auth.uid() = "fromUserId" AND auth.uid() = "toUserId");

-- ============================================
-- Budget Table Policies
-- ============================================

-- Пользователи могут видеть только свои бюджеты
CREATE POLICY "Users can view own budgets"
ON "Budget" FOR SELECT
USING (auth.uid() = "userId");

-- Пользователи могут создавать только свои бюджеты
CREATE POLICY "Users can insert own budgets"
ON "Budget" FOR INSERT
WITH CHECK (auth.uid() = "userId");

-- Пользователи могут обновлять только свои бюджеты
CREATE POLICY "Users can update own budgets"
ON "Budget" FOR UPDATE
USING (auth.uid() = "userId");

-- Пользователи могут удалять только свои бюджеты
CREATE POLICY "Users can delete own budgets"
ON "Budget" FOR DELETE
USING (auth.uid() = "userId");

-- ============================================
-- CurrencyRate Table Policies
-- ============================================

-- Все пользователи могут читать курсы валют (публичные данные)
CREATE POLICY "Anyone can view currency rates"
ON "CurrencyRate" FOR SELECT
USING (true);

-- Только сервисные роли могут обновлять курсы (через backend)
-- Это должно быть настроено через service_role key на backend
