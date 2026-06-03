/**
 * Location Service
 * Handles location/position management
 */

import { queryOne, queryAll, query } from '../db/postgres.js';
import { v4 as uuidv4 } from 'uuid';

export interface Location {
  id: string;
  channel_id: string;
  code: string;
  name: string;
  position_code?: string;
  position_name?: string;
  province_city?: string;
  zone?: string;
  address?: string;
  address_line?: string;
  classification?: string;
  latitude?: number;
  longitude?: number;
  representative_1_name?: string;
  representative_1_email?: string;
  representative_1_phone?: string;
  representative_2_name?: string;
  representative_2_email?: string;
  representative_2_phone?: string;
  note?: string;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export async function createLocation(
  data: Omit<Location, 'id' | 'created_at' | 'updated_at'>
): Promise<Location> {
  const id = uuidv4();
  const now = new Date().toISOString();

  // Check uniqueness of position_code within channel
  const existing = await queryOne(
    `SELECT id FROM locations WHERE position_code = $1 AND channel_id = $2 AND deleted_at IS NULL`,
    [data.position_code, data.channel_id]
  );
  if (existing) throw new Error('Position code already exists in this channel');

  await query(
    `INSERT INTO locations 
     (id, position_code, channel_id, position_name, province_city, zone, address, 
      classification, longitude, latitude, representative_1_name, representative_1_email,
      representative_1_phone, representative_2_name, representative_2_email, representative_2_phone,
      status, note, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
    [
      id, data.position_code || null, data.channel_id, data.position_name || null, data.province_city || null, data.zone || null,
      data.address || null, data.classification || null, data.longitude || null, data.latitude || null,
      data.representative_1_name || null, data.representative_1_email || null, data.representative_1_phone || null,
      data.representative_2_name || null, data.representative_2_email || null, data.representative_2_phone || null,
      data.status, data.note || null, data.created_by, now, now
    ]
  );

  return { ...data, id, created_at: now, updated_at: now };
}

export async function getLocationById(id: string): Promise<Location | null> {
  return queryOne<Location>(
    `SELECT * FROM locations WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
}

export async function listLocations(
  limit: number = 25,
  offset: number = 0,
  search?: string,
  channelId?: string,
  status?: string
): Promise<{ items: Location[]; total: number }> {
  let whereClause = 'WHERE deleted_at IS NULL';
  const params: any[] = [];

  if (search) {
    whereClause += ` AND position_name ILIKE $${params.length + 1}`;
    params.push(`%${search}%`);
  }
  if (channelId) {
    whereClause += ` AND channel_id = $${params.length + 1}`;
    params.push(channelId);
  }
  if (status) {
    whereClause += ` AND status = $${params.length + 1}`;
    params.push(status);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM locations ${whereClause}`,
    params
  );

  const items = await queryAll<Location>(
    `SELECT * FROM locations ${whereClause} ORDER BY position_code ASC 
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    items,
    total: parseInt(countResult?.count || '0'),
  };
}

export async function updateLocation(
  id: string,
  data: Partial<Location>
): Promise<Location> {
  const now = new Date().toISOString();
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  const editableFields = [
    'position_name', 'province_city', 'zone', 'address', 'classification',
    'longitude', 'latitude', 'representative_1_name', 'representative_1_email',
    'representative_1_phone', 'representative_2_name', 'representative_2_email',
    'representative_2_phone', 'status', 'note', 'channels'
  ];

  for (const field of editableFields) {
    if (field in data && data[field as keyof Location] !== undefined) {
      updateFields.push(`${field} = $${paramCount}`);
      values.push(data[field as keyof Location]);
      paramCount++;
    }
  }

  if (updateFields.length === 0) return await getLocationById(id) as Location;

  updateFields.push(`updated_at = $${paramCount}`);
  values.push(now);
  paramCount++;

  values.push(id);

  await query(
    `UPDATE locations SET ${updateFields.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL`,
    values
  );

  const updated = await getLocationById(id);
  if (!updated) throw new Error('Location not found after update');
  return updated;
}

export async function deleteLocation(id: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE locations SET deleted_at = $1 WHERE id = $2`,
    [now, id]
  );
}

export async function getLocationsByChannel(channelId: string): Promise<Location[]> {
  return queryAll<Location>(
    `SELECT * FROM locations WHERE channel_id = $1 AND status = 'ACTIVE' AND deleted_at IS NULL 
     ORDER BY position_code ASC`,
    [channelId]
  );
}

/**
 * Check if location can be deactivated
 */
export async function canDeactivateLocation(locationId: string): Promise<{ can: boolean; itemCount: number }> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM physical_items 
     WHERE location_id = $1 AND status = 'TREO' AND deleted_at IS NULL`,
    [locationId]
  );

  const treoCount = parseInt(result?.count || '0');
  return {
    can: treoCount === 0,
    itemCount: treoCount,
  };
}

/**
 * Deactivate all items at location
 */
export async function deactivateLocationItems(locationId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE physical_items SET status = 'INACTIVE', updated_at = $1 
     WHERE location_id = $2 AND status = 'ACTIVE' AND deleted_at IS NULL`,
    [now, locationId]
  );
}
