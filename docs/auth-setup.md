# Auth.js & SMTP Setup

Следуйте шагам, чтобы включить авторизацию через magic-link и OAuth.

## 1. Prisma миграция

```bash
npx prisma migrate dev --name add_auth
npx prisma generate
```

> Миграция `20251019105350_add_auth` уже в репозитории. Команда создаст таблицы Auth.js и обновит Prisma Client.

## 2. Переменные окружения

Заполните `.env` (или переменные в CI/hosting):

```
DATABASE_URL="postgresql://user:password@host:5432/offerdoc"
NEXTAUTH_SECRET="случайная_строка"
NEXTAUTH_URL="http://localhost:3000"          # для прод — публичный домен

# SMTP (пример для Mailtrap)
EMAIL_FROM="Offerdoc <no-reply@offerdoc.app>"
EMAIL_SERVER_HOST="sandbox.smtp.mailtrap.io"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="..."
EMAIL_SERVER_PASSWORD="..."
```

Без SMTP переменных включится “песочница”: письма не отправляются, но ссылки выводятся в консоль сервера.

### OAuth (опционально)

Добавьте пары ключ/секрет, чтобы отобразить соответствующие кнопки:

```
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
YANDEX_CLIENT_ID="..."
YANDEX_CLIENT_SECRET="..."
VK_CLIENT_ID="..."
VK_CLIENT_SECRET="..."
```

## 3. Локальная проверка

1. `npm run dev`
2. Откройте `/auth/signin`
3. Введите email → проверьте письмо (или лог в терминале). Перейдите по ссылке, должно перенаправить в дашборд.
4. Если получать `401` на API, убедитесь, что установлена кука `workspaceId` и сессия создана (в dev можно очистить `next-auth.session-token` и повторить).

Страницы:
- `/auth/signin` — форма magic-link + кнопки OAuth
- `/auth/verify-request` — инструктаж после отправки письма
- `/auth/error` — обработка ошибок

## 4. Дополнительная проверка

- После входа откройте `/settings/profile`.
  - Измените имя, убедитесь, что toast «Имя обновлено» и новое имя отображается в боковом меню после обновления страницы.
  - Если вошли владельцем/админом, обновите название рабочей области; участники без прав увидят подсказку о недоступности.

## 5. Примечания

- При первом входе создаётся персональный workspace, пользователь становится `OWNER`.
- Все защищённые API используют workspace из сессии. Если вы вручную отправляете запросы, добавьте заголовок `x-workspace-id`.
