import express from 'express';
import cookieParser from 'cookie-parser';
import passport from './config/passport.config.js';
import healthRouter from './routes/health.router.js';
import eventsRouter from './routes/events.router.js';
import sessionsRouter from './routes/sessions.router.js';
import { notFound, errorHandler } from './middlewares/errors.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(passport.initialize());
app.use('/api/health', healthRouter);
app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);
app.use(notFound);
app.use(errorHandler);
export default app;
