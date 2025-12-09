# Vercel Deployment Guide

## Prerequisites

- Vercel account (free tier works)
- Neon database with connection string
- GitHub repository (optional but recommended)

---

## Step 1: Install Dependencies

Run the following command to install all required dependencies:

```bash
npm install
```

This will install:
- `@neondatabase/serverless` - Neon PostgreSQL driver
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `zod` - Schema validation
- And all TypeScript types

---

## Step 2: Environment Variables

Create a `.env.local` file for local development (already exists):

```env
DATABASE_URL=postgresql://neondb_owner:npg_GY6xN4JXhzTa@ep-fragrant-waterfall-agn026b8-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=ea56a4707560658b88e46b665ad2eee2ce4dacf724ac62c1319d4fdafcc81cfeaab4e1872a0cb42206215fc401bd67f0527d2e58337cc7522a96da3fb15f7ff9
JWT_EXPIRES_IN=7d
```

---

## Step 3: Database Setup

Your Neon database should have the following tables. If not, run these SQL commands in the Neon console:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  period VARCHAR(50),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  streak INTEGER DEFAULT 0,
  last_completed DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  date_string VARCHAR(20) NOT NULL,
  data JSONB NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Focus sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  goal TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly goals table
CREATE TABLE IF NOT EXISTS weekly_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  week_number VARCHAR(20) NOT NULL,
  goals JSONB NOT NULL,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly reviews table
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  week_number VARCHAR(20) NOT NULL,
  data JSONB NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_id ON weekly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_id ON weekly_reviews(user_id);
```

---

## Step 4: Test Locally

Run the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` and test the API routes:
- Register: `POST http://localhost:3000/api/auth/register`
- Login: `POST http://localhost:3000/api/auth/login`
- Other routes require JWT token in Authorization header

---

## Step 5: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add:
     - `DATABASE_URL` = your Neon connection string
     - `JWT_SECRET` = your JWT secret
     - `JWT_EXPIRES_IN` = 7d

5. Redeploy:
```bash
vercel --prod
```

### Option B: Deploy via GitHub Integration

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit with complete API backend"
git push origin main
```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)

3. Click "Add New Project"

4. Import your GitHub repository

5. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `next build`
   - Output Directory: `.next`

6. Add Environment Variables:
   - `DATABASE_URL` = your Neon connection string
   - `JWT_SECRET` = your JWT secret
   - `JWT_EXPIRES_IN` = 7d

7. Click "Deploy"

---

## Step 6: Verify Deployment

After deployment, test your API:

1. Get your Vercel URL (e.g., `https://your-app.vercel.app`)

2. Test registration:
```bash
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

3. Test login:
```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

4. Save the token from the response and test authenticated routes:
```bash
curl -X GET https://your-app.vercel.app/api/goals \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Project Structure

```
mijn-ondernemers-os/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   └── register/route.ts
│   │       ├── goals/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── habits/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── logs/
│   │       │   └── route.ts
│   │       ├── focus/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── weekly-goals/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       └── weekly-reviews/
│   │           └── route.ts
│   └── lib/
│       ├── db.ts              # Database connection
│       ├── auth.ts            # Authentication helpers
│       └── schemas/
│           ├── auth.schema.ts # Auth validation schemas
│           └── goals.schema.ts # Goals validation schemas
├── .env                       # Environment variables (DO NOT COMMIT)
├── .env.local                 # Local environment variables
├── package.json               # Dependencies
└── next.config.js             # Next.js configuration
```

---

## API Routes Summary

All routes are available at `/api/*`:

- **Authentication**: `/api/auth/register`, `/api/auth/login`
- **Goals**: `/api/goals`, `/api/goals/[id]`
- **Habits**: `/api/habits`, `/api/habits/[id]`
- **Daily Logs**: `/api/logs`
- **Focus Sessions**: `/api/focus`, `/api/focus/[id]`
- **Weekly Goals**: `/api/weekly-goals`, `/api/weekly-goals/[id]`
- **Weekly Reviews**: `/api/weekly-reviews`

See `API_ROUTES.md` for detailed documentation of each endpoint.

---

## Security Checklist

- [x] JWT authentication implemented
- [x] Password hashing with bcrypt (12 rounds)
- [x] User ID extracted from token (not URL params)
- [x] Database queries filtered by user_id
- [x] Input validation with Zod schemas
- [x] Proper error handling and status codes
- [x] Environment variables for secrets
- [x] SQL injection protection (Neon parameterized queries)

---

## Performance Optimization

- [x] Neon serverless PostgreSQL (auto-scaling)
- [x] Database indexes on user_id columns
- [x] Limited query results (e.g., 50 most recent logs)
- [x] Efficient Next.js API routes (serverless functions)
- [x] No unnecessary database connections

---

## Troubleshooting

### Issue: API routes return 404
**Solution**: Ensure file structure matches Next.js conventions:
- Files must be named `route.ts`
- Dynamic routes use `[id]` folder structure

### Issue: Database connection fails
**Solution**:
- Verify `DATABASE_URL` in Vercel environment variables
- Ensure Neon database is active (not paused)
- Check connection string includes `?sslmode=require`

### Issue: JWT authentication fails
**Solution**:
- Verify `JWT_SECRET` is set in environment variables
- Check token format: `Bearer {token}`
- Token expires after 7 days, re-login required

### Issue: Build fails on Vercel
**Solution**:
- Run `npm install` to ensure all dependencies are installed
- Check `package.json` has all required dependencies
- Verify TypeScript types are installed

---

## Next Steps

1. Deploy frontend to connect to API
2. Set up custom domain (optional)
3. Configure CORS if needed for external clients
4. Set up monitoring/logging (Vercel Analytics)
5. Implement rate limiting (Vercel Edge Config)
6. Add API documentation (Swagger/OpenAPI)

---

## Support

For issues or questions:
1. Check API_ROUTES.md for endpoint documentation
2. Review Vercel deployment logs
3. Check Neon database logs
4. Test locally first before deploying

---

## Production Considerations

- Use strong JWT_SECRET (64+ random bytes)
- Enable CORS only for your frontend domain
- Set up database backups (Neon automatic)
- Monitor API usage and errors
- Implement rate limiting for production
- Consider adding request logging
- Set up health check endpoint
