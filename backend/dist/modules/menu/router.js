import { Router } from 'express';
import { db } from '../../db/pool.js';
import { requirePermission } from '../../middleware/auth.js';
export const menuRouter = Router();
// GET all menus
menuRouter.get('/', requirePermission('audit.view'), async (req, res) => {
    try {
        const result = await db.query(`SELECT id, code, name, label, icon, order_position, parent_id, status, created_at, updated_at 
       FROM menus 
       ORDER BY order_position, code`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error fetching menus:', err);
        res.status(500).json({ message: 'Failed to fetch menus' });
    }
});
// GET menu by ID
menuRouter.get('/:id', requirePermission('audit.view'), async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM menus WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Menu not found' });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error fetching menu:', err);
        res.status(500).json({ message: 'Failed to fetch menu' });
    }
});
// POST create menu
menuRouter.post('/', requirePermission('audit.view'), async (req, res) => {
    try {
        const { code, name, label, icon, order_position, parent_id, status } = req.body;
        // Validate required fields
        if (!code || !name) {
            return res.status(400).json({ message: 'Code and name are required' });
        }
        // Check if code already exists
        const existing = await db.query('SELECT id FROM menus WHERE code = $1', [code]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Menu code already exists' });
        }
        const result = await db.query(`INSERT INTO menus (code, name, label, icon, order_position, parent_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`, [code, name, label || null, icon || null, order_position || 999, parent_id || null, status || 'ACTIVE']);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error creating menu:', err);
        res.status(500).json({ message: 'Failed to create menu' });
    }
});
// PATCH update menu
menuRouter.patch('/:id', requirePermission('audit.view'), async (req, res) => {
    try {
        const { code, name, label, icon, order_position, parent_id, status } = req.body;
        // Check if menu exists
        const existing = await db.query('SELECT * FROM menus WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Menu not found' });
        }
        // Check if code is being changed to an existing code
        if (code && code !== existing.rows[0].code) {
            const duplicate = await db.query('SELECT id FROM menus WHERE code = $1', [code]);
            if (duplicate.rows.length > 0) {
                return res.status(400).json({ message: 'Menu code already exists' });
            }
        }
        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (code !== undefined) {
            updates.push(`code = $${paramIndex++}`);
            values.push(code);
        }
        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name);
        }
        if (label !== undefined) {
            updates.push(`label = $${paramIndex++}`);
            values.push(label || null);
        }
        if (icon !== undefined) {
            updates.push(`icon = $${paramIndex++}`);
            values.push(icon || null);
        }
        if (order_position !== undefined) {
            updates.push(`order_position = $${paramIndex++}`);
            values.push(order_position);
        }
        if (parent_id !== undefined) {
            updates.push(`parent_id = $${paramIndex++}`);
            values.push(parent_id || null);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            values.push(status);
        }
        updates.push(`updated_at = NOW()`);
        values.push(req.params.id);
        const query = `UPDATE menus SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await db.query(query, values);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error updating menu:', err);
        res.status(500).json({ message: 'Failed to update menu' });
    }
});
// DELETE menu
menuRouter.delete('/:id', requirePermission('audit.view'), async (req, res) => {
    try {
        // Check if menu exists
        const existing = await db.query('SELECT * FROM menus WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Menu not found' });
        }
        // Check if menu has children
        const children = await db.query('SELECT id FROM menus WHERE parent_id = $1', [req.params.id]);
        if (children.rows.length > 0) {
            return res.status(400).json({ message: 'Cannot delete menu with child items. Delete children first.' });
        }
        await db.query('DELETE FROM menus WHERE id = $1', [req.params.id]);
        res.json({ message: 'Menu deleted successfully' });
    }
    catch (err) {
        console.error('Error deleting menu:', err);
        res.status(500).json({ message: 'Failed to delete menu' });
    }
});
