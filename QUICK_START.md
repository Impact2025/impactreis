# Quick Start Guide

## Your Next.js API Backend is Complete!

All API routes are ready for Vercel deployment. Follow these steps to get started:

---

## Checklist

### 1. Install Dependencies
```bash
npm install
```

This installs:
- @neondatabase/serverless
- bcrypt
- jsonwebtoken
- zod
- TypeScript types

---

### 2. Verify Environment Variables

Check `.env` file contains:
- [x] `DATABASE_URL` - Neon PostgreSQL connection string
- [x] `JWT_SECRET` - Secret key for JWT tokens
- [x] `JWT_EXPIRES_IN` - Token expiration (7d)

---

### 3. Test Locally

```bash
npm run dev
```

Test endpoints:
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

### 4. Deploy to Vercel

#### Quick Deploy:
```bash
npm install -g vercel
vercel login
vercel
```

#### Add Environment Variables in Vercel:
1. Go to your project settings
2. Add Environment Variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`

3. Redeploy:
```bash
vercel --prod
```

---

## What's Been Created

### API Routes (12 files)
- ✅ `/api/auth/register` - User registration
- ✅ `/api/auth/login` - User login
- ✅ `/api/goals` - List/create goals
- ✅ `/api/goals/[id]` - Update/delete goal
- ✅ `/api/habits` - List/create habits
- ✅ `/api/habits/[id]` - Update/delete habit
- ✅ `/api/logs` - List/create daily logs
- ✅ `/api/focus` - List/create focus sessions
- ✅ `/api/focus/[id]` - Update/delete focus session
- ✅ `/api/weekly-goals` - List/create weekly goals
- ✅ `/api/weekly-goals/[id]` - Update/delete weekly goal
- ✅ `/api/weekly-reviews` - List/create weekly reviews

### Library Files
- ✅ `src/lib/db.ts` - Neon database connection
- ✅ `src/lib/auth.ts` - JWT authentication helpers
- ✅ `src/lib/schemas/auth.schema.ts` - Auth validation
- ✅ `src/lib/schemas/goals.schema.ts` - Goals validation

### Documentation
- ✅ `API_ROUTES.md` - Complete API documentation
- ✅ `DEPLOYMENT.md` - Detailed deployment guide
- ✅ `QUICK_START.md` - This file

### Dependencies
- ✅ Updated `package.json` with all required packages

---

## Key Features

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- 7-day token expiration
- Secure authorization on all protected routes

### Database
- Neon serverless PostgreSQL
- Parameterized queries (SQL injection safe)
- User-scoped data access
- Optimized with indexes

### Production Ready
- Proper error handling
- HTTP status codes
- Input validation (Zod)
- TypeScript type safety
- Vercel serverless optimized

---

## File Structure

```
src/
├── app/api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   └── register/route.ts
│   ├── goals/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── habits/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── logs/route.ts
│   ├── focus/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── weekly-goals/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── weekly-reviews/route.ts
└── lib/
    ├── db.ts
    ├── auth.ts
    └── schemas/
        ├── auth.schema.ts
        └── goals.schema.ts
```

---

## Testing

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Create a Goal (with token)
```bash
curl -X POST http://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"type":"yearly","title":"Grow business by 50%","period":"2024"}'
```

---

## Common Issues

### Database Connection Error
- Check DATABASE_URL in `.env`
- Ensure Neon database is active

### Authentication Error
- Verify JWT_SECRET is set
- Check token format: `Bearer {token}`
- Token expires after 7 days

### Build Error
- Run `npm install` first
- Check all dependencies in package.json

---

## Next Steps

1. **Test Locally** - Verify all endpoints work
2. **Deploy to Vercel** - Push to production
3. **Connect Frontend** - Update API URLs
4. **Add Features** - Extend as needed

---

## Documentation

- **API Reference**: See `API_ROUTES.md`
- **Deployment**: See `DEPLOYMENT.md`
- **Database Schema**: See `DEPLOYMENT.md` (Step 3)

---

## Support

Your API backend is production-ready for Vercel!

Key Points:
- All routes use JWT authentication
- User data is isolated by user_id
- Input validation on all endpoints
- Proper error handling
- Neon serverless PostgreSQL

Ready to deploy! 🚀
