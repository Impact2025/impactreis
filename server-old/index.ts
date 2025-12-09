import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const port = process.env.PORT || 3001;

// Health check FIRST
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
});
app.use('/api/', limiter);

// Import routes dynamically
const authRoutes = (await import('./routes/auth.routes.js')).default;
const habitsRoutes = (await import('./routes/habits.routes.js')).default;
const logsRoutes = (await import('./routes/logs.routes.js')).default;
const goalsRoutes = (await import('./routes/goals.routes.js')).default;
const weeklyReviewsRoutes = (await import('./routes/weekly-reviews.routes.js')).default;
const focusSessionsRoutes = (await import('./routes/focus-sessions.routes.js')).default;

// Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many auth attempts',
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/weekly-reviews', weeklyReviewsRoutes);
app.use('/api/focus-sessions', focusSessionsRoutes);

// Error handler
const { errorHandler } = await import('./middleware/error.middleware.js');
app.use(errorHandler);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Health: http://localhost:${port}/health`);
});

export default app;
