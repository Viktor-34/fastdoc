-- Упрощение ролей: OWNER, ADMIN, EDITOR, VIEWER → OWNER, USER
-- PostgreSQL не позволяет использовать новое enum-значение в той же транзакции,
-- поэтому пересоздаём enum через текстовый столбец.

-- 1. Переводим столбец role в text
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT;

-- 2. Конвертируем старые роли в новые
UPDATE "User" SET "role" = 'USER' WHERE "role" IN ('ADMIN', 'EDITOR', 'VIEWER');

-- 3. Удаляем старый enum и создаём новый
DROP TYPE "Role";
CREATE TYPE "Role" AS ENUM ('OWNER', 'USER');

-- 4. Возвращаем столбец к enum-типу
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
