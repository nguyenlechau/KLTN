/**
 * Category Service
 * Handles category management
 */
import { queryOne, queryAll, query } from '../db/postgres.js';
import { v4 as uuidv4 } from 'uuid';
export async function createCategory(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    // Check uniqueness
    const existing = await queryOne(`SELECT id FROM categories WHERE code = $1 OR name = $2`, [data.code, data.name]);
    if (existing)
        throw new Error('Category code or name already exists');
    await query(`INSERT INTO categories (id, code, name, format, description, unit_price, unit_of_measure, status, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
        id, data.code, data.name, data.format || null, data.description || null, data.unit_price,
        data.unit_of_measure || null, data.status, data.created_by, now, now
    ]);
    return { ...data, id, created_at: now, updated_at: now };
}
export async function getCategoryById(id) {
    return queryOne(`SELECT * FROM categories WHERE id = $1 AND deleted_at IS NULL`, [id]);
}
export async function getCategoryByCode(code) {
    return queryOne(`SELECT * FROM categories WHERE code = $1 AND deleted_at IS NULL`, [code]);
}
export async function listCategories(limit = 25, offset = 0, search, format, status) {
    let whereClause = 'WHERE deleted_at IS NULL';
    const params = [];
    if (search) {
        whereClause += ` AND name ILIKE $${params.length + 1}`;
        params.push(`%${search}%`);
    }
    // Skip format filter since column doesn't exist in database
    // if (format) {
    //   whereClause += ` AND format = $${params.length + 1}`;
    //   params.push(format);
    // }
    if (status) {
        whereClause += ` AND status = $${params.length + 1}`;
        params.push(status);
    }
    const countResult = await queryOne(`SELECT COUNT(*) as count FROM categories ${whereClause}`, params);
    const items = await queryAll(`SELECT * FROM categories ${whereClause} ORDER BY code ASC 
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
    return {
        items,
        total: parseInt(countResult?.count || '0'),
    };
}
export async function updateCategory(id, data) {
    const now = new Date().toISOString();
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    const editableFields = ['format', 'description', 'unit_price', 'unit_of_measure', 'status'];
    for (const field of editableFields) {
        if (field in data && data[field] !== undefined) {
            updateFields.push(`${field} = $${paramCount}`);
            values.push(data[field]);
            paramCount++;
        }
    }
    if (updateFields.length === 0)
        return await getCategoryById(id);
    updateFields.push(`updated_at = $${paramCount}`);
    values.push(now);
    paramCount++;
    values.push(id);
    await query(`UPDATE categories SET ${updateFields.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL`, values);
    const updated = await getCategoryById(id);
    if (!updated)
        throw new Error('Category not found after update');
    return updated;
}
export async function deleteCategory(id) {
    const now = new Date().toISOString();
    await query(`UPDATE categories SET deleted_at = $1 WHERE id = $2`, [now, id]);
}
/**
 * Check if category can be deactivated
 */
export async function canDeactivateCategory(categoryId) {
    const result = await queryOne(`SELECT COUNT(*) as count FROM physical_items 
     WHERE category_id = $1 AND status = 'TREO' AND deleted_at IS NULL`, [categoryId]);
    const treoCount = parseInt(result?.count || '0');
    return {
        can: treoCount === 0,
        itemCount: treoCount,
    };
}
/**
 * Deactivate all items in category
 */
export async function deactivateCategoryItems(categoryId) {
    const now = new Date().toISOString();
    await query(`UPDATE physical_items SET status = 'INACTIVE', updated_at = $1 
     WHERE category_id = $2 AND status = 'ACTIVE' AND deleted_at IS NULL`, [now, categoryId]);
}
/**
 * Update price and recalculate affected registrations
 */
export async function updateCategoryPrice(categoryId, newPrice) {
    const category = await getCategoryById(categoryId);
    if (!category)
        throw new Error('Category not found');
    // Update category price
    const now = new Date().toISOString();
    await query(`UPDATE categories SET unit_price = $1, updated_at = $2 WHERE id = $3`, [newPrice, now, categoryId]);
    // Recalculate totals for registrations in approval phase (not past manager approval)
    const affectedResult = await queryOne(`SELECT COUNT(DISTINCT ri.registration_id) as count FROM registration_items ri
     JOIN registrations r ON r.id = ri.registration_id
     WHERE ri.category_id = $1 
     AND r.workflow_state IN ('DRAFT', 'SUPERVISOR_REVIEW', 'BRAND_ACCEPTANCE', 'BRAND_MANAGER_APPROVAL')
     AND r.prices_locked_at IS NULL`, [categoryId]);
    const affectedCount = parseInt(affectedResult?.count || '0');
    // Update registration_items totals
    await query(`UPDATE registration_items SET 
       unit_price = $1,
       total_amount = quantity * $1
     WHERE category_id = $2
     AND registration_id IN (
       SELECT id FROM registrations 
       WHERE workflow_state IN ('DRAFT', 'SUPERVISOR_REVIEW', 'BRAND_ACCEPTANCE', 'BRAND_MANAGER_APPROVAL')
       AND prices_locked_at IS NULL
     )`, [newPrice, categoryId]);
    // Recalculate registration totals
    await query(`UPDATE registrations SET 
       total_amount = (SELECT COALESCE(SUM(total_amount), 0) FROM registration_items WHERE registration_id = registrations.id),
       updated_at = $1
     WHERE id IN (
       SELECT DISTINCT ri.registration_id FROM registration_items ri
       WHERE ri.category_id = $2
     )`, [now, categoryId]);
    const updated = await getCategoryById(categoryId);
    return {
        updated,
        affectedRegistrations: affectedCount,
    };
}
