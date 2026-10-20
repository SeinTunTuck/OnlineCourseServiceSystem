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
