import cors from 'cors';
import express from 'express';
import { authenticate } from './middleware/auth.js';
import { masterRouter } from './modules/master/router.js';
import { physicalItemsRouter } from './modules/physical-items/router.js';
import { registrationsRouter } from './modules/registrations/router.js';
import { usersRouter } from './modules/users/router.js';
export const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/users', usersRouter);
app.use('/api/authenticated', authenticate);
app.use('/api/master', authenticate, masterRouter);
app.use('/api/physical-items', authenticate, physicalItemsRouter);
app.use('/api/registrations', authenticate, registrationsRouter);
app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
});
