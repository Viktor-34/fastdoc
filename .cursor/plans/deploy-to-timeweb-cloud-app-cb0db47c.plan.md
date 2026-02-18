<!-- cb0db47c-8bdf-4c86-9d8f-df58cf83d7fd 8e1814d8-0ba1-4cbf-bad2-6ebc1bbbf3ef -->
# План деплоя на Timeweb Cloud App

## 1. Подготовка конфигурации

- [ ] **(Рекомендуется вручную)** Добавить `output: "standalone"` в `next.config.ts` для оптимизации Docker-образа.
- [ ] Создать файл `Dockerfile` в корне проекта (содержимое предоставлено в чате).
- [ ] Создать файл `.dockerignore` (можно скопировать из .gitignore и добавить туда `Dockerfile`, `README.md`).

## 2. База данных (Timeweb Cloud)

- [ ] Создать базу данных PostgreSQL в панели Timeweb.
- [ ] Сохранить данные для подключения (Host, Port, User, Password, Database Name).
- [ ] Сформировать `DATABASE_URL`.

## 3. Создание приложения (Apps)

- [ ] Подключить репозиторий GitHub.
- [ ] Выбрать тип **Docker**.
- [ ] Указать регион (тот же, где база данных).
- [ ] **Настроить переменные окружения (Environment Variables):**
    - `DATABASE_URL`: `postgresql://...`
    - `NEXTAUTH_SECRET`: `...` (сгенерировать командой `openssl rand -base64 32`)
    - `NEXTAUTH_URL`: `https://<твое-приложение>.timeweb.cloud` (или localhost для первого запуска)
- [ ] **Настроить Volume (Важно!):**
    - Создать Persistent Volume.
    - Путь монтирования (Mount Path): `/app/public/uploads`
    - Это сохранит загруженные файлы между деплоями.

## 4. Первый запуск и миграции

- [ ] Дождаться сборки и деплоя (Status: Running).
- [ ] Открыть **Консоль** приложения в Timeweb.
- [ ] Выполнить миграцию базы данных:
    ```bash
    npx prisma migrate deploy
    ```

- [ ] Проверить работу приложения (логин, загрузка файлов, генерация PDF).