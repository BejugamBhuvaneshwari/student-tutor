# TutorMatch AI (Localhost + MongoDB)

This project is now set up to run locally with:

- React + Vite frontend (`http://localhost:8080`)
- Express + MongoDB backend (`http://localhost:5000`)

## 1) Install dependencies


npm install


## 2) Configure environment

Edit `.env`:


VITE_API_BASE_URL="http://localhost:5000"
CLIENT_ORIGIN="http://localhost:8080"
MONGODB_URI="mongodb://127.0.0.1:27017/tutormatch"
PORT=5000


## 3) Start both frontend + backend


npm run dev:full


Or run separately:


npm run dev:server
npm run dev:client


## 4) Seed sample tutor data (first time only)


curl -X POST http://localhost:5000/api/seed

## 5) Project Demo
[▶️ Click Here to Watch RetinaGuard Demo]  https://drive.google.com/file/d/1Xx2g5WtaBNR81uMunrgSeQN51gcoDTa8/view?usp=drivesdk

## Demo login (after seeding)

- Student: `student@example.com` / `password123`
- Tutor: `tutor1@example.com` / `password123`

## API endpoints


- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/auth/user/:userId`
- `GET /api/tutors`
- `GET /api/tutors/:userId`
- `GET /api/db/:table`
- `POST /api/db/:table`
- `PATCH /api/db/:table`
- `POST /api/seed`

