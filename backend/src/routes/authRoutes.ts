/**
 * Auth Routes
 * Login endpoint
 */

import { Router, Request, Response } from 'express';
import { signAccessToken } from '../auth/jwt.js';
import { queryOne } from '../db/postgres.js';

const router = Router();

interface LoginRequest {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password required' });
    }

    // Find user with role details
    const user = await queryOne<any>(
      `SELECT u.*, r.code as role_name FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE LOWER(u.email) = LOWER($1) AND u.deleted_at IS NULL`,
      [email]
    );

    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    // Verify password using SHA256 hash
    const crypto = await import('crypto');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    if (passwordHash !== user.password_hash) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    // Generate JWT token using the signAccessToken utility
    const token = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role_name,
      channelIds: [],
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role_name,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

export default router;
