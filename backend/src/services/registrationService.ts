/**
 * Registration Service
 * Handles advertising registration requests and workflow
 */

import { queryOne, queryAll, query, transaction } from '../db/postgres.js';
import { v4 as uuidv4 } from 'uuid';

export interface Registration {
  id: string;
  registration_code: string;
  campaign_name: string;
  department_id: string;
  channel_id: string;
  brand_name: string;
  contact_person: string;
  phone: string;
  email: string;
  budget_total: number;
  total_amount: number;
  workflow_state: string;
  prices_locked_at?: string;
  approved_at?: string;
  deployment_date?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface RegistrationContent {
  id: string;
  registration_id: string;
  content_id: string;
  start_date: string;
  end_date: string;
  quantity: number;
  created_at: string;
}

export interface RegistrationItem {
  id: string;
  registration_id: string;
  item_id: string;
  category_id: string;
  unit_price: number;
  quantity: number;
  total_amount: number;
  created_at: string;
}

/**
 * Generate unique registration code
 */
async function generateRegistrationCode(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM registrations WHERE registration_code LIKE $1`,
    [`${dateStr}%`]
  );
  
  const count = parseInt(result?.count || '0') + 1;
  const seqStr = String(count).padStart(4, '0');
  return `${dateStr}-${seqStr}`;
}

/**
 * Create registration
 */
export async function createRegistration(
  data: {
    campaign_name: string;
    department_id: string;
    channel_id: string;
    brand_name: string;
    contact_person: string;
    phone: string;
    email: string;
    budget_total: number;
    deployment_date?: string;
    notes?: string;
    created_by: string;
  }
): Promise<Registration> {
  const id = uuidv4();
  const code = await generateRegistrationCode();
  const now = new Date().toISOString();

  await query(
    `INSERT INTO registrations 
     (id, registration_code, campaign_name, department_id, channel_id, brand_name, contact_person, phone, email, budget_total, total_amount, workflow_state, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      id, code, data.campaign_name, data.department_id, data.channel_id, data.brand_name,
      data.contact_person, data.phone, data.email, data.budget_total, 0, 'DRAFT',
      data.created_by, now, now
    ]
  );

  return {
    id,
    registration_code: code,
    campaign_name: data.campaign_name,
    department_id: data.department_id,
    channel_id: data.channel_id,
    brand_name: data.brand_name,
    contact_person: data.contact_person,
    phone: data.phone,
    email: data.email,
    budget_total: data.budget_total,
    total_amount: 0,
    workflow_state: 'DRAFT',
    created_by: data.created_by,
    created_at: now,
    updated_at: now,
  };
}

export async function getRegistrationById(id: string): Promise<Registration | null> {
  return queryOne<Registration>(
    `SELECT * FROM registrations WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
}

export async function listRegistrations(
  limit: number = 25,
  offset: number = 0,
  search?: string,
  state?: string,
  departmentId?: string
): Promise<{ items: Registration[]; total: number }> {
  let whereClause = 'WHERE deleted_at IS NULL';
  const params: any[] = [];

  if (search) {
    whereClause += ` AND (campaign_name ILIKE $${params.length + 1} OR registration_code ILIKE $${params.length + 1} OR brand_name ILIKE $${params.length + 1})`;
    params.push(`%${search}%`);
  }
  if (state) {
    whereClause += ` AND workflow_state = $${params.length + 1}`;
    params.push(state);
  }
  if (departmentId) {
    whereClause += ` AND department_id = $${params.length + 1}`;
    params.push(departmentId);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM registrations ${whereClause}`,
    params
  );

  const items = await queryAll<Registration>(
    `SELECT * FROM registrations ${whereClause} ORDER BY created_at DESC 
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    items,
    total: parseInt(countResult?.count || '0'),
  };
}

export async function updateRegistration(
  id: string,
  data: Partial<Registration>
): Promise<Registration> {
  const existing = await getRegistrationById(id);
  if (!existing) throw new Error('Registration not found');
  
  // Cannot edit if in final states
  if (['COMPLETED', 'CANCELLED'].includes(existing.workflow_state)) {
    throw new Error('Cannot edit registration in final state');
  }

  const now = new Date().toISOString();
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  const editableFields = ['campaign_name', 'brand_name', 'contact_person', 'phone', 'email', 'budget_total', 'deployment_date', 'notes'];

  for (const field of editableFields) {
    if (field in data && data[field as keyof Registration] !== undefined) {
      updateFields.push(`${field} = $${paramCount}`);
      values.push(data[field as keyof Registration]);
      paramCount++;
    }
  }

  if (updateFields.length === 0) return existing;

  updateFields.push(`updated_at = $${paramCount}`);
  values.push(now);
  paramCount++;

  values.push(id);

  await query(
    `UPDATE registrations SET ${updateFields.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL`,
    values
  );

  const updated = await getRegistrationById(id);
  if (!updated) throw new Error('Registration not found after update');
  return updated;
}

export async function deleteRegistration(id: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE registrations SET deleted_at = $1 WHERE id = $2`,
    [now, id]
  );
}

/**
 * Add content to registration
 */
export async function addRegistrationContent(
  registrationId: string,
  contentId: string,
  startDate: string,
  endDate: string,
  quantity: number
): Promise<RegistrationContent> {
  const id = uuidv4();
  const now = new Date().toISOString();

  // Validate content exists and not expired
  const content = await queryOne(
    `SELECT * FROM advertising_content WHERE id = $1 AND deleted_at IS NULL`,
    [contentId]
  );
  if (!content) throw new Error('Content not found');

  const contentEndDate = new Date(content.end_date);
  if (contentEndDate < new Date(endDate)) {
    throw new Error('Content expiration date is before requested end date');
  }

  await query(
    `INSERT INTO registration_content (id, registration_id, content_id, start_date, end_date, quantity, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, registrationId, contentId, startDate, endDate, quantity, now]
  );

  return {
    id,
    registration_id: registrationId,
    content_id: contentId,
    start_date: startDate,
    end_date: endDate,
    quantity,
    created_at: now,
  };
}

export async function getRegistrationContent(registrationId: string): Promise<RegistrationContent[]> {
  return queryAll<RegistrationContent>(
    `SELECT * FROM registration_content WHERE registration_id = $1 ORDER BY created_at ASC`,
    [registrationId]
  );
}

export async function removeRegistrationContent(contentId: string): Promise<void> {
  await query(
    `DELETE FROM registration_content WHERE id = $1`,
    [contentId]
  );
}

/**
 * Add item to registration
 */
export async function addRegistrationItem(
  registrationId: string,
  itemId: string,
  categoryId: string,
  quantity: number
): Promise<RegistrationItem> {
  return transaction(async () => {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Get category pricing
    const category = await queryOne<{ unit_price: string }>(
      `SELECT unit_price FROM categories WHERE id = $1`,
      [categoryId]
    );
    if (!category) throw new Error('Category not found');

    const unitPrice = parseFloat(category.unit_price);
    const totalAmount = unitPrice * quantity;

    // Add item
    await query(
      `INSERT INTO registration_items (id, registration_id, item_id, category_id, unit_price, quantity, total_amount, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, registrationId, itemId, categoryId, unitPrice, quantity, totalAmount, now]
    );

    // Update registration total
    const result = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM registration_items WHERE registration_id = $1`,
      [registrationId]
    );

    const newTotal = parseFloat(result?.total || '0');
    await query(
      `UPDATE registrations SET total_amount = $1, updated_at = $2 WHERE id = $3`,
      [newTotal, now, registrationId]
    );

    return {
      id,
      registration_id: registrationId,
      item_id: itemId,
      category_id: categoryId,
      unit_price: unitPrice,
      quantity,
      total_amount: totalAmount,
      created_at: now,
    };
  });
}

export async function getRegistrationItems(registrationId: string): Promise<RegistrationItem[]> {
  return queryAll<RegistrationItem>(
    `SELECT * FROM registration_items WHERE registration_id = $1 ORDER BY created_at ASC`,
    [registrationId]
  );
}

export async function removeRegistrationItem(itemId: string, registrationId: string): Promise<void> {
  return transaction(async () => {
    const now = new Date().toISOString();

    await query(
      `DELETE FROM registration_items WHERE id = $1`,
      [itemId]
    );

    // Recalculate registration total
    const result = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM registration_items WHERE registration_id = $1`,
      [registrationId]
    );

    const newTotal = parseFloat(result?.total || '0');
    await query(
      `UPDATE registrations SET total_amount = $1, updated_at = $2 WHERE id = $3`,
      [newTotal, now, registrationId]
    );
  });
}

/**
 * Validate budget constraint
 */
export async function validateBudget(registrationId: string): Promise<{ valid: boolean; totalAmount: number; budget: number; message?: string }> {
  const registration = await getRegistrationById(registrationId);
  if (!registration) throw new Error('Registration not found');

  if (registration.total_amount > registration.budget_total) {
    return {
      valid: false,
      totalAmount: registration.total_amount,
      budget: registration.budget_total,
      message: `Tổng chi phí (${registration.total_amount}) vượt quá ngân sách (${registration.budget_total})`,
    };
  }

  return {
    valid: true,
    totalAmount: registration.total_amount,
    budget: registration.budget_total,
  };
}

/**
 * Validate all items are actionable (ACTIVE status)
 */
export async function validateAllItemsActionable(registrationId: string): Promise<{ valid: boolean; inactiveCount: number }> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM registration_items ri
     JOIN physical_items pi ON pi.id = ri.item_id
     WHERE ri.registration_id = $1 AND pi.status != 'ACTIVE'`,
    [registrationId]
  );

  const inactiveCount = parseInt(result?.count || '0');
  return {
    valid: inactiveCount === 0,
    inactiveCount,
  };
}

/**
 * Lock prices when transitioning to BRAND_MANAGER_APPROVAL
 */
export async function lockPrices(registrationId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE registrations SET prices_locked_at = $1, updated_at = $2 WHERE id = $3`,
    [now, now, registrationId]
  );
}

/**
 * Get registration with all details
 */
export async function getRegistrationDetails(
  registrationId: string
): Promise<{
  registration: Registration;
  content: RegistrationContent[];
  items: RegistrationItem[];
} | null> {
  const registration = await getRegistrationById(registrationId);
  if (!registration) return null;

  const content = await getRegistrationContent(registrationId);
  const items = await getRegistrationItems(registrationId);

  return { registration, content, items };
}
