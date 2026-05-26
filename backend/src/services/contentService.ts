/**
 * Content Service
 * Handles all advertising content operations
 */

import { queryOne, queryAll, query } from '../db/postgres.js';
import { v4 as uuidv4 } from 'uuid';

export interface AdvertisingContent {
  id: string;
  content_code: string;
  content_name: string;
  description?: string;
  category: string;
  unit: string;
  start_date: string;
  end_date: string;
  status: 'Còn hạn' | 'Hết hạn';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContentImage {
  id: string;
  content_id: string;
  image_url: string;
  image_key: string;
  sequence: number;
}

/**
 * Generate next content code (incremental)
 */
async function generateContentCode(): Promise<string> {
  const result = await queryOne<{ max_num?: number }>(
    `SELECT MAX(CAST(SUBSTRING(content_code FROM 3) AS INTEGER)) as max_num 
     FROM advertising_content WHERE content_code LIKE 'CT%'`
  );
  
  const nextNum = (result?.max_num ? parseInt(String(result.max_num)) : 0) + 1;
  return `CT${String(nextNum).padStart(5, '0')}`;
}

/**
 * Calculate status based on dates
 */
function calculateStatus(endDate: string): 'Còn hạn' | 'Hết hạn' {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return today <= end ? 'Còn hạn' : 'Hết hạn';
}

export async function createContent(
  data: {
    content_name: string;
    description?: string;
    category: string;
    unit: string;
    start_date: string;
    end_date: string;
    created_by: string;
  }
): Promise<AdvertisingContent> {
  const id = uuidv4();
  const contentCode = await generateContentCode();
  const status = calculateStatus(data.end_date);
  const now = new Date().toISOString();

  await query(
    `INSERT INTO advertising_content 
     (id, content_code, content_name, description, category, unit, start_date, end_date, status, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      id,
      contentCode,
      data.content_name,
      data.description || null,
      data.category,
      data.unit,
      data.start_date,
      data.end_date,
      status,
      data.created_by,
      now,
      now,
    ]
  );

  return {
    id,
    content_code: contentCode,
    content_name: data.content_name,
    description: data.description,
    category: data.category,
    unit: data.unit,
    start_date: data.start_date,
    end_date: data.end_date,
    status,
    created_by: data.created_by,
    created_at: now,
    updated_at: now,
  };
}

export async function getContentById(id: string): Promise<AdvertisingContent | null> {
  const content = await queryOne<AdvertisingContent>(
    `SELECT * FROM advertising_content WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  
  if (content) {
    content.status = calculateStatus(content.end_date);
  }
  
  return content;
}

export async function listContent(
  limit: number = 25,
  offset: number = 0,
  search?: string
): Promise<{ items: AdvertisingContent[]; total: number }> {
  let whereClause = 'WHERE deleted_at IS NULL';
  const params: any[] = [];

  if (search) {
    whereClause += ` AND (content_name ILIKE $${params.length + 1} OR content_code ILIKE $${params.length + 2})`;
    params.push(`%${search}%`, `%${search}%`);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM advertising_content ${whereClause}`,
    params
  );

  const items = await queryAll<AdvertisingContent>(
    `SELECT * FROM advertising_content ${whereClause} 
     ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  // Recalculate status for all items
  (items as any[]).forEach((item: any) => {
    item.status = calculateStatus(item.end_date);
  });

  return {
    items,
    total: parseInt(countResult?.count || '0'),
  };
}

export async function updateContent(
  id: string,
  data: Partial<AdvertisingContent>
): Promise<AdvertisingContent> {
  const now = new Date().toISOString();
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.content_name) {
    updateFields.push(`content_name = $${paramCount}`);
    values.push(data.content_name);
    paramCount++;
  }
  if (data.description !== undefined) {
    updateFields.push(`description = $${paramCount}`);
    values.push(data.description);
    paramCount++;
  }
  if (data.end_date) {
    updateFields.push(`end_date = $${paramCount}`);
    values.push(data.end_date);
    paramCount++;
  }

  updateFields.push(`updated_at = $${paramCount}`);
  values.push(now);
  paramCount++;

  values.push(id);

  await query(
    `UPDATE advertising_content SET ${updateFields.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL`,
    values
  );

  const updated = await getContentById(id);
  if (!updated) throw new Error('Content not found after update');
  return updated;
}

export async function deleteContent(id: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE advertising_content SET deleted_at = $1 WHERE id = $2`,
    [now, id]
  );
}

export async function addContentImage(
  contentId: string,
  imageUrl: string,
  imageKey: string,
  sequence: number
): Promise<ContentImage> {
  const id = uuidv4();

  await query(
    `INSERT INTO content_images (id, content_id, image_url, image_key, sequence)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, contentId, imageUrl, imageKey, sequence]
  );

  return {
    id,
    content_id: contentId,
    image_url: imageUrl,
    image_key: imageKey,
    sequence,
  };
}

export async function getContentImages(contentId: string): Promise<ContentImage[]> {
  return queryAll<ContentImage>(
    `SELECT * FROM content_images WHERE content_id = $1 ORDER BY sequence ASC`,
    [contentId]
  );
}

export async function deleteContentImage(imageId: string): Promise<void> {
  await query(`DELETE FROM content_images WHERE id = $1`, [imageId]);
}

export async function cloneContent(
  contentId: string,
  createdBy: string
): Promise<AdvertisingContent> {
  const original = await getContentById(contentId);
  if (!original) throw new Error('Content not found');

  const newContent = await createContent({
    content_name: original.content_name,
    description: original.description,
    category: original.category,
    unit: original.unit,
    start_date: original.start_date,
    end_date: original.end_date,
    created_by: createdBy,
  });

  // Clone images
  const images = await getContentImages(contentId);
  for (const image of images) {
    await addContentImage(newContent.id, image.image_url, image.image_key, image.sequence);
  }

  return newContent;
}
