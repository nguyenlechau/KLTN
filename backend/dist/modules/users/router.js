import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { signAccessToken } from '../../auth/jwt.js';
import * as userService from './service.js';
export const usersRouter = Router();
// Get available roles (no auth required)
usersRouter.get('/roles', async (_req, res) => {
    const roles = [
        { code: 'REQUESTER', name: 'Requester' },
        { code: 'CENTRAL_REQUESTER', name: 'Central Requester' },
        { code: 'SUPERVISOR', name: 'Supervisor' },
        { code: 'CENTRAL_SUPERVISOR', name: 'Central Supervisor' },
        { code: 'OPERATIONS_SPECIALIST', name: 'Operations Specialist' },
        { code: 'OPERATIONS_MANAGER', name: 'Operations Manager' },
    ];
    res.json(roles);
});
// Login endpoint (no auth required)
usersRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        const user = await userService.authenticateUser(email, password);
        const token = signAccessToken({
            id: user.id,
            email: user.email,
            role: user.role,
            channelIds: [],
        });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
            },
        });
    }
    catch (err) {
        res.status(401).json({ message: err.message || 'Authentication failed' });
    }
});
// Get all users - requires admin view permission
usersRouter.get('/', authenticate, requirePermission('audit.view'), async (_req, res) => {
    try {
        const users = await userService.getUsers();
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Get current user
usersRouter.get('/me', authenticate, async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.id);
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Create user - requires admin view permission
usersRouter.post('/', authenticate, requirePermission('audit.view'), async (req, res) => {
    try {
        const { email, fullName, password, role } = req.body;
        if (!email || !fullName || !password || !role) {
            res.status(400).json({ message: 'Email, fullName, password, and role are required' });
            return;
        }
        const user = await userService.createUser({
            email,
            fullName,
            password,
            role,
        });
        const token = signAccessToken({
            id: user.id,
            email: user.email,
            role,
            channelIds: [],
        });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role,
            },
        });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
// Update user - requires audit.view permission
usersRouter.patch('/:id', authenticate, requirePermission('audit.view'), async (req, res) => {
    try {
        const { id } = req.params;
        const { email, fullName, role, status } = req.body;
        const user = await userService.updateUser(id, {
            email,
            fullName,
            role,
            status,
        });
        res.json(user);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
// Delete user - requires audit.view permission
usersRouter.delete('/:id', authenticate, requirePermission('audit.view'), async (_req, res) => {
    try {
        const { id } = _req.params;
        await userService.deleteUser(id);
        res.json({ success: true });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
