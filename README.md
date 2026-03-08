# TutorMatch AI (Localhost + MongoDB)

This project is now set up to run locally with:

- React + Vite frontend (`http://localhost:8080`)
- Express + MongoDB backend (`http://localhost:5000`)

## 1) Install dependencies

```sh
npm install
```

## 2) Configure environment

Edit `.env`:

```env
VITE_API_BASE_URL="http://localhost:5000"
CLIENT_ORIGIN="http://localhost:8080"
MONGODB_URI="mongodb://127.0.0.1:27017/tutormatch"
PORT=5000
```

## 3) Start both frontend + backend

```sh
npm run dev:full
```

Or run separately:

```sh
npm run dev:server
npm run dev:client
```

## 4) Seed sample tutor data (first time only)

```sh
curl -X POST http://localhost:5000/api/seed
```

## Demo login (after seeding)

- Student: `student@example.com` / `password123`
- Tutor: `tutor1@example.com` / `password123`

## API endpoints

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/auth/user/:userId`
- `GET /api/tutors`
- `GET /api/tutors/:userId`
- `GET /api/db/:table`
- `POST /api/db/:table`
- `PATCH /api/db/:table`
- `POST /api/seed`

## Notes

- No Lovable dependency remains in runtime/build config.
- No external Supabase SDK is used anymore.
- Tutor, auth, sessions, chat, notifications, reviews, tutor setup, and admin reads/writes are all persisted in MongoDB.

## Deploy (Render + Vercel)

### Backend on Render

1. Push this repo to GitHub.
2. In Render, create a new `Web Service` from the repo.
3. Render will detect [`render.yaml`](c:\Users\bhuva\Downloads\tutormatch-ai-main (1)\tutormatch-ai-main\render.yaml).
4. Set env vars in Render:
   - `MONGODB_URI=<your MongoDB Atlas URI>`
   - `CLIENT_ORIGIN=https://<your-vercel-domain>`
5. Deploy and copy backend URL, for example: `https://tutormatch-api.onrender.com`

### Frontend on Vercel

1. Import the same repo in Vercel.
2. Framework preset: `Vite`.
3. Build command: `npm run build` and output dir: `dist`.
4. Set env var:
   - `VITE_API_BASE_URL=https://<your-render-backend-domain>`
5. Deploy.

### Production seed

Run once after backend deploy:

```sh
curl -X POST https://<your-render-backend-domain>/api/seed
```
