import cors from 'cors';
import express from 'express';
import { authenticate } from './middleware/auth.js';
import masterDataRoutes from './routes/masterDataRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { menuRouter } from './modules/menu/router.js';

export const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (with authentication)
app.use('/api/v1', authenticate, masterDataRoutes);
app.use('/api/v1', authenticate, registrationRoutes);
app.use('/api/v1/master/menus', authenticate, menuRouter);

// Error handling
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error:', error);
  
  const message = error instanceof Error ? error.message : 'Internal server error';
  res.status(500).json({ ok: false, error: message });
});
