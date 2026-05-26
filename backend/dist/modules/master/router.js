import { Router } from 'express';
import { db } from '../../db/pool.js';
import { requirePermission } from '../../middleware/auth.js';
import { isEndDateAfterStartDate, isNonWhitespaceText, isThreeCharCode, isTwoCharCode, isValidLatLng, } from '../../utils/validation.js';
export const masterRouter = Router();
// ============ CHANNELS ============
masterRouter.get('/channels', requirePermission('channel.view'), async (_req, res) => {
    const result = await db.query(`
    SELECT 
      ch.*,
      l.code as location_code,
      l.name as location_name
    FROM channels ch
    LEFT JOIN locations l ON ch.location_id = l.id
    ORDER BY ch.created_at DESC
  `);
    res.json(result.rows);
});
masterRouter.post('/channels', requirePermission('channel.create'), async (req, res) => {
    const { code, name, description, location_id } = req.body;
    if (!isNonWhitespaceText(name)) {
        res.status(400).json({ message: 'Invalid channel name' });
        return;
    }
    if (!location_id) {
        res.status(400).json({ message: 'Location is required' });
        return;
    }
    try {
        // Verify location exists
        const locationResult = await db.query('SELECT id FROM locations WHERE id = $1', [location_id]);
        if (locationResult.rows.length === 0) {
            res.status(400).json({ message: 'Invalid location' });
            return;
        }
        const result = await db.query(`INSERT INTO channels(code, name, description, location_id, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $5)
       RETURNING *`, [code, name.trim(), description ?? null, location_id, req.user?.id]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Channel create error:', error);
        res.status(500).json({ message: 'Failed to create channel' });
    }
});
masterRouter.patch('/channels/:id', requirePermission('channel.update'), async (req, res) => {
    const { id } = req.params;
    const { name, description, status, location_id } = req.body;
    try {
        // Verify location exists if provided
        if (location_id) {
            const locationResult = await db.query('SELECT id FROM locations WHERE id = $1', [location_id]);
            if (locationResult.rows.length === 0) {
                res.status(400).json({ message: 'Invalid location' });
                return;
            }
        }
        const result = await db.query(`UPDATE channels
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           status = COALESCE($4, status),
           location_id = COALESCE($5, location_id),
           updated_by = $6,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`, [id, name?.trim(), description ?? null, status, location_id, req.user?.id]);
        if (!result.rowCount) {
            res.status(404).json({ message: 'Channel not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Channel update error:', error);
        res.status(500).json({ message: 'Failed to update channel' });
    }
});
masterRouter.delete('/channels/:id', requirePermission('channel.delete'), async (req, res) => {
    try {
        const result = await db.query('DELETE FROM channels WHERE id = $1 RETURNING id', [req.params.id]);
        if (!result.rowCount) {
            res.status(404).json({ message: 'Channel not found' });
            return;
        }
        res.json({ message: 'Channel deleted' });
    }
    catch (error) {
        console.error('Channel delete error:', error);
        res.status(500).json({ message: 'Failed to delete channel' });
    }
});
// ============ CATEGORIES ============
masterRouter.get('/categories', requirePermission('category.view'), async (_req, res) => {
    const result = await db.query('SELECT id, code, name, description, unit_price, status FROM categories ORDER BY code ASC');
    res.json(result.rows);
});
masterRouter.post('/categories', requirePermission('category.create'), async (req, res) => {
    const { code, name, description, unit_price } = req.body;
    if (!isTwoCharCode(code) || !isNonWhitespaceText(name)) {
        res.status(400).json({ message: 'Invalid category input' });
        return;
    }
    try {
        const result = await db.query(`INSERT INTO categories(code, name, description, unit_price, status, created_by, updated_by)
       VALUES (UPPER($1), $2, $3, $4, 'ACTIVE', $5, $5)
       RETURNING *`, [code, name.trim(), description ?? null, unit_price ?? 0, req.user?.id]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ message: 'Category code already exists' });
        }
        else {
            console.error('Category create error:', error);
            res.status(500).json({ message: 'Failed to create category' });
        }
    }
});
masterRouter.patch('/categories/:id', requirePermission('category.update'), async (req, res) => {
    const { id } = req.params;
    const { name, description, unit_price, status } = req.body;
    try {
        const result = await db.query(`UPDATE categories
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           unit_price = COALESCE($4, unit_price),
           status = COALESCE($5, status),
           updated_by = $6,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`, [id, name?.trim(), description ?? null, unit_price, status, req.user?.id]);
        if (!result.rowCount) {
            res.status(404).json({ message: 'Category not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Category update error:', error);
        res.status(500).json({ message: 'Failed to update category' });
    }
});
masterRouter.delete('/categories/:id', requirePermission('category.delete'), async (req, res) => {
    try {
        const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING id', [req.params.id]);
        if (!result.rowCount) {
            res.status(404).json({ message: 'Category not found' });
            return;
        }
        res.json({ message: 'Category deleted' });
    }
    catch (error) {
        console.error('Category delete error:', error);
        res.status(500).json({ message: 'Failed to delete category' });
    }
});
// ============ LOCATIONS ============
masterRouter.get('/locations', requirePermission('location.view'), async (_req, res) => {
    const result = await db.query('SELECT id, code, name, address_line, latitude, longitude, status FROM locations ORDER BY code ASC');
    res.json(result.rows);
});
masterRouter.post('/locations', requirePermission('location.create'), async (req, res) => {
    const { code, name, address_line, latitude, longitude } = req.body;
    if (!isThreeCharCode(code) || !isNonWhitespaceText(name) || !isValidLatLng(latitude, longitude)) {
        res.status(400).json({ message: 'Invalid location input' });
        return;
    }
    try {
        const result = await db.query(`INSERT INTO locations(code, name, address_line, latitude, longitude, status, created_by, updated_by)
       VALUES (UPPER($1), $2, $3, $4, $5, 'ACTIVE', $6, $6)
       RETURNING *`, [code, name.trim(), address_line ?? null, latitude ?? null, longitude ?? null, req.user?.id]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ message: 'Location code already exists' });
        }
        else {
            console.error('Location create error:', error);
            res.status(500).json({ message: 'Failed to create location' });
        }
    }
});
masterRouter.patch('/locations/:id', requirePermission('location.update'), async (req, res) => {
    const { id } = req.params;
    const { name, address_line, latitude, longitude, status } = req.body;
    if (!isValidLatLng(latitude, longitude)) {
        res.status(400).json({ message: 'Invalid latitude/longitude bounds' });
        return;
    }
    try {
        const result = await db.query(`UPDATE locations
       SET name = COALESCE($2, name),
           address_line = COALESCE($3, address_line),
           latitude = COALESCE($4, latitude),
           longitude = COALESCE($5, longitude),
           status = COALESCE($6, status),
           updated_by = $7,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`, [id, name?.trim(), address_line ?? null, latitude ?? null, longitude ?? null, status, req.user?.id]);
        if (!result.rowCount) {
            res.status(404).json({ message: 'Location not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Location update error:', error);
        res.status(500).json({ message: 'Failed to update location' });
    }
});
masterRouter.delete('/locations/:id', requirePermission('location.delete'), async (req, res) => {
    try {
        const result = await db.query('DELETE FROM locations WHERE id = $1 RETURNING id', [req.params.id]);
        if (!result.rowCount) {
            res.status(404).json({ message: 'Location not found' });
            return;
        }
        res.json({ message: 'Location deleted' });
    }
    catch (error) {
        console.error('Location delete error:', error);
        res.status(500).json({ message: 'Failed to delete location' });
    }
});
// ============ CONTENTS (Simplified) ============
masterRouter.get('/contents', requirePermission('content.view'), async (_req, res) => {
    try {
        const result = await db.query(`SELECT *,
              CASE WHEN CURRENT_DATE > end_date THEN 'HET_HAN' ELSE 'CON_HAN' END AS computed_status
       FROM advertising_contents
       ORDER BY created_at DESC`);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Contents get error:', error);
        res.json([]);
    }
});
masterRouter.post('/contents', requirePermission('content.create'), async (req, res) => {
    const { channelId, categoryId, name, description, startDate, endDate, imageKeys = [] } = req.body;
    if (!isNonWhitespaceText(name) || !isEndDateAfterStartDate(startDate, endDate)) {
        res.status(400).json({ message: 'Invalid content input' });
        return;
    }
    try {
        const created = await db.query(`INSERT INTO advertising_contents(
        channel_id, category_id, name, description, start_date, end_date, image_keys, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $8)
      RETURNING *`, [channelId, categoryId ?? null, name.trim(), description ?? null, startDate, endDate, JSON.stringify(imageKeys), req.user?.id]);
        res.status(201).json(created.rows[0]);
    }
    catch (error) {
        console.error('Content create error:', error);
        res.status(500).json({ message: 'Failed to create content' });
    }
});
masterRouter.patch('/contents/:id', requirePermission('content.update'), async (req, res) => {
    const { id } = req.params;
    const { name, description, startDate, endDate, imageKeys } = req.body;
    if (name && !isNonWhitespaceText(name)) {
        res.status(400).json({ message: 'Invalid content name' });
        return;
    }
    if (startDate && endDate && !isEndDateAfterStartDate(startDate, endDate)) {
        res.status(400).json({ message: 'End date must be after start date' });
        return;
    }
    try {
        const result = await db.query(`UPDATE advertising_contents
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           start_date = COALESCE($4, start_date),
           end_date = COALESCE($5, end_date),
           image_keys = COALESCE($6::jsonb, image_keys),
           updated_by = $7,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`, [id, name?.trim(), description ?? null, startDate, endDate, imageKeys ? JSON.stringify(imageKeys) : null, req.user?.id]);
        if (!result.rowCount) {
            res.status(404).json({ message: 'Content not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Content update error:', error);
        res.status(500).json({ message: 'Failed to update content' });
    }
});
