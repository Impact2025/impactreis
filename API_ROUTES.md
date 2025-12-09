# API Routes Documentation

## Overview
All API routes are production-ready for Vercel deployment and include:
- JWT authentication (Bearer token in Authorization header)
- Proper error handling with HTTP status codes
- Neon serverless PostgreSQL database connection
- Input validation with Zod schemas

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.vercel.app/api`

---

## Authentication Routes

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- 400: Email already registered
- 500: Internal server error

---

### POST /api/auth/login
Login to existing account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- 401: Invalid credentials
- 500: Internal server error

---

## Goals Routes

### GET /api/goals
Get all goals for authenticated user.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `type` (optional): Filter by goal type
- `period` (optional): Filter by period

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "type": "yearly",
    "title": "Increase revenue by 50%",
    "period": "2024",
    "completed": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Errors:**
- 401: Unauthorized
- 500: Internal server error

---

### POST /api/goals
Create a new goal.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "type": "yearly",
  "title": "Increase revenue by 50%",
  "period": "2024",
  "completed": false
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "type": "yearly",
  "title": "Increase revenue by 50%",
  "period": "2024",
  "completed": false,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- 401: Unauthorized
- 500: Internal server error

---

### PUT /api/goals/[id]
Update a specific goal.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Increase revenue by 60%",
  "completed": true
}
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "type": "yearly",
  "title": "Increase revenue by 60%",
  "period": "2024",
  "completed": true,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- 401: Unauthorized
- 404: Goal not found
- 500: Internal server error

---

### DELETE /api/goals/[id]
Delete a specific goal.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "id": 1
}
```

**Errors:**
- 401: Unauthorized
- 404: Goal not found
- 500: Internal server error

---

## Habits Routes

### GET /api/habits
Get all habits for authenticated user.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Morning exercise",
    "streak": 7,
    "last_completed": "2024-01-07",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Errors:**
- 401: Unauthorized
- 500: Internal server error

---

### POST /api/habits
Create a new habit.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Morning exercise",
  "streak": 0
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Morning exercise",
  "streak": 0,
  "last_completed": null,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- 400: Name is required
- 401: Unauthorized
- 500: Internal server error

---

### PUT /api/habits/[id]
Update a specific habit.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "streak": 8,
  "lastCompleted": "2024-01-08"
}
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Morning exercise",
  "streak": 8,
  "last_completed": "2024-01-08",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- 400: Streak field is required
- 401: Unauthorized
- 404: Habit not found
- 500: Internal server error

---

### DELETE /api/habits/[id]
Delete a specific habit.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- 401: Unauthorized
- 404: Habit not found
- 500: Internal server error

---

## Daily Logs Routes

### GET /api/logs
Get all daily logs for authenticated user (limited to 50 most recent).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "type": "morning",
    "date_string": "2024-01-01",
    "data": {
      "gratitude": ["Family", "Health"],
      "priorities": ["Work on project", "Exercise"]
    },
    "timestamp": "2024-01-01T08:00:00.000Z"
  }
]
```

**Errors:**
- 401: Unauthorized
- 500: Internal server error

---

### POST /api/logs
Create a new daily log entry.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "type": "morning",
  "dateString": "2024-01-01",
  "gratitude": ["Family", "Health"],
  "priorities": ["Work on project", "Exercise"]
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "type": "morning",
  "date_string": "2024-01-01",
  "data": {
    "gratitude": ["Family", "Health"],
    "priorities": ["Work on project", "Exercise"]
  },
  "timestamp": "2024-01-01T08:00:00.000Z"
}
```

**Errors:**
- 400: Type and dateString are required
- 401: Unauthorized
- 500: Internal server error

---

## Focus Sessions Routes

### GET /api/focus
Get all focus sessions for authenticated user.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `date` (optional): Filter by specific date (YYYY-MM-DD)

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "date": "2024-01-01",
    "start_time": "09:00",
    "goal": "Complete project proposal",
    "completed": true
  }
]
```

**Errors:**
- 401: Unauthorized
- 500: Internal server error

---

### POST /api/focus
Create a new focus session.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "date": "2024-01-01",
  "startTime": "09:00",
  "goal": "Complete project proposal"
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "date": "2024-01-01",
  "start_time": "09:00",
  "goal": "Complete project proposal",
  "completed": false
}
```

**Errors:**
- 400: Date and startTime are required
- 401: Unauthorized
- 500: Internal server error

---

### PUT /api/focus/[id]
Update a specific focus session.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "completed": true
}
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "date": "2024-01-01",
  "start_time": "09:00",
  "goal": "Complete project proposal",
  "completed": true
}
```

**Errors:**
- 400: Completed field is required
- 401: Unauthorized
- 404: Focus session not found
- 500: Internal server error

---

### DELETE /api/focus/[id]
Delete a specific focus session.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- 401: Unauthorized
- 404: Focus session not found
- 500: Internal server error

---

## Weekly Goals Routes

### GET /api/weekly-goals
Get weekly goals for authenticated user.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `weekNumber` (optional): Filter by specific week number

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "week_number": "2024-W01",
    "goals": [
      "Complete client presentation",
      "Launch marketing campaign"
    ],
    "status": "in_progress",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Errors:**
- 401: Unauthorized
- 500: Internal server error

---

### POST /api/weekly-goals
Create new weekly goals.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "weekNumber": "2024-W01",
  "goals": [
    "Complete client presentation",
    "Launch marketing campaign"
  ]
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "week_number": "2024-W01",
  "goals": [
    "Complete client presentation",
    "Launch marketing campaign"
  ],
  "status": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- 400: Week number and goals are required
- 401: Unauthorized
- 500: Internal server error

---

### PUT /api/weekly-goals/[id]
Update specific weekly goals.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "goals": [
    "Complete client presentation",
    "Launch marketing campaign",
    "Review Q1 metrics"
  ],
  "status": "completed"
}
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "week_number": "2024-W01",
  "goals": [
    "Complete client presentation",
    "Launch marketing campaign",
    "Review Q1 metrics"
  ],
  "status": "completed",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-08T00:00:00.000Z"
}
```

**Errors:**
- 400: Goals field is required
- 401: Unauthorized
- 404: Weekly goal not found
- 500: Internal server error

---

### DELETE /api/weekly-goals/[id]
Delete specific weekly goals.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- 401: Unauthorized
- 404: Weekly goal not found
- 500: Internal server error

---

## Weekly Reviews Routes

### GET /api/weekly-reviews
Get all weekly reviews for authenticated user.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `weekNumber` (optional): Filter by specific week number

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "week_number": "2024-W01",
    "data": {
      "wins": ["Completed project", "New client"],
      "challenges": ["Time management"],
      "learnings": ["Better planning needed"],
      "nextWeekFocus": ["Improve scheduling"]
    },
    "timestamp": "2024-01-07T00:00:00.000Z"
  }
]
```

**Errors:**
- 401: Unauthorized
- 500: Internal server error

---

### POST /api/weekly-reviews
Create a new weekly review.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "weekNumber": "2024-W01",
  "wins": ["Completed project", "New client"],
  "challenges": ["Time management"],
  "learnings": ["Better planning needed"],
  "nextWeekFocus": ["Improve scheduling"]
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "week_number": "2024-W01",
  "data": {
    "wins": ["Completed project", "New client"],
    "challenges": ["Time management"],
    "learnings": ["Better planning needed"],
    "nextWeekFocus": ["Improve scheduling"]
  },
  "timestamp": "2024-01-07T00:00:00.000Z"
}
```

**Errors:**
- 400: Week number is required
- 401: Unauthorized
- 500: Internal server error

---

## Environment Variables

Required environment variables in `.env`:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

---

## Authentication Flow

1. **Register or Login**: Call `/api/auth/register` or `/api/auth/login`
2. **Store Token**: Save the returned JWT token in localStorage or secure cookie
3. **Make Authenticated Requests**: Include token in Authorization header:
   ```
   Authorization: Bearer {token}
   ```
4. **Handle Token Expiration**: Tokens expire after 7 days, redirect to login on 401 responses

---

## Vercel Deployment

All routes are serverless functions optimized for Vercel:
- No server.js required
- Automatic API routes from file structure
- Neon serverless PostgreSQL for database
- Edge-ready with proper error handling
- Production-ready security with JWT authentication
