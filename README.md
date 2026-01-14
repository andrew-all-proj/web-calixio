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
LiveKit WS по умолчанию: `wss://localhost:8443`.

## HTTPS для мобильных устройств

Браузеры на телефоне требуют HTTPS для `getUserMedia`. Сертификат можно
сгенерировать под IP машины в LAN:

```bash
./scripts/gen-cert.sh 192.168.1.10
```

Далее запусти dev-сервер:

```bash
npm run dev
```

Открой в браузере телефона: `https://192.168.1.10:8443`.
Для LiveKit на телефоне укажи `wss://192.168.1.10:8443` (TLS через Caddy).

## Что можно проверить
- Получение JWT
- Создание комнаты
- Получение LiveKit токена
- Завершение комнаты
