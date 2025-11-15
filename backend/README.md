# Little Bee Backend (Express)

Express.js API for the Little Bee monorepo. Designed to be easy to test with Postman.

## Endpoints

- GET `/health` – health check
- POST `/auth/register` – body: `{ email, password, name? }`
- POST `/auth/login` – body: `{ email, password }` -> returns `{ token, user }`
- GET `/devices` – protected, header: `Authorization: Bearer <token>`
- POST `/monitoring` – protected, body: `{ deviceId, metrics?, status?, timestamp? }`

## Quick start

1. Copy env and install dependencies

```powershell
Copy-Item .env.example .env
npm install
```

2. Run in dev mode (with auto-reload)

```powershell
npm run dev
```

API will listen on `http://localhost:4000` by default.

## Environment variables

See `.env.example` for defaults.

- `PORT` (default `4000`)
- `JWT_SECRET` (required; change in production)
- `CORS_ORIGIN` (default `*`)
- `LOG_LEVEL` (default `dev`)

## Postman

Import the collection in `postman/LittleBee.postman_collection.json` and environment `postman/LittleBee.postman_environment.json`.

## Database assets

- SQL migrations are stored under `backend/database/migrations/`. These were moved from the root `supabase/` directory to keep all backend database assets together.
- If you continue to use Supabase, run these migrations using Supabase SQL or the CLI in your Supabase project.

Workflow:
- Register a user -> Login -> copy token into environment variable `token` -> call protected endpoints.

## Notes

- This uses an in-memory store for users/devices/monitoring. It resets on server restart.
- Swap `data/store.js` with a real database when ready.
