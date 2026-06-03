/**
 * ExportService.ts
 * Implements report generation and export functionality per SYSTEM_SPECIFICATION Section K
 * Supports: Excel, CSV, PDF formats
 * Report templates: Registrations, Items, Content, Locations, Categories, Orders
 */
import * as ExcelJS from 'exceljs';
export class ExportService {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Generate export based on options
     */
    async generateExport(options) {
        switch (options.format) {
            case 'excel':
                return this.generateExcelReport(options);
            case 'csv':
                return this.generateCsvReport(options);
            case 'pdf':
                return this.generatePdfReport(options);
            default:
                throw new Error(`Unsupported format: ${options.format}`);
        }
    }
    /**
     * Generate Excel report
     */
    async generateExcelReport(options) {
        const workbook = new ExcelJS.Workbook();
        switch (options.reportType) {
            case 'registrations':
                await this.addRegistrationsSheet(workbook, options);
                break;
            case 'items':
                await this.addItemsSheet(workbook, options);
                break;
            case 'content':
                await this.addContentSheet(workbook, options);
                break;
            case 'locations':
                await this.addLocationsSheet(workbook, options);
                break;
            case 'categories':
                await this.addCategoriesSheet(workbook, options);
                break;
            case 'orders':
                await this.addOrdersSheet(workbook, options);
                break;
        }
        return await workbook.xlsx.writeBuffer();
    }
    /**
     * Add Registrations sheet to workbook
     */
    async addRegistrationsSheet(workbook, options) {
        const sheet = workbook.addWorksheet('Registrations');
        // Query registrations
        let query = `
      SELECT 
        ar.id,
        ar.registration_no,
        ar.status,
        u.full_name as created_by_name,
        ar.total_budget,
        COUNT(ri.id) as item_count,
        ar.created_at,
        ar.updated_at
      FROM ad_registrations ar
      LEFT JOIN users u ON ar.created_by = u.id
      LEFT JOIN ad_registration_items ri ON ar.id = ri.registration_id
      WHERE 1=1
    `;
        const params = [];
        // Apply date filter
        if (options.dateRange) {
            query += ` AND ar.created_at >= $${params.length + 1} AND ar.created_at <= $${params.length + 2}`;
            params.push(options.dateRange.startDate, options.dateRange.endDate);
        }
        query += ' GROUP BY ar.id, u.full_name ORDER BY ar.created_at DESC';
        const result = await this.db.query(query, params);
        const registrations = result.rows;
        // Set headers
        sheet.columns = [
            { header: 'Registration No', key: 'registration_no', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Created By', key: 'created_by_name', width: 20 },
            { header: 'Items', key: 'item_count', width: 10 },
            { header: 'Total Budget', key: 'total_budget', width: 15 },
            { header: 'Created At', key: 'created_at', width: 15 },
            { header: 'Updated At', key: 'updated_at', width: 15 },
        ];
        // Format header row
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0066CC' },
        };
        sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
        // Add data rows
        registrations.forEach((reg) => {
            sheet.addRow({
                registration_no: reg.registration_no,
                status: reg.status,
                created_by_name: reg.created_by_name,
                item_count: reg.item_count,
                total_budget: reg.total_budget,
                created_at: new Date(reg.created_at).toLocaleString(),
                updated_at: new Date(reg.updated_at).toLocaleString(),
            });
        });
        // Format currency columns
        sheet.getColumn('total_budget').numFmt = '#,##0.00 VND';
        // Auto-fit columns
        sheet.columns.forEach((col) => {
            col.alignment = { horizontal: 'left', vertical: 'middle' };
        });
    }
    /**
     * Add Physical Items sheet
     */
    async addItemsSheet(workbook, options) {
        const sheet = workbook.addWorksheet('Physical Items');
        const result = await this.db.query(`
      SELECT 
        pi.item_code,
        pi.item_name,
        c.code as category_code,
        c.name as category_name,
        l.position_code,
        l.position_name,
        pi.width_m,
        pi.length_m,
        pi.status
      FROM physical_items pi
      JOIN categories c ON pi.category_id = c.id
      JOIN locations l ON pi.location_id = l.id
      WHERE pi.deleted_at IS NULL
      ORDER BY pi.item_code
    `);
        sheet.columns = [
            { header: 'Item Code', key: 'item_code', width: 15 },
            { header: 'Item Name', key: 'item_name', width: 25 },
            { header: 'Category', key: 'category_name', width: 15 },
            { header: 'Position', key: 'position_name', width: 20 },
            { header: 'Width (m)', key: 'width_m', width: 10 },
            { header: 'Length (m)', key: 'length_m', width: 10 },
            { header: 'Status', key: 'status', width: 12 },
        ];
        // Format header
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0066CC' },
        };
        sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
        // Add data
        result.rows.forEach((item) => {
            sheet.addRow(item);
        });
    }
    /**
     * Add Content sheet
     */
    async addContentSheet(workbook, options) {
        const sheet = workbook.addWorksheet('Content');
        const result = await this.db.query(`
      SELECT 
        content_code,
        title,
        content_type,
        status,
        media_url,
        created_at
      FROM advertising_content
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);
        sheet.columns = [
            { header: 'Code', key: 'content_code', width: 15 },
            { header: 'Title', key: 'title', width: 30 },
            { header: 'Type', key: 'content_type', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Media URL', key: 'media_url', width: 40 },
            { header: 'Created At', key: 'created_at', width: 15 },
        ];
        // Format header
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0066CC' },
        };
        sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
        // Add data
        result.rows.forEach((content) => {
            sheet.addRow({
                ...content,
                created_at: new Date(content.created_at).toLocaleString(),
            });
        });
    }
    /**
     * Add Locations sheet
     */
    async addLocationsSheet(workbook, options) {
        const sheet = workbook.addWorksheet('Locations');
        const result = await this.db.query(`
      SELECT 
        location_code,
        position_code,
        position_name,
        zone,
        coordinates,
        status
      FROM locations
      WHERE deleted_at IS NULL
      ORDER BY location_code
    `);
        sheet.columns = [
            { header: 'Location Code', key: 'location_code', width: 15 },
            { header: 'Position Code', key: 'position_code', width: 15 },
            { header: 'Position Name', key: 'position_name', width: 25 },
            { header: 'Zone', key: 'zone', width: 10 },
            { header: 'Coordinates', key: 'coordinates', width: 20 },
            { header: 'Status', key: 'status', width: 12 },
        ];
        // Format header
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0066CC' },
        };
        sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
        // Add data
        result.rows.forEach((loc) => {
            sheet.addRow(loc);
        });
    }
    /**
     * Add Categories sheet
     */
    async addCategoriesSheet(workbook, options) {
        const sheet = workbook.addWorksheet('Categories');
        const result = await this.db.query(`
      SELECT 
        code,
        name,
        description,
        unit_price,
        status
      FROM categories
      WHERE deleted_at IS NULL
      ORDER BY code
    `);
        sheet.columns = [
            { header: 'Code', key: 'code', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'Unit Price', key: 'unit_price', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
        ];
        // Format header
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0066CC' },
        };
        sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
        // Format currency
        sheet.getColumn('unit_price').numFmt = '#,##0.00 VND';
        // Add data
        result.rows.forEach((cat) => {
            sheet.addRow(cat);
        });
    }
    /**
     * Add Orders sheet (registrations + items summary)
     */
    async addOrdersSheet(workbook, options) {
        const sheet = workbook.addWorksheet('Orders');
        const result = await this.db.query(`
      SELECT 
        ar.registration_no,
        ar.status,
        COUNT(ri.id) as item_quantity,
        ar.total_budget,
        u.full_name as requestor,
        ar.created_at
      FROM ad_registrations ar
      LEFT JOIN ad_registration_items ri ON ar.id = ri.registration_id
      LEFT JOIN users u ON ar.created_by = u.id
      WHERE ar.status = 'Đã duyệt'
      GROUP BY ar.id, u.full_name
      ORDER BY ar.created_at DESC
    `);
        sheet.columns = [
            { header: 'Order No', key: 'registration_no', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Item Qty', key: 'item_quantity', width: 10 },
            { header: 'Order Value', key: 'total_budget', width: 15 },
            { header: 'Requestor', key: 'requestor', width: 20 },
            { header: 'Date', key: 'created_at', width: 15 },
        ];
        // Format header
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0066CC' },
        };
        sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
        // Format currency
        sheet.getColumn('total_budget').numFmt = '#,##0.00 VND';
        // Add data
        result.rows.forEach((order) => {
            sheet.addRow({
                ...order,
                created_at: new Date(order.created_at).toLocaleString(),
            });
        });
    }
    /**
     * Generate CSV report
     */
    async generateCsvReport(options) {
        // Convert to CSV by generating Excel first then exporting
        const excel = await this.generateExcelReport(options);
        const csvBuffer = Buffer.from(excel.toString().replace(/\t/g, ','), 'utf-8');
        return csvBuffer;
    }
    /**
     * Generate PDF report
     */
    async generatePdfReport(options) {
        // TODO: Implement PDF generation (requires pdf-lib or similar)
        // For MVP, return placeholder suggesting PDF generation library
        throw new Error('PDF export requires external library. Use Excel or CSV for now.');
    }
}
export default ExportService;
