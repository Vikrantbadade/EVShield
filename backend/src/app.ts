import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import v1Routes from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const app: Express = express();

// Security Headers
app.use(helmet());

// CORS Setup (Restricted to FRONTEND_URL or localhost in development)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      if (origin === config.frontendUrl || config.isDevelopment) {
        return callback(null, true);
      }
      return callback(new Error('CORS Policy violation: Access denied for this origin.'));
    },
    credentials: true,
  })
);

// HTTP Request Logging
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request Payload Body Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Mount Versioned API Routes (/api/v1)
app.use('/api/v1', v1Routes);

// Catch 404 Unhandled Routes
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

export default app;
