/**
 * API Services for KLTN Frontend
 * Provides all API interactions with backend
 */

import { apiFetch } from './client.js';

// ============================================================
// TYPES
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  ok: boolean;
  data?: {
    token: string;
    user: User;
  };
  error?: string;
}

export interface Content {
  id: string;
  content_code: string;
  content_name: string;
  category: string;
  unit: string;
  start_date: string;
  end_date: string;
  status: string;
  description?: string;
  images?: ContentImage[];
}

export interface ContentImage {
  id: string;
  image_url: string;
  image_key?: string;
  sequence?: number;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  province?: string;
  sub_district?: string;
  classification?: string;
  channels?: string[];
  csm_name?: string;
  csm_email?: string;
  csm_phone?: string;
  address_line?: string;
  latitude?: number | null;
  longitude?: number | null;
  note?: string;
  status: string;
  // Legacy fields kept for backward compatibility
  position_code?: string;
  position_name?: string;
  channel_id?: string;
  province_city?: string;
  zone?: string;
  address?: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  format: string;
  unit_price: number;
  unit_of_measure: string;
  status: string;
}

export interface Channel {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: string;
  location_id?: string;
}

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
}

export interface Registration {
  id: string;
  registration_code: string;
  campaign_name: string;
  brand_name: string;
  contact_person: string;
  phone: string;
  email: string;
  budget_total: number;
  total_amount: number;
  workflow_state: string;
  department_id?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface RegistrationDetail {
  registration: Registration;
  content: any[];
  items: any[];
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ============================================================
// AUTH API
// ============================================================

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ============================================================
// CONTENT API
// ============================================================

export async function getContentList(
  limit = 25,
  offset = 0,
  search?: string
): Promise<{ ok: boolean; data: Content[]; pagination: any }> {
  const params = new URLSearchParams();
  params.append('limit', String(limit));
  params.append('offset', String(offset));
  if (search) params.append('search', search);

  return apiFetch(`/v1/content?${params}`);
}

export async function getContentById(id: string): Promise<{ ok: boolean; data: Content }> {
  return apiFetch(`/v1/content/${id}`);
}

export async function createContent(data: any): Promise<{ ok: boolean; data: Content }> {
  return apiFetch('/v1/content', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContent(id: string, data: any): Promise<{ ok: boolean; data: Content }> {
  return apiFetch(`/v1/content/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteContent(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/v1/content/${id}`, {
    method: 'DELETE',
  });
}

export async function cloneContent(id: string): Promise<{ ok: boolean; data: Content }> {
  return apiFetch(`/v1/content/${id}/clone`, {
    method: 'POST',
  });
}

export async function addContentImage(
  contentId: string,
  imageUrl: string,
  imageKey?: string
): Promise<{ ok: boolean; data: any }> {
  return apiFetch(`/v1/content/${contentId}/images`, {
    method: 'POST',
    body: JSON.stringify({ image_url: imageUrl, image_key: imageKey }),
  });
}

// ============================================================
// LOCATION API
// ============================================================

export async function getLocationList(
  limit = 25,
  offset = 0,
  search?: string,
  channelId?: string,
  status?: string
): Promise<{ ok: boolean; data: Location[]; pagination: any }> {
  const params = new URLSearchParams();
  params.append('limit', String(limit));
  params.append('offset', String(offset));
  if (search) params.append('search', search);
  if (channelId) params.append('channelId', channelId);
  if (status) params.append('status', status);

  return apiFetch(`/v1/locations?${params}`);
}

export async function getLocationById(id: string): Promise<{ ok: boolean; data: Location }> {
  return apiFetch(`/v1/locations/${id}`);
}

export async function createLocation(data: any): Promise<{ ok: boolean; data: Location }> {
  return apiFetch('/v1/locations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLocation(id: string, data: any): Promise<{ ok: boolean; data: Location }> {
  return apiFetch(`/v1/locations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteLocation(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/v1/locations/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// CATEGORY API
// ============================================================

export async function getCategoryList(
  limit = 25,
  offset = 0,
  search?: string,
  format?: string,
  status?: string
): Promise<{ ok: boolean; data: Category[]; pagination: any }> {
  const params = new URLSearchParams();
  params.append('limit', String(limit));
  params.append('offset', String(offset));
  if (search) params.append('search', search);
  if (format) params.append('format', format);
  if (status) params.append('status', status);

  return apiFetch(`/v1/categories?${params}`);
}

export async function getCategoryById(id: string): Promise<{ ok: boolean; data: Category }> {
  return apiFetch(`/v1/categories/${id}`);
}

export async function createCategory(data: any): Promise<{ ok: boolean; data: Category }> {
  return apiFetch('/v1/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategory(id: string, data: any): Promise<{ ok: boolean; data: Category }> {
  return apiFetch(`/v1/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/v1/categories/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// CHANNEL API
// ============================================================

export async function getChannelList(): Promise<{ ok: boolean; data: Channel[] }> {
  return apiFetch('/v1/channels');
}

// ============================================================
// ITEM API
// ============================================================

export async function getItemList(
  limit = 25,
  offset = 0,
  search?: string,
  categoryId?: string,
  locationId?: string,
  status?: string
): Promise<{ ok: boolean; data: PhysicalItem[]; pagination: any }> {
  const params = new URLSearchParams();
  params.append('limit', String(limit));
  params.append('offset', String(offset));
  if (search) params.append('search', search);
  if (categoryId) params.append('categoryId', categoryId);
  if (locationId) params.append('locationId', locationId);
  if (status) params.append('status', status);

  return apiFetch(`/v1/items?${params}`);
}

export async function getItemById(id: string): Promise<{ ok: boolean; data: PhysicalItem }> {
  return apiFetch(`/v1/items/${id}`);
}

export async function batchCreateItems(
  items: any[],
  positionCode: string,
  categoryCode: string,
  categoryName: string,
  positionName: string
): Promise<{ ok: boolean; data: PhysicalItem[] }> {
  return apiFetch('/v1/items/batch-create', {
    method: 'POST',
    body: JSON.stringify({
      items,
      position_code: positionCode,
      category_code: categoryCode,
      category_name: categoryName,
      position_name: positionName,
    }),
  });
}

export async function updateItem(id: string, data: any): Promise<{ ok: boolean; data: PhysicalItem }> {
  return apiFetch(`/v1/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteItem(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/v1/items/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// REGISTRATION API
// ============================================================

export async function getRegistrationList(
  limit = 25,
  offset = 0,
  search?: string,
  state?: string,
  departmentId?: string
): Promise<{ ok: boolean; data: Registration[]; pagination: any }> {
  const params = new URLSearchParams();
  params.append('limit', String(limit));
  params.append('offset', String(offset));
  if (search) params.append('search', search);
  if (state) params.append('state', state);
  if (departmentId) params.append('departmentId', departmentId);

  return apiFetch(`/v1/registrations?${params}`);
}

export async function getRegistrationById(id: string): Promise<{ ok: boolean; data: RegistrationDetail }> {
  return apiFetch(`/v1/registrations/${id}`);
}

export async function createRegistration(data: any): Promise<{ ok: boolean; data: Registration }> {
  return apiFetch('/v1/registrations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRegistration(
  id: string,
  data: any
): Promise<{ ok: boolean; data: Registration }> {
  return apiFetch(`/v1/registrations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRegistration(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/v1/registrations/${id}`, {
    method: 'DELETE',
  });
}

export async function addRegistrationContent(
  registrationId: string,
  contentId: string,
  startDate: string,
  endDate: string,
  quantity: number
): Promise<{ ok: boolean; data: any }> {
  return apiFetch(`/v1/registrations/${registrationId}/content`, {
    method: 'POST',
    body: JSON.stringify({
      content_id: contentId,
      start_date: startDate,
      end_date: endDate,
      quantity,
    }),
  });
}

export async function removeRegistrationContent(contentId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/v1/registrations/content/${contentId}`, {
    method: 'DELETE',
  });
}

export async function addRegistrationItem(
  registrationId: string,
  itemId: string,
  categoryId: string,
  quantity: number
): Promise<{ ok: boolean; data: any }> {
  return apiFetch(`/v1/registrations/${registrationId}/items`, {
    method: 'POST',
    body: JSON.stringify({
      item_id: itemId,
      category_id: categoryId,
      quantity,
    }),
  });
}

export async function removeRegistrationItem(
  registrationId: string,
  itemId: string
): Promise<{ ok: boolean }> {
  return apiFetch(`/v1/registrations/${registrationId}/items/${itemId}`, {
    method: 'DELETE',
  });
}

export async function validateRegistration(id: string): Promise<any> {
  return apiFetch(`/v1/registrations/${id}/validate`);
}

// ============================================================
// WORKFLOW API
// ============================================================

export async function getWorkflowStates(): Promise<{ ok: boolean; data: any[] }> {
  return apiFetch('/v1/workflow/states');
}

export async function getRegistrationWorkflow(id: string): Promise<{ ok: boolean; data: any }> {
  return apiFetch(`/v1/registrations/${id}/workflow`);
}

export async function transitionRegistration(
  id: string,
  toState: string,
  reason?: string
): Promise<{ ok: boolean; data: any }> {
  return apiFetch(`/v1/registrations/${id}/transition`, {
    method: 'POST',
    body: JSON.stringify({ to_state: toState, reason }),
  });
}

export async function getAvailableTransitions(id: string): Promise<{ ok: boolean; data: any[] }> {
  return apiFetch(`/v1/registrations/${id}/available-transitions`);
}
