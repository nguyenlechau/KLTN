/**
 * exportRoutes.ts
 * Export/Reporting API endpoints per SYSTEM_SPECIFICATION Section K & L
 * Supports: Excel, CSV, PDF exports with multiple report templates
 */

import { Router, Request, Response } from 'express';
import { validateToken, requireRole } from '../middleware/auth.js';
import ExportService from '../services/ExportService.js';

const router = Router();

/**
 * POST /api/reports/export
 * Generic export endpoint
 * Body: {
 *   format: 'excel' | 'csv' | 'pdf',
 *   reportType: 'registrations' | 'items' | 'content' | 'locations' | 'categories' | 'orders',
 *   dateRange?: { startDate, endDate },
 *   filters?: {}
 * }
 */
router.post(
  '/export',
  validateToken,
  requireRole(['BRAND_MANAGER', 'ADMIN']), // Only managers can export
  async (req: Request, res: Response) => {
    try {
      const { format, reportType, dateRange, filters } = req.body;

      // Validate input
      if (!format || !reportType) {
        return res
          .status(400)
          .json({ error: 'format and reportType are required' });
      }

      const validFormats = ['excel', 'csv', 'pdf'];
      const validReports = ['registrations', 'items', 'content', 'locations', 'categories', 'orders'];

      if (!validFormats.includes(format)) {
        return res.status(400).json({ error: `Invalid format: ${format}` });
      }

      if (!validReports.includes(reportType)) {
        return res.status(400).json({ error: `Invalid reportType: ${reportType}` });
      }

      // Generate export
      const db = req.app.get('db');
      const exportService = new ExportService(db);

      const buffer = await exportService.generateExport({
        format: format as 'excel' | 'csv' | 'pdf',
        reportType: reportType as any,
        dateRange: dateRange && {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
        },
        filters,
      });

      // Set response headers
      const fileExtension = format === 'excel' ? 'xlsx' : format;
      const fileName = `${reportType}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;

      res.setHeader('Content-Type', this.getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/reports/registrations
 * Export registrations report
 */
router.post(
  '/registrations',
  validateToken,
  requireRole(['BRAND_MANAGER', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { format = 'excel', dateRange, status } = req.body;

      const db = req.app.get('db');
      const exportService = new ExportService(db);

      const buffer = await exportService.generateExport({
        format,
        reportType: 'registrations',
        dateRange: dateRange && {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
        },
        filters: { status },
      });

      const fileName = `registrations_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      res.setHeader('Content-Type', this.getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/reports/items
 * Export physical items report
 */
router.post(
  '/items',
  validateToken,
  requireRole(['BRAND_MANAGER', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { format = 'excel' } = req.body;

      const db = req.app.get('db');
      const exportService = new ExportService(db);

      const buffer = await exportService.generateExport({
        format,
        reportType: 'items',
      });

      const fileName = `physical_items_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      res.setHeader('Content-Type', this.getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/reports/content
 * Export content report
 */
router.post(
  '/content',
  validateToken,
  requireRole(['BRAND_MANAGER', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { format = 'excel' } = req.body;

      const db = req.app.get('db');
      const exportService = new ExportService(db);

      const buffer = await exportService.generateExport({
        format,
        reportType: 'content',
      });

      const fileName = `content_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      res.setHeader('Content-Type', this.getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/reports/locations
 * Export locations report
 */
router.post(
  '/locations',
  validateToken,
  requireRole(['BRAND_MANAGER', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { format = 'excel' } = req.body;

      const db = req.app.get('db');
      const exportService = new ExportService(db);

      const buffer = await exportService.generateExport({
        format,
        reportType: 'locations',
      });

      const fileName = `locations_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      res.setHeader('Content-Type', this.getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/reports/categories
 * Export categories report
 */
router.post(
  '/categories',
  validateToken,
  requireRole(['BRAND_MANAGER', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { format = 'excel' } = req.body;

      const db = req.app.get('db');
      const exportService = new ExportService(db);

      const buffer = await exportService.generateExport({
        format,
        reportType: 'categories',
      });

      const fileName = `categories_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      res.setHeader('Content-Type', this.getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/reports/orders
 * Export orders report (approved registrations)
 */
router.post(
  '/orders',
  validateToken,
  requireRole(['BRAND_MANAGER', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { format = 'excel' } = req.body;

      const db = req.app.get('db');
      const exportService = new ExportService(db);

      const buffer = await exportService.generateExport({
        format,
        reportType: 'orders',
      });

      const fileName = `orders_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      res.setHeader('Content-Type', this.getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Helper: Get content type for format
 */
router.getContentType = function (format: string): string {
  switch (format) {
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv':
      return 'text/csv';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
};

export default router;
