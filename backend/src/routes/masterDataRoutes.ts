/**
 * Master Data Routes
 * Includes: Content, Locations, Categories, Items
 */

import { Router, Request, Response } from 'express';
import * as contentService from '../services/contentService.js';
import * as locationService from '../services/locationService.js';
import * as categoryService from '../services/categoryService.js';
import * as itemService from '../services/itemService.js';
import { AuthenticatedRequest } from '../types.js';

const router = Router();

// ============================================================
// ADVERTISING CONTENT ROUTES
// ============================================================

/**
 * GET /api/v1/content
 * List advertising content with pagination and search
 */
router.get('/content', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 25;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;

    const result = await contentService.listContent(limit, offset, search);
    res.json({
      ok: true,
      data: result.items,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.total },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * GET /api/v1/content/:id
 * Get single content by ID
 */
router.get('/content/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const content = await contentService.getContentById(req.params.id);
    if (!content) return res.status(404).json({ ok: false, error: 'Content not found' });

    const images = await contentService.getContentImages(req.params.id);
    res.json({ ok: true, data: { ...content, images } });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * POST /api/v1/content
 * Create new advertising content
 */
router.post('/content', async (req: AuthenticatedRequest, res: Response) => {
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
      created_by: req.user!.id,
    });

    res.status(201).json({ ok: true, data: content });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * PUT /api/v1/content/:id
 * Update content
 */
router.put('/content/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await contentService.updateContent(req.params.id, req.body);
    res.json({ ok: true, data: updated });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * DELETE /api/v1/content/:id
 * Delete content (soft delete)
 */
router.delete('/content/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await contentService.deleteContent(req.params.id);
    res.json({ ok: true, message: 'Content deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * POST /api/v1/content/:id/clone
 * Clone existing content
 */
router.post('/content/:id/clone', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cloned = await contentService.cloneContent(req.params.id, req.user!.id);
    res.status(201).json({ ok: true, data: cloned });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * POST /api/v1/content/:id/images
 * Add image to content
 */
router.post('/content/:id/images', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { image_url, image_key, sequence } = req.body;
    const image = await contentService.addContentImage(req.params.id, image_url, image_key, sequence);
    res.status(201).json({ ok: true, data: image });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

// ============================================================
// LOCATION ROUTES
// ============================================================

/**
 * GET /api/v1/locations
 * List locations
 */
router.get('/locations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 25;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;
    const channelId = req.query.channelId as string;
    const status = req.query.status as string;

    const result = await locationService.listLocations(limit, offset, search, channelId, status);
    res.json({
      ok: true,
      data: result.items,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.total },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * GET /api/v1/locations/:id
 * Get single location
 */
router.get('/locations/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const location = await locationService.getLocationById(req.params.id);
    if (!location) return res.status(404).json({ ok: false, error: 'Location not found' });
    res.json({ ok: true, data: location });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * POST /api/v1/locations
 * Create location
 */
router.post('/locations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { position_code, channel_id, position_name, province_city, zone, address, status, ...rest } = req.body;

    if (!position_code || !channel_id || !position_name || !province_city || !zone || !address) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const location = await locationService.createLocation({
      position_code,
      channel_id,
      position_name,
      province_city,
      zone,
      address,
      status: status || 'ACTIVE',
      created_by: req.user!.id,
      ...rest,
    });

    res.status(201).json({ ok: true, data: location });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * PUT /api/v1/locations/:id
 * Update location
 */
router.put('/locations/:id', async (req: AuthenticatedRequest, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * DELETE /api/v1/locations/:id
 * Delete location (soft delete)
 */
router.delete('/locations/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await locationService.deleteLocation(req.params.id);
    res.json({ ok: true, message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

// ============================================================
// CATEGORY ROUTES
// ============================================================

/**
 * GET /api/v1/categories
 * List categories
 */
router.get('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 25;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;
    const format = req.query.format as string;
    const status = req.query.status as string;

    const result = await categoryService.listCategories(limit, offset, search, format, status);
    res.json({
      ok: true,
      data: result.items,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.total },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * GET /api/v1/categories/:id
 * Get single category
 */
router.get('/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    if (!category) return res.status(404).json({ ok: false, error: 'Category not found' });
    res.json({ ok: true, data: category });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * POST /api/v1/categories
 * Create category
 */
router.post('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, name, format, unit_of_measure, status, ...rest } = req.body;

    if (!code || !name || !format || !unit_of_measure) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const category = await categoryService.createCategory({
      code,
      name,
      format,
      unit_of_measure,
      status: status || 'ACTIVE',
      created_by: req.user!.id,
      ...rest,
    });

    res.status(201).json({ ok: true, data: category });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * PUT /api/v1/categories/:id
 * Update category
 */
router.put('/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * PUT /api/v1/categories/:id/price
 * Update category price
 */
router.put('/categories/:id/price', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { new_price } = req.body;
    if (!new_price) return res.status(400).json({ ok: false, error: 'new_price required' });

    const result = await categoryService.updateCategoryPrice(req.params.id, new_price);
    res.json({ ok: true, data: result });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * DELETE /api/v1/categories/:id
 * Delete category
 */
router.delete('/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({ ok: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

// ============================================================
// PHYSICAL ITEM ROUTES
// ============================================================

/**
 * GET /api/v1/items
 * List physical items
 */
router.get('/items', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 25;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;
    const categoryId = req.query.categoryId as string;
    const channelId = req.query.channelId as string;
    const locationId = req.query.locationId as string;
    const status = req.query.status as string;

    const result = await itemService.listItems(limit, offset, search, categoryId, channelId, locationId, status);
    res.json({
      ok: true,
      data: result.items,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.total },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * GET /api/v1/items/:id
 * Get single item
 */
router.get('/items/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await itemService.getItemById(req.params.id);
    if (!item) return res.status(404).json({ ok: false, error: 'Item not found' });
    res.json({ ok: true, data: item });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * POST /api/v1/items/batch-create
 * Batch create items
 */
router.post('/items/batch-create', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, position_code, category_code, category_name, position_name } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: 'Items array required' });
    }

    const created = await itemService.batchCreateItems(
      items,
      req.user!.id,
      position_code,
      category_code,
      category_name,
      position_name
    );

    res.status(201).json({ ok: true, data: created });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * PUT /api/v1/items/:id
 * Update item
 */
router.put('/items/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await itemService.updateItem(req.params.id, req.body);
    res.json({ ok: true, data: updated });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * DELETE /api/v1/items/:id
 * Delete item
 */
router.delete('/items/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await itemService.deleteItem(req.params.id);
    res.json({ ok: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

// ============================================================
// CHANNELS ROUTES (Stub - awaiting full implementation)
// ============================================================

/**
 * GET /api/v1/channels
 * List channels (stub - returns empty list)
 */
router.get('/channels', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // TODO: Implement channel service
    res.json({
      ok: true,
      data: [],
      pagination: { page: 1, limit: 25, total: 0 },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * POST /api/v1/channels
 * Create new channel (stub - not yet implemented)
 */
router.post('/channels', async (req: AuthenticatedRequest, res: Response) => {
  res.status(501).json({ ok: false, error: 'Channels feature not yet implemented' });
});

/**
 * PUT /api/v1/channels/:id
 * Update channel (stub - not yet implemented)
 */
router.put('/channels/:id', async (req: AuthenticatedRequest, res: Response) => {
  res.status(501).json({ ok: false, error: 'Channels feature not yet implemented' });
});

/**
 * DELETE /api/v1/channels/:id
 * Delete channel (stub - not yet implemented)
 */
router.delete('/channels/:id', async (req: AuthenticatedRequest, res: Response) => {
  res.status(501).json({ ok: false, error: 'Channels feature not yet implemented' });
});

export default router;
