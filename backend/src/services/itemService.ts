/**
 * Physical Item Service
 * Handles physical advertising item management
 */

import { queryOne, queryAll, query, transaction } from '../db/postgres.js';
import { v4 as uuidv4 } from 'uuid';

export interface PhysicalItem {
  id: string;
  item_code: string;
  item_name: string;
  location_id: string;
  category_id: string;
  channel_id: string;
  seq_no?: number;
  width?: number;
  length?: number;
  unit_price?: number;
  description?: string;
  image_key?: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Generate next sequence number for position + category
 */
async function getNextSequence(locationId: string, categoryId: string): Promise<number> {
  const result = await queryOne<{ max_seq: number }>(
    `SELECT COALESCE(MAX(seq_no), 0)::int AS max_seq FROM physical_items WHERE category_id = $1 AND location_id = $2`,
    [categoryId, locationId]
  );
  return (result?.max_seq ?? 0) + 1;
}

/**
 * Generate item code and name
 */
async function generateItemCodeAndName(
  locationId: string,
  categoryId: string,
  sequenceNum: number,
  positionCode: string,
  categoryCode: string,
  categoryName: string,
  positionName: string
): Promise<{ code: string; name: string }> {
  const seqStr = String(sequenceNum).padStart(3, '0');
  const code = `${positionCode}.${categoryCode}.${seqStr}`;
  const name = `${categoryName} ${positionName} ${seqStr}`;
  
  return { code, name };
}

/**
 * Create a single physical item
 */
async function createSingleItem(
  data: {
    item_code: string;
    item_name: string;
    location_id: string;
    category_id: string;
    channel_id: string;
    seq_no: number;
    width?: number;
    length?: number;
    unit_price?: number;
    description?: string;
    image_key?: string;
    created_by: string;
  }
): Promise<PhysicalItem> {
  const id = uuidv4();
  const now = new Date().toISOString();

  await query(
    `INSERT INTO physical_items(id, channel_id, category_id, location_id, seq_no, item_code, item_name, width, length, unit_price, image_key, description, status, created_by, updated_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14, $15, $15)`,
    [
      id, data.channel_id, data.category_id, data.location_id, data.seq_no,
      data.item_code, data.item_name,
      data.width ?? 0, data.length ?? 0,
      data.unit_price ?? 0,
      data.image_key ?? null, data.description ?? null,
      'ACTIVE', data.created_by, now
    ]
  );

  return {
    id,
    item_code: data.item_code,
    item_name: data.item_name,
    location_id: data.location_id,
    category_id: data.category_id,
    channel_id: data.channel_id,
    seq_no: data.seq_no,
    width: data.width,
    length: data.length,
    unit_price: data.unit_price,
    description: data.description,
    image_key: data.image_key,
    status: 'ACTIVE',
    created_by: data.created_by,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Batch create items
 */
export async function batchCreateItems(
  items: {
    location_id: string;
    category_id: string;
    channel_id: string;
    width?: number;
    length?: number;
    unit_price?: number;
    description?: string;
    image_key?: string;
  }[],
  createdBy: string,
  positionCode: string,
  categoryCode: string,
  categoryName: string,
  positionName: string
): Promise<PhysicalItem[]> {
  return transaction(async () => {
    const result: PhysicalItem[] = [];
    let sequenceNum = await getNextSequence(items[0].location_id, items[0].category_id);

    for (const item of items) {
      const { code, name } = await generateItemCodeAndName(
        item.location_id,
        item.category_id,
        sequenceNum,
        positionCode,
        categoryCode,
        categoryName,
        positionName
      );

      const created = await createSingleItem({
        ...item,
        item_code: code,
        item_name: name,
        seq_no: sequenceNum,
        created_by: createdBy,
      });

      result.push(created);
      sequenceNum++;
    }

    return result;
  });
}

export async function getItemById(id: string): Promise<PhysicalItem | null> {
  return queryOne<PhysicalItem>(
    `SELECT * FROM physical_items WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
}

export async function listItems(
  limit: number = 25,
  offset: number = 0,
  search?: string,
  categoryId?: string,
  channelId?: string,
  locationId?: string,
  status?: string
): Promise<{ items: PhysicalItem[]; total: number }> {
  let whereClause = 'WHERE deleted_at IS NULL';
  const params: any[] = [];

  if (search) {
    whereClause += ` AND item_name ILIKE $${params.length + 1}`;
    params.push(`%${search}%`);
  }
  if (categoryId) {
    whereClause += ` AND category_id = $${params.length + 1}`;
    params.push(categoryId);
  }
  if (channelId) {
    whereClause += ` AND channel_id = $${params.length + 1}`;
    params.push(channelId);
  }
  if (locationId) {
    whereClause += ` AND location_id = $${params.length + 1}`;
    params.push(locationId);
  }
  if (status) {
    whereClause += ` AND status = $${params.length + 1}`;
    params.push(status);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM physical_items ${whereClause}`,
    params
  );

  const items = await queryAll<PhysicalItem>(
    `SELECT * FROM physical_items ${whereClause} ORDER BY item_code ASC 
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    items,
    total: parseInt(countResult?.count || '0'),
  };
}

export async function updateItem(
  id: string,
  data: Partial<PhysicalItem>
): Promise<PhysicalItem> {
  const existing = await getItemById(id);
  if (!existing) throw new Error('Item not found');
  if (existing.status === 'TREO') throw new Error('Cannot edit items with status TREO');

  const now = new Date().toISOString();
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  const editableFields = ['width', 'length', 'unit_price', 'description', 'image_key', 'status'];

  for (const field of editableFields) {
    if (field in data && data[field as keyof PhysicalItem] !== undefined) {
      updateFields.push(`${field} = $${paramCount}`);
      values.push(data[field as keyof PhysicalItem]);
      paramCount++;
    }
  }

  if (updateFields.length === 0) return existing;

  updateFields.push(`updated_at = $${paramCount}`);
  values.push(now);
  paramCount++;

  values.push(id);

  await query(
    `UPDATE physical_items SET ${updateFields.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL`,
    values
  );

  const updated = await getItemById(id);
  if (!updated) throw new Error('Item not found after update');
  return updated;
}

export async function deleteItem(id: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE physical_items SET deleted_at = $1 WHERE id = $2`,
    [now, id]
  );
}

/**
 * Propagate status from parent to items
 */
export async function propagateStatusFromParent(
  categoryId?: string,
  locationId?: string
): Promise<void> {
  const now = new Date().toISOString();

  if (categoryId) {
    // Get category status
    const category = await queryOne<{ status: string }>(
      `SELECT status FROM categories WHERE id = $1`,
      [categoryId]
    );

    if (category?.status === 'INACTIVE') {
      // Set items to inactive if category is inactive
      await query(
        `UPDATE physical_items SET status = 'INACTIVE', updated_at = $1
         WHERE category_id = $2 AND status = 'ACTIVE'`,
        [now, categoryId]
      );
    }
  }

  if (locationId) {
    // Get location status
    const location = await queryOne<{ status: string }>(
      `SELECT status FROM locations WHERE id = $1`,
      [locationId]
    );

    if (location?.status === 'INACTIVE') {
      // Set items to inactive if location is inactive
      await query(
        `UPDATE physical_items SET status = 'INACTIVE', updated_at = $1
         WHERE location_id = $2 AND status = 'ACTIVE'`,
        [now, locationId]
      );
    }
  }
}

/**
 * Check if item status is valid based on parents
 */
export async function validateItemStatus(itemId: string): Promise<boolean> {
  const item = await getItemById(itemId);
  if (!item) return false;

  // Get parent statuses
  const category = await queryOne<{ status: string }>(
    `SELECT status FROM categories WHERE id = $1`,
    [item.category_id]
  );

  const location = await queryOne<{ status: string }>(
    `SELECT status FROM locations WHERE id = $1`,
    [item.location_id]
  );

  // Item can only be ACTIVE if both parents are ACTIVE
  if (item.status === 'ACTIVE' && category?.status === 'INACTIVE') return false;
  if (item.status === 'ACTIVE' && location?.status === 'INACTIVE') return false;

  return true;
}

export async function getItemsByLocation(locationId: string): Promise<PhysicalItem[]> {
  return queryAll<PhysicalItem>(
    `SELECT * FROM physical_items WHERE location_id = $1 AND deleted_at IS NULL ORDER BY item_code ASC`,
    [locationId]
  );
}
