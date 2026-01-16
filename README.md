# Calixio Front (React)

Минимальный React UI для локального тестирования backend.

## Запуск

```bash
cd front
cp .env.example .env
npm install
npm run dev
```

По умолчанию UI обращается к backend через прокси `/api`.
LiveKit WS по умолчанию: `ws://localhost:7882` (для `docker-compose.dev.yml`).
Если используешь `docker-compose.yml`, укажи `ws://localhost:7880`.

## Что можно проверить
- Получение JWT
- Создание комнаты
- Получение LiveKit токена
- Завершение комнаты
