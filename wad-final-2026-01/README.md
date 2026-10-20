# How to Test the App

## Student Information

- **Student Name:**
- **Student ID:**

## Test Credentials

- **Password for every account:** `Pass123!`

| Role | Username | Email |
| --- | --- | --- |
| Teacher | Ada Teacher | ada.teacher@example.com |
| Teacher | Ben Teacher | ben.teacher@example.com |
| Teacher | Chloe Teacher | chloe.teacher@example.com |
| Student | Sam Student | sam.student@example.com |
| Student | Mia Student | mia.student@example.com |
| Student | Noah Student | noah.student@example.com |

## Prerequisites

- Node.js 20 or later
- MongoDB running locally or an accessible MongoDB Atlas connection string

## How to Run & Test

### 1. Backend Setup (`next-backend/`)

1. Create `next-backend/.env.local`:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017
   MONGODB_DB=course_management
   JWT_SECRET=replace-with-a-long-random-secret
   ```
2. Run `npm install` then `npm run dev`. The API runs at `http://localhost:3000`.

### 2. Frontend Setup (`react-frontend/`)

1. Create `react-frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
2. Run `npm install` then `npm run dev`. Open the printed Vite address (normally `http://localhost:5173`).

### 3. Testing Walkthrough

1. Sign in as Ada Teacher. Create a course, edit its status/details, and verify that delete is disabled once a student enrolls.
2. Sign out and sign in as Sam Student. Search by course or teacher, enroll in an open course, and check **My enrollments**.
3. Try enrolling twice, enrolling in a closed/full course, or requesting protected endpoints without signing in; the app rejects each action.
4. Use the other seeded teacher/student accounts to test access isolation. Teachers only receive their own courses; students never receive cancelled courses.

## Deploy to Vercel

Deploy this repository as **two Vercel projects**. Do not deploy the repository root: choose the listed root directory for each project.

### 1. Deploy the API

1. Import the GitHub repository in Vercel and set the **Root Directory** to `wad-final-2026-01/next-backend`.
2. Add these environment variables for both **Production** and **Preview**:
   - `MONGODB_URI` — your MongoDB Atlas URI (**Secret**)
   - `MONGODB_DB` — for example, `course_management`
   - `JWT_SECRET` — a long random value (**Secret**)
   - `FRONTEND_URL` — the exact deployed frontend URL, such as `https://course-hub.vercel.app`
3. Deploy and copy the API URL. Its API base will be `https://your-api.vercel.app/api`.

### 2. Deploy the React frontend

1. Create another Vercel project from the same repository with **Root Directory** `wad-final-2026-01/react-frontend`.
2. Add `VITE_API_URL` for Production and Preview, set to the API base URL from step 1 (for example, `https://your-api.vercel.app/api`). This is public browser configuration, not a secret.
3. Deploy the frontend.
4. Update the API project's `FRONTEND_URL` to the frontend’s actual Vercel URL, then redeploy the API.

Vercel’s filesystem is ephemeral, so the local JSON fallback is deliberately disabled there. Configure MongoDB for every Vercel environment. Use a stable frontend domain for production; preview URLs require their own matching `FRONTEND_URL` configuration.
