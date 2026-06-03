/**
 * Master Data Routes
 * Includes: Content, Locations, Categories, Items
 */
import { Router } from 'express';
import { randomUUID } from 'crypto';
import * as contentService from '../services/contentService.js';
import * as locationService from '../services/locationService.js';
import * as categoryService from '../services/categoryService.js';
import * as itemService from '../services/itemService.js';
import { query, queryAll, queryOne } from '../db/postgres.js';
const router = Router();
// ============================================================
// ADVERTISING CONTENT ROUTES
// ============================================================
/**
 * GET /api/v1/content
 * List advertising content with pagination and search
 */
router.get('/content', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 25;
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search;
        const result = await contentService.listContent(limit, offset, search);
        res.json({
            ok: true,
            data: result.items,
            pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.total },
        });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * GET /api/v1/content/:id
 * Get single content by ID
 */
router.get('/content/:id', async (req, res) => {
    try {
        const content = await contentService.getContentById(req.params.id);
        if (!content)
            return res.status(404).json({ ok: false, error: 'Content not found' });
        const images = await contentService.getContentImages(req.params.id);
        res.json({ ok: true, data: { ...content, images } });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * POST /api/v1/content
 * Create new advertising content
 */
router.post('/content', async (req, res) => {
    try {
        const { content_name, description, category, unit, start_date, end_date } = req.body;
        if (!content_name || !category || !unit || !start_date || !end_date) {
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        }
        const content = await contentService.createContent({
            content_name,
            description,
            category,
            unit,
            start_date,
            end_date,
            created_by: req.user.id,
        });
        res.status(201).json({ ok: true, data: content });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * PUT /api/v1/content/:id
 * Update content
 */
router.put('/content/:id', async (req, res) => {
    try {
        const updated = await contentService.updateContent(req.params.id, req.body);
        res.json({ ok: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * DELETE /api/v1/content/:id
 * Delete content (soft delete)
 */
router.delete('/content/:id', async (req, res) => {
    try {
        await contentService.deleteContent(req.params.id);
        res.json({ ok: true, message: 'Content deleted' });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * POST /api/v1/content/:id/clone
 * Clone existing content
 */
router.post('/content/:id/clone', async (req, res) => {
    try {
        const cloned = await contentService.cloneContent(req.params.id, req.user.id);
        res.status(201).json({ ok: true, data: cloned });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * POST /api/v1/content/:id/images
 * Add image to content
 */
router.post('/content/:id/images', async (req, res) => {
    try {
        const { image_url, image_key, sequence } = req.body;
        const image = await contentService.addContentImage(req.params.id, image_url, image_key, sequence);
        res.status(201).json({ ok: true, data: image });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
// ============================================================
// LOCATION ROUTES
// ============================================================
/**
 * GET /api/v1/locations
 * List locations
 */
router.get('/locations', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 25;
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search;
        const channelId = req.query.channelId;
        const status = req.query.status;
        const result = await locationService.listLocations(limit, offset, search, channelId, status);
        res.json({
            ok: true,
            data: result.items,
            pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.total },
        });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * GET /api/v1/locations/:id
 * Get single location
 */
router.get('/locations/:id', async (req, res) => {
    try {
        const location = await locationService.getLocationById(req.params.id);
        if (!location)
            return res.status(404).json({ ok: false, error: 'Location not found' });
        res.json({ ok: true, data: location });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * POST /api/v1/locations
 * Create location
 */
router.post('/locations', async (req, res) => {
    try {
        const { position_code, channel_id, position_name, province_city, zone, address, status, classification, longitude, latitude, representative_1_name, representative_1_email, representative_1_phone, representative_2_name, representative_2_email, representative_2_phone, note, } = req.body;
        if (!position_code || !channel_id || !position_name || !province_city || !zone || !address) {
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        }
        const location = await locationService.createLocation({
            code: position_code,
            name: position_name,
            position_code,
            channel_id,
            position_name,
            province_city,
            zone,
            address,
            classification,
            longitude,
            latitude,
            representative_1_name,
            representative_1_email,
            representative_1_phone,
            representative_2_name,
            representative_2_email,
            representative_2_phone,
            note,
            status: status || 'ACTIVE',
            created_by: req.user.id,
        });
        res.status(201).json({ ok: true, data: location });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * PUT /api/v1/locations/:id
 * Update location
 */
router.put('/locations/:id', async (req, res) => {
    try {
        // Check if status change is requested
        if (req.body.status === 'INACTIVE') {
            const check = await locationService.canDeactivateLocation(req.params.id);
            if (!check.can) {
                return res.status(400).json({
                    ok: false,
                    error: 'Bạn không thể thay đổi trạng thái vị trí này vì có vật phẩm thuộc vị trí đang trong quá trình thi công',
                });
            }
            await locationService.deactivateLocationItems(req.params.id);
        }
        const updated = await locationService.updateLocation(req.params.id, req.body);
        res.json({ ok: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * DELETE /api/v1/locations/:id
 * Delete location (soft delete)
 */
router.delete('/locations/:id', async (req, res) => {
    try {
        await locationService.deleteLocation(req.params.id);
        res.json({ ok: true, message: 'Location deleted' });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
// ============================================================
// CATEGORY ROUTES
// ============================================================
/**
 * GET /api/v1/categories
 * List categories
 */
router.get('/categories', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 25;
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search;
        const format = req.query.format;
        const status = req.query.status;
        const result = await categoryService.listCategories(limit, offset, search, format, status);
        res.json({
            ok: true,
            data: result.items,
            pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.total },
        });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * GET /api/v1/categories/:id
 * Get single category
 */
router.get('/categories/:id', async (req, res) => {
    try {
        const category = await categoryService.getCategoryById(req.params.id);
        if (!category)
            return res.status(404).json({ ok: false, error: 'Category not found' });
        res.json({ ok: true, data: category });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * POST /api/v1/categories
 * Create category
 */
router.post('/categories', async (req, res) => {
    try {
        const { code, name, format, unit_of_measure, unit_price, description, status } = req.body;
        if (!code || !name || !format || !unit_of_measure) {
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        }
        const parsedUnitPrice = Number(unit_price);
        if (!Number.isFinite(parsedUnitPrice)) {
            return res.status(400).json({ ok: false, error: 'unit_price must be a valid number' });
        }
        const category = await categoryService.createCategory({
            code,
            name,
            format,
            unit_of_measure,
            unit_price: parsedUnitPrice,
            description,
            status: status || 'ACTIVE',
            created_by: req.user.id,
        });
        res.status(201).json({ ok: true, data: category });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * PUT /api/v1/categories/:id
 * Update category
 */
router.put('/categories/:id', async (req, res) => {
    try {
        // Handle status change
        if (req.body.status === 'INACTIVE') {
            const check = await categoryService.canDeactivateCategory(req.params.id);
            if (!check.can) {
                return res.status(400).json({
                    ok: false,
                    error: 'Bạn không thể thay đổi trạng thái hạng mục này vì có vật phẩm thuộc hạng mục đang trong quá trình thi công',
                });
            }
            await categoryService.deactivateCategoryItems(req.params.id);
        }
        const updated = await categoryService.updateCategory(req.params.id, req.body);
        res.json({ ok: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * PUT /api/v1/categories/:id/price
 * Update category price
 */
router.put('/categories/:id/price', async (req, res) => {
    try {
        const { new_price } = req.body;
        if (!new_price)
            return res.status(400).json({ ok: false, error: 'new_price required' });
        const result = await categoryService.updateCategoryPrice(req.params.id, new_price);
        res.json({ ok: true, data: result });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * DELETE /api/v1/categories/:id
 * Delete category
 */
router.delete('/categories/:id', async (req, res) => {
    try {
        await categoryService.deleteCategory(req.params.id);
        res.json({ ok: true, message: 'Category deleted' });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
// ============================================================
// PHYSICAL ITEM ROUTES
// ============================================================
/**
 * GET /api/v1/items
 * List physical items
 */
router.get('/items', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 25;
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search;
        const categoryId = req.query.categoryId;
        const channelId = req.query.channelId;
        const locationId = req.query.locationId;
        const status = req.query.status;
        const result = await itemService.listItems(limit, offset, search, categoryId, channelId, locationId, status);
        res.json({
            ok: true,
            data: result.items,
            pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.total },
        });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * GET /api/v1/items/:id
 * Get single item
 */
router.get('/items/:id', async (req, res) => {
    try {
        const item = await itemService.getItemById(req.params.id);
        if (!item)
            return res.status(404).json({ ok: false, error: 'Item not found' });
        res.json({ ok: true, data: item });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * POST /api/v1/items/batch-create
 * Batch create items
 */
router.post('/items/batch-create', async (req, res) => {
    try {
        const { items, position_code, category_code, category_name, position_name } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ ok: false, error: 'Items array required' });
        }
        const created = await itemService.batchCreateItems(items, req.user.id, position_code, category_code, category_name, position_name);
        res.status(201).json({ ok: true, data: created });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * PUT /api/v1/items/:id
 * Update item
 */
router.put('/items/:id', async (req, res) => {
    try {
        const updated = await itemService.updateItem(req.params.id, req.body);
        res.json({ ok: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
/**
 * DELETE /api/v1/items/:id
 * Delete item
 */
router.delete('/items/:id', async (req, res) => {
    try {
        await itemService.deleteItem(req.params.id);
        res.json({ ok: true, message: 'Item deleted' });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
// ============================================================
// CHANNELS ROUTES
// ============================================================
router.get('/channels', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 25;
        const offset = parseInt(req.query.offset) || 0;
        const countResult = await queryOne('SELECT COUNT(*) as count FROM channels WHERE deleted_at IS NULL');
        const data = await queryAll('SELECT * FROM channels WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
        res.json({
            ok: true,
            data,
            pagination: { page: Math.floor(offset / limit) + 1, limit, total: parseInt(countResult?.count || '0', 10) },
        });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
router.post('/channels', async (req, res) => {
    try {
        const { code, name, description, location_id, status } = req.body;
        if (!code || !name) {
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        }
        const channel = await queryOne(`INSERT INTO channels (id, code, name, description, status, location_id, created_by, updated_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, NOW(), NOW()) RETURNING *`, [
            randomUUID(),
            code,
            name,
            description || null,
            status || 'ACTIVE',
            location_id || null,
            req.user?.id || 'system',
        ]);
        res.status(201).json({ ok: true, data: channel });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
router.patch('/channels/:id', async (req, res) => {
    try {
        const fields = [];
        const values = [];
        let index = 1;
        for (const key of ['name', 'description', 'status', 'location_id']) {
            if (req.body[key] !== undefined) {
                fields.push(`${key} = $${index}`);
                values.push(req.body[key]);
                index += 1;
            }
        }
        fields.push(`updated_by = $${index}`);
        values.push(req.user?.id || 'system');
        index += 1;
        fields.push('updated_at = NOW()');
        values.push(req.params.id);
        const updated = await queryOne(`UPDATE channels SET ${fields.join(', ')} WHERE id = $${index} AND deleted_at IS NULL RETURNING *`, values);
        if (!updated) {
            return res.status(404).json({ ok: false, error: 'Channel not found' });
        }
        res.json({ ok: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
router.delete('/channels/:id', async (req, res) => {
    try {
        await query('UPDATE channels SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1', [req.params.id]);
        res.json({ ok: true, message: 'Channel deleted' });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
// ============================================================
// MENUS ROUTES
// ============================================================
router.get('/master/menus', async (_req, res) => {
    try {
        const rows = await queryAll(`SELECT id, code, name, label, icon, order_position, parent_id, status, created_at, updated_at
       FROM menus
       ORDER BY order_position, code`);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
router.get('/master/menus/:id', async (req, res) => {
    try {
        const row = await queryOne('SELECT * FROM menus WHERE id = $1', [req.params.id]);
        if (!row)
            return res.status(404).json({ ok: false, error: 'Menu not found' });
        res.json(row);
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
router.post('/master/menus', async (req, res) => {
    try {
        const { code, name, label, icon, order_position, parent_id, status } = req.body;
        if (!code || !name)
            return res.status(400).json({ ok: false, error: 'Code and name are required' });
        const existing = await queryOne('SELECT id FROM menus WHERE code = $1', [code]);
        if (existing)
            return res.status(400).json({ ok: false, error: 'Menu code already exists' });
        const row = await queryOne(`INSERT INTO menus (id, code, name, label, icon, order_position, parent_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`, [randomUUID(), code, name, label || null, icon || null, order_position || 999, parent_id || null, status || 'ACTIVE']);
        res.json(row);
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
router.patch('/master/menus/:id', async (req, res) => {
    try {
        const existing = await queryOne('SELECT * FROM menus WHERE id = $1', [req.params.id]);
        if (!existing)
            return res.status(404).json({ ok: false, error: 'Menu not found' });
        const { code, name, label, icon, order_position, parent_id, status } = req.body;
        if (code && code !== existing.code) {
            const dup = await queryOne('SELECT id FROM menus WHERE code = $1', [code]);
            if (dup)
                return res.status(400).json({ ok: false, error: 'Menu code already exists' });
        }
        const updated = await queryOne(`UPDATE menus SET
         code = COALESCE($1, code),
         name = COALESCE($2, name),
         label = COALESCE($3, label),
         icon = COALESCE($4, icon),
         order_position = COALESCE($5, order_position),
         parent_id = $6,
         status = COALESCE($7, status),
         updated_at = NOW()
       WHERE id = $8 RETURNING *`, [code || null, name || null, label !== undefined ? label : existing.label,
            icon !== undefined ? icon : existing.icon, order_position || null,
            parent_id !== undefined ? parent_id : existing.parent_id,
            status || null, req.params.id]);
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
router.delete('/master/menus/:id', async (req, res) => {
    try {
        const children = await queryAll('SELECT id FROM menus WHERE parent_id = $1', [req.params.id]);
        if (children.length > 0) {
            return res.status(400).json({ ok: false, error: 'Cannot delete menu with children' });
        }
        await query('DELETE FROM menus WHERE id = $1', [req.params.id]);
        res.json({ ok: true, message: 'Menu deleted' });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
export default router;
