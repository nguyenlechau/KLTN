// In-memory mock database for testing without PostgreSQL
import crypto from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export interface MockUser {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  deleted_at: string | null;
}

export interface MockChannel {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category_id?: string | null;
  location_id?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface MockCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit_price: number;
  unit_of_measure?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface MockLocation {
  id: string;
  code: string;
  name: string;
  classification?: string | null;
  province?: string | null;
  sub_district?: string | null;
  address_line: string | null;
  latitude: number | null;
  longitude: number | null;
  channels?: string[];
  csm_name?: string | null;
  csm_email?: string | null;
  csm_phone?: string | null;
  note?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface MockContent {
  id: string;
  channel_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  image_keys: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface MockPhysicalItem {
  id: string;
  channel_id: string;
  category_id: string;
  location_id: string;
  seq_no: number;
  item_code: string;
  item_name: string;
  width: string;
  length: string;
  unit_price?: number;
  image_key: string | null;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface MockRegistration {
  id: string;
  registration_no: string;
  campaign_name: string;
  campaign_description: string | null;
  budget_estimate: string | number;
  start_date: string;
  end_date: string;
  document_key: string | null;
  representative_name: string | null;
  representative_phone: string | null;
  content_id: string | null;
  status: string;
  created_by: string;
  updated_by: string;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockRegistrationItem {
  id: string;
  registration_id: string;
  physical_item_id: string;
  unit_price: string | number;
  quantity: number;
  note?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface MockMenu {
  id: string;
  code: string;
  name: string;
  label: string | null;
  icon: string | null;
  order_position: number;
  parent_id: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

function generateId(): string {
  return crypto.randomBytes(8).toString('hex');
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

class MockDatabase {
  private users: Map<string, MockUser> = new Map();
  private channels: Map<string, MockChannel> = new Map();
  private categories: Map<string, MockCategory> = new Map();
  private locations: Map<string, MockLocation> = new Map();
  private contents: Map<string, MockContent> = new Map();
  private contentImages: any[] = [];
  private physicalItems: Map<string, any> = new Map();
  private menus: Map<string, MockMenu> = new Map();
  private registrations: Map<string, any> = new Map();
  private registrationItems: Map<string, any> = new Map();
  private auditLogs: any[] = [];
  private workflowApprovals: any[] = [];

  private getLegacySeedRegistrations() {
    const now = new Date().toISOString();
    return [
      {
        id: '1',
        registration_code: 'REG-001',
        campaign_name: 'Summer Campaign 2024',
        department_id: 'MARKETING',
        channel_id: Array.from(this.channels.values())[0]?.id ?? 'CH-1',
        brand_name: 'Brand A',
        contact_person: 'Requester User',
        phone: '0900000001',
        email: 'requester@example.com',
        budget_total: 50000000,
        total_amount: 0,
        workflow_state: 'APPROVED',
        created_by: Array.from(this.users.values())[0]?.id ?? 'U-1',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: '2',
        registration_code: 'REG-002',
        campaign_name: 'Autumn Promotion',
        department_id: 'MARKETING',
        channel_id: Array.from(this.channels.values())[0]?.id ?? 'CH-1',
        brand_name: 'Brand B',
        contact_person: 'Requester User',
        phone: '0900000002',
        email: 'requester@example.com',
        budget_total: 75000000,
        total_amount: 0,
        workflow_state: 'SUPERVISOR_REVIEW',
        created_by: Array.from(this.users.values())[0]?.id ?? 'U-1',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: '3',
        registration_code: 'REG-003',
        campaign_name: 'Winter Special',
        department_id: 'MARKETING',
        channel_id: Array.from(this.channels.values())[0]?.id ?? 'CH-1',
        brand_name: 'Brand C',
        contact_person: 'Requester User',
        phone: '0900000003',
        email: 'requester@example.com',
        budget_total: 100000000,
        total_amount: 0,
        workflow_state: 'DRAFT',
        created_by: Array.from(this.users.values())[0]?.id ?? 'U-1',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ];
  }

  constructor() {
    const adminId = generateId();
    this.seedTestAccounts(adminId);
    this.seedMasterData(adminId);
  }

  private seedTestAccounts(adminId: string) {
    const testAccounts = [
      { email: 'admin@example.com', fullName: 'Admin User', password: 'password', role: 'ADMIN' },
      { email: 'requester@example.com', fullName: 'Requester User', password: 'password', role: 'REQUESTER' },
      { email: 'central-requester@example.com', fullName: 'Central Requester', password: 'password', role: 'CENTRAL_REQUESTER' },
      { email: 'supervisor@example.com', fullName: 'Supervisor User', password: 'password', role: 'SUPERVISOR' },
      { email: 'central-supervisor@example.com', fullName: 'Central Supervisor', password: 'password', role: 'CENTRAL_SUPERVISOR' },
      { email: 'operations-specialist@example.com', fullName: 'Operations Specialist', password: 'password', role: 'OPERATIONS_SPECIALIST' },
      { email: 'operations-manager@example.com', fullName: 'Operations Manager', password: 'password', role: 'OPERATIONS_MANAGER' },
    ];

    testAccounts.forEach(account => {
      const id = generateId();
      const user: MockUser = {
        id,
        email: account.email.toLowerCase(),
        full_name: account.fullName,
        password_hash: hashPassword(account.password),
        role: account.role,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        deleted_at: null,
      };
      this.users.set(id, user);
    });

    console.log('[MockDB] Seeded', this.users.size, 'test accounts');
  }

  private seedMasterData(adminId: string) {
    const readSeedJson = <T>(relativePaths: string[]): T => {
      for (const relativePath of relativePaths) {
        const absolutePath = resolve(process.cwd(), relativePath);
        if (existsSync(absolutePath)) {
          return JSON.parse(readFileSync(absolutePath, 'utf8')) as T;
        }
      }
      throw new Error(`Unable to load seed file: ${relativePaths.join(', ')}`);
    };

    // Seed Channels
    const channels = [
      { code: 'CN', name: 'CN', description: 'Chi nhánh' },
      { code: 'AF', name: 'AF', description: 'Affiliate' },
      { code: 'SME', name: 'SME', description: 'Doanh nghiệp vừa và nhỏ' },
      { code: 'OOH', name: 'OOH', description: 'Out-of-home' },
      { code: 'HO', name: 'HO', description: 'Hội sở' },
      { code: 'HS', name: 'Hệ sinh thái', description: 'Hệ sinh thái' },
    ];

    channels.forEach((ch) => {
      const channelId = generateId();
      const channel: MockChannel = {
        id: channelId,
        code: ch.code,
        name: ch.name,
        description: ch.description,
        status: 'ACTIVE',
        created_by: adminId,
        updated_by: adminId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.channels.set(channelId, channel);
    });

    // Seed Categories using the production-style codes from the seed items.
    const categories = [
      { code: 'DL', name: 'Decal lưới', unitPrice: 5000, unitOfMeasure: 'Set' },
      { code: 'HL', name: 'Hilex', unitPrice: 5000, unitOfMeasure: 'Set' },
      { code: 'DC', name: 'Decal', unitPrice: 4500, unitOfMeasure: 'Set' },
      { code: 'BP', name: 'Backdrop Prime', unitPrice: 8000, unitOfMeasure: 'Set' },
      { code: 'OL', name: 'Ốp lưng', unitPrice: 3500, unitOfMeasure: 'Unit' },
      { code: 'PF', name: 'Poster frame', unitPrice: 4000, unitOfMeasure: 'Unit' },
      { code: 'LB', name: 'Light box', unitPrice: 6000, unitOfMeasure: 'Unit' },
      { code: 'MQ', name: 'Màn hình QC', unitPrice: 9000, unitOfMeasure: 'Unit' },
    ];

    categories.forEach((cat) => {
      const categoryId = generateId();
      const category: MockCategory = {
        id: categoryId,
        code: cat.code,
        name: cat.name,
        description: `${cat.name} category`,
        unit_price: cat.unitPrice,
        status: 'ACTIVE',
        created_by: adminId,
        updated_by: adminId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.categories.set(categoryId, category);
    });

    const seededLocations = readSeedJson<{ locations: Array<{
      code: string;
      classification?: string;
      name: string;
      province?: string;
      subDistrict?: string;
      address?: string;
      channels?: string[];
    }> }>(['seed-locations.json', 'backend/seed-locations.json']).locations;

    seededLocations.forEach((loc) => {
      const locationId = generateId();
      const location: MockLocation = {
        id: locationId,
        code: loc.code,
        name: loc.name,
        classification: loc.classification ?? null,
        province: loc.province ?? null,
        sub_district: loc.subDistrict ?? null,
        address_line: loc.address ?? null,
        latitude: null,
        longitude: null,
        channels: loc.channels ?? [],
        csm_name: null,
        csm_email: null,
        csm_phone: null,
        note: null,
        status: 'ACTIVE',
        created_by: adminId,
        updated_by: adminId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.locations.set(locationId, location);
    });

    const seededItems = readSeedJson<{ items: Array<{
      code: string;
      name: string;
      width?: number;
      length?: number;
      description?: string;
      category: string;
      location: string;
    }> }>(['seed-items.json', 'backend/seed-items.json']).items;

    const channelByCode = new Map(Array.from(this.channels.values()).map((channel) => [channel.code, channel] as const));
    const categoryByCode = new Map(Array.from(this.categories.values()).map((category) => [category.code, category] as const));
    const locationByCode = new Map(Array.from(this.locations.values()).map((location) => [location.code, location] as const));
    const seqByKey = new Map<string, number>();

    seededItems.forEach((item) => {
      const category = categoryByCode.get(item.category);
      const location = locationByCode.get(item.location);
      if (!category || !location) {
        return;
      }

      const channelCode = location.channels?.[0] ?? 'CN';
      const channel = channelByCode.get(channelCode) ?? Array.from(this.channels.values())[0];
      const key = `${category.id}:${location.id}`;
      const nextSeq = (seqByKey.get(key) ?? 0) + 1;
      seqByKey.set(key, nextSeq);

      const physicalItem: MockPhysicalItem = {
        id: generateId(),
        channel_id: channel.id,
        category_id: category.id,
        location_id: location.id,
        seq_no: nextSeq,
        item_code: item.code,
        item_name: item.name,
        width: item.width != null ? String(item.width) : '0',
        length: item.length != null ? String(item.length) : '0',
        unit_price: category.unit_price ?? 0,
        image_key: null,
        description: item.description ?? null,
        status: 'ACTIVE',
        created_by: adminId,
        updated_by: adminId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.physicalItems.set(physicalItem.id, physicalItem);
    });

    // Seed Advertising Contents
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

    const channelIds = Array.from(this.channels.keys());
    const categoryIds = Array.from(this.categories.keys());

    const contentNames = [
      'Summer Campaign 2026',
      'Spring Product Launch',
      'Holiday Special Offer',
      'New Year Promotion',
      'Flash Sale Event',
    ];

    contentNames.forEach((name, idx) => {
      const contentId = generateId();
      const channelId = channelIds[idx % channelIds.length];
      const categoryId = categoryIds[idx % categoryIds.length];

      const content: MockContent = {
        id: contentId,
        channel_id: channelId,
        category_id: categoryId,
        name: name,
        description: `High-impact advertising campaign: ${name}`,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        image_keys: JSON.stringify([`image_${idx + 1}.jpg`]),
        created_by: adminId,
        updated_by: adminId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.contents.set(contentId, content);
    });

    console.log('[MockDB] Seeded', this.channels.size, 'channels,', this.categories.size, 'categories,', this.locations.size, 'locations,', this.physicalItems.size, 'physical items,', this.contents.size, 'contents');

    const seededMenus: Omit<MockMenu, 'id' | 'created_at' | 'updated_at'>[] = [
      { code: 'registrations', name: 'Registrations', label: 'Registrations', icon: '📝', order_position: 10, parent_id: null, status: 'ACTIVE' },
      { code: 'content', name: 'Advertising Content', label: 'Advertising Content', icon: '🖼️', order_position: 20, parent_id: null, status: 'ACTIVE' },
      { code: 'items', name: 'Physical Items', label: 'Physical Items', icon: '📋', order_position: 30, parent_id: null, status: 'ACTIVE' },
      { code: 'channels', name: 'Channels', label: 'Channels', icon: '📢', order_position: 40, parent_id: null, status: 'ACTIVE' },
      { code: 'categories', name: 'Categories', label: 'Categories', icon: '🏷️', order_position: 50, parent_id: null, status: 'ACTIVE' },
      { code: 'locations', name: 'Locations', label: 'Locations', icon: '📍', order_position: 60, parent_id: null, status: 'ACTIVE' },
    ];

    seededMenus.forEach((menu) => {
      const id = generateId();
      const nowIso = new Date().toISOString();
      this.menus.set(id, {
        id,
        ...menu,
        created_at: nowIso,
        updated_at: nowIso,
      });
    });
  }

  async query(sql: string, params?: any[]) {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    this.users ??= new Map();
    this.channels ??= new Map();
    this.categories ??= new Map();
    this.locations ??= new Map();
    this.contents ??= new Map();
    this.physicalItems ??= new Map();
    this.menus ??= new Map();
    this.registrations ??= new Map();
    this.registrationItems ??= new Map();
    this.auditLogs ??= [];
    this.workflowApprovals ??= [];

    // Log all queries for debugging
    const sqlStart = sql.substring(0, 80).replace(/\s+/g, ' ').trim();
    console.log('[MockDB Query]', sqlStart, '| Params:', params?.length || 0);
    
    // Check for auth query FIRST (most specific)
    if (sql.includes('JOIN roles') && sql.includes('u.password_hash = $2') && sql.includes('u.deleted_at IS NULL')) {
      const email = params?.[0];
      const passwordHash = params?.[1];
      const users = Array.from(this.users.values()).filter(
        u => u.email.toLowerCase() === email?.toLowerCase() && 
             u.password_hash === passwordHash &&
             u.deleted_at === null
      );
      console.log('[MockDB] Auth query matched, returning', users.length, 'users');
      return { rows: users, rowCount: users.length };
    }

    // Support current auth query shape: fetch by email then compare password hash in route.
    if (
      sql.includes('SELECT u.*, r.code as role_name FROM users u') &&
      sql.includes('LEFT JOIN roles r ON u.role_id = r.id') &&
      sql.includes('LOWER(u.email) = LOWER($1)') &&
      sql.includes('u.deleted_at IS NULL')
    ) {
      const email = String(params?.[0] ?? '').toLowerCase();
      const user = Array.from(this.users.values()).find(
        (u) => u.email.toLowerCase() === email && u.deleted_at === null,
      );

      if (!user) {
        return { rows: [], rowCount: 0 };
      }

      return {
        rows: [
          {
            ...user,
            role_name: user.role,
            role_id: null,
          },
        ],
        rowCount: 1,
      };
    }
    
    if (sql.includes('INSERT INTO users')) {
      const id = generateId();
      const user: MockUser = {
        id,
        email: params?.[0],
        full_name: params?.[1],
        password_hash: params?.[2],
        role: params?.[4],
        status: params?.[3] || 'ACTIVE',
        created_at: new Date().toISOString(),
        deleted_at: null,
      };
      console.log('[MockDB] INSERT user matched - inserting', user.email);
      this.users.set(id, user);
      return { rows: [user], rowCount: 1 };
    }

    if (sql.includes('SELECT COUNT(*)::int AS count FROM advertising_registrations')) {
      return { rows: [{ count: this.registrations?.size ?? 0 }], rowCount: 1 };
    }

    if (sql.includes('FROM menus') && sql.includes('ORDER BY order_position, code')) {
      const rows = Array.from(this.menus.values()).sort((left, right) => {
        if (left.order_position !== right.order_position) {
          return left.order_position - right.order_position;
        }
        return left.code.localeCompare(right.code);
      });
      return { rows, rowCount: rows.length };
    }

    if (sql.includes('SELECT * FROM menus WHERE id = $1')) {
      const id = String(params?.[0] ?? '');
      const menu = this.menus.get(id);
      return { rows: menu ? [menu] : [], rowCount: menu ? 1 : 0 };
    }

    if (sql.includes('SELECT id FROM menus WHERE code = $1')) {
      const code = String(params?.[0] ?? '');
      const existing = Array.from(this.menus.values()).find((entry) => entry.code === code);
      return { rows: existing ? [{ id: existing.id }] : [], rowCount: existing ? 1 : 0 };
    }

    if (sql.includes('INSERT INTO menus')) {
      const id = generateId();
      const nowIso = new Date().toISOString();
      const menu: MockMenu = {
        id,
        code: params?.[0],
        name: params?.[1],
        label: params?.[2] ?? null,
        icon: params?.[3] ?? null,
        order_position: Number(params?.[4] ?? 999),
        parent_id: params?.[5] ?? null,
        status: (params?.[6] ?? 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
        created_at: nowIso,
        updated_at: nowIso,
      };
      this.menus.set(id, menu);
      return { rows: [menu], rowCount: 1 };
    }

    if (sql.includes('UPDATE menus SET') && sql.includes('RETURNING *')) {
      const id = String(params?.[params.length - 1] ?? '');
      const existing = this.menus.get(id);
      if (!existing) {
        return { rows: [], rowCount: 0 };
      }

      const updateMatches = [...sql.matchAll(/(code|name|label|icon|order_position|parent_id|status)\s*=\s*\$(\d+)/g)];
      for (const match of updateMatches) {
        const field = match[1] as keyof MockMenu;
        const paramIndex = Number(match[2]) - 1;
        (existing as any)[field] = params?.[paramIndex] ?? null;
      }
      existing.updated_at = new Date().toISOString();
      this.menus.set(id, existing);
      return { rows: [existing], rowCount: 1 };
    }

    if (sql.includes('SELECT id FROM menus WHERE parent_id = $1')) {
      const parentId = String(params?.[0] ?? '');
      const rows = Array.from(this.menus.values())
        .filter((entry) => String(entry.parent_id ?? '') === parentId)
        .map((entry) => ({ id: entry.id }));
      return { rows, rowCount: rows.length };
    }

    if (sql.includes('DELETE FROM menus WHERE id = $1')) {
      const id = String(params?.[0] ?? '');
      const deleted = this.menus.delete(id);
      return { rows: [], rowCount: deleted ? 1 : 0 };
    }

    if (sql.includes('SELECT COUNT(*) as count FROM registrations WHERE registration_code LIKE $1')) {
      const like = String(params?.[0] ?? '').replace(/%/g, '');
      const registrations = this.registrations.size > 0
        ? Array.from(this.registrations.values()).filter((r) => !r.deleted_at)
        : this.getLegacySeedRegistrations();
      const count = registrations.filter((r) => String(r.registration_code ?? '').includes(like)).length;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }

    // Legacy registrations table compatibility (used by older services/routes)
    if (sql.includes('SELECT COUNT(*) as count FROM registrations WHERE deleted_at IS NULL')) {
      const registrations = this.registrations.size > 0
        ? Array.from(this.registrations.values()).filter((r) => !r.deleted_at)
        : this.getLegacySeedRegistrations();
      return { rows: [{ count: String(registrations.length) }], rowCount: 1 };
    }

    if (sql.includes('SELECT * FROM registrations WHERE deleted_at IS NULL ORDER BY created_at DESC')) {
      const registrations = this.registrations.size > 0
        ? Array.from(this.registrations.values()).filter((r) => !r.deleted_at)
        : this.getLegacySeedRegistrations();
      return { rows: registrations, rowCount: registrations.length };
    }

    if (sql.includes('SELECT * FROM registrations WHERE id = $1 AND deleted_at IS NULL')) {
      const registrationId = String(params?.[0] ?? '');
      const existing = this.registrations.get(registrationId);
      if (existing && !existing.deleted_at) {
        return { rows: [existing], rowCount: 1 };
      }

      const seeded = this.getLegacySeedRegistrations().find((r) => r.id === registrationId);
      if (seeded) {
        this.registrations.set(seeded.id, seeded);
        return { rows: [seeded], rowCount: 1 };
      }

      return { rows: [], rowCount: 0 };
    }

    if (sql.includes('INSERT INTO registrations')) {
      const id = String(params?.[0]);
      const registration = {
        id,
        registration_code: params?.[1],
        campaign_name: params?.[2],
        department_id: params?.[3],
        channel_id: params?.[4],
        brand_name: params?.[5],
        contact_person: params?.[6],
        phone: params?.[7],
        email: params?.[8],
        budget_total: Number(params?.[9] ?? 0),
        total_amount: Number(params?.[10] ?? 0),
        workflow_state: params?.[11] ?? 'DRAFT',
        created_by: params?.[12],
        start_date: params?.[13] ?? null,
        end_date: params?.[14] ?? null,
        created_at: params?.[15] ?? new Date().toISOString(),
        updated_at: params?.[16] ?? new Date().toISOString(),
        deleted_at: null,
      };
      this.registrations.set(id, registration);
      return { rows: [registration], rowCount: 1 };
    }

    if (sql.includes('UPDATE registrations SET workflow_state = $1, updated_at = $2 WHERE id = $3')) {
      const toState = params?.[0];
      const updatedAt = params?.[1] ?? new Date().toISOString();
      const registrationId = String(params?.[2]);
      const registration = this.registrations.get(registrationId);
      if (!registration) {
        return { rows: [], rowCount: 0 };
      }
      registration.workflow_state = toState;
      registration.updated_at = updatedAt;
      this.registrations.set(registrationId, registration);
      return { rows: [registration], rowCount: 1 };
    }

    if (sql.includes('INSERT INTO registration_approvals')) {
      const approval = {
        id: params?.[0],
        registration_id: params?.[1],
        approver_id: params?.[2],
        state: params?.[3],
        status: params?.[4],
        notes: params?.[5] ?? null,
        created_at: params?.[6] ?? new Date().toISOString(),
        updated_at: params?.[7] ?? new Date().toISOString(),
      };
      this.workflowApprovals.push(approval);
      return { rows: [approval], rowCount: 1 };
    }

    if (sql.includes('SELECT * FROM registration_approvals WHERE registration_id = $1 ORDER BY created_at ASC')) {
      const registrationId = String(params?.[0]);
      const rows = this.workflowApprovals
        .filter((item) => String(item.registration_id) === registrationId)
        .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
      return { rows, rowCount: rows.length };
    }

    if (sql.includes('SELECT COUNT(*)::int AS count FROM physical_items')) {
      return { rows: [{ count: this.physicalItems?.size ?? 0 }], rowCount: 1 };
    }

    if (sql.includes('SELECT COUNT(*) as count FROM physical_items WHERE deleted_at IS NULL')) {
      const activeItems = Array.from(this.physicalItems.values());
      return { rows: [{ count: String(activeItems.length) }], rowCount: 1 };
    }

    if (normalizedSql.includes('select count(*) as count from categories where deleted_at is null')) {
      const active = Array.from(this.categories.values()).filter((c) => c.status && c.status !== 'INACTIVE');
      return { rows: [{ count: String(active.length) }], rowCount: 1 };
    }

    if (normalizedSql.includes('select count(*) as count from locations where deleted_at is null')) {
      const active = Array.from(this.locations.values()).filter((l) => l.status && l.status !== 'INACTIVE');
      return { rows: [{ count: String(active.length) }], rowCount: 1 };
    }

    if (sql.includes('SELECT * FROM physical_items WHERE deleted_at IS NULL ORDER BY item_code ASC')) {
      const rows = Array.from(this.physicalItems.values())
        .sort((left: any, right: any) => String(left.item_code).localeCompare(String(right.item_code)));
      return { rows, rowCount: rows.length };
    }

    if (normalizedSql.includes('select * from physical_items where id = $1 and deleted_at is null')) {
      const itemId = params?.[0];
      const item = this.physicalItems.get(itemId);
      return { rows: item ? [item] : [], rowCount: item ? 1 : 0 };
    }

    if (sql.includes('SELECT * FROM registration_content WHERE registration_id = $1 ORDER BY created_at ASC')) {
      const registrationId = params?.[0];
      const rows = Array.from(this.registrationItems.values())
        .filter((item: any) => item.registration_id === registrationId && item.content_id)
        .map((item: any) => ({
          id: item.id,
          registration_id: item.registration_id,
          content_id: item.content_id,
          content_name: item.content_name || 'Content',
          start_date: item.start_date || new Date().toISOString().slice(0, 10),
          end_date: item.end_date || new Date().toISOString().slice(0, 10),
          quantity: item.quantity || 1,
          created_at: item.created_at,
        }));
      return { rows, rowCount: rows.length };
    }

    if (sql.includes('SELECT * FROM registration_items WHERE registration_id = $1 ORDER BY created_at ASC')) {
      const registrationId = params?.[0];
      const rows = Array.from(this.registrationItems.values())
        .filter((item: any) => item.registration_id === registrationId)
        .sort((a: any, b: any) => String(a.created_at).localeCompare(String(b.created_at)));
      return { rows, rowCount: rows.length };
    }

    if (sql.includes('SELECT u.id') && sql.includes('JOIN roles r ON r.id = u.role_id') && (sql.includes('requester@example.com') || sql.includes('lower(u.email) = lower($1)'))) {
      const email = params?.[0] ?? 'requester@example.com';
      const user = Array.from(this.users.values()).find(
        (item) => item.email.toLowerCase() === String(email).toLowerCase() && item.deleted_at === null,
      );
      return { rows: user ? [{ id: user.id }] : [], rowCount: user ? 1 : 0 };
    }

    if (sql.includes('SELECT id FROM channels ORDER BY created_at ASC LIMIT 1')) {
      const channel = Array.from(this.channels.values())[0];
      return { rows: channel ? [{ id: channel.id }] : [], rowCount: channel ? 1 : 0 };
    }

    if (sql.includes('SELECT id, unit_price FROM categories ORDER BY created_at ASC LIMIT 1')) {
      const category = Array.from(this.categories.values())[0];
      return { rows: category ? [{ id: category.id, unit_price: category.unit_price }] : [], rowCount: category ? 1 : 0 };
    }

    if (sql.includes("SELECT unit_price FROM categories WHERE id = $1 AND status = 'ACTIVE'")) {
      const categoryId = params?.[0];
      const category = this.categories.get(categoryId);
      if (!category || category.status !== 'ACTIVE') {
        return { rows: [], rowCount: 0 };
      }
      return { rows: [{ unit_price: category.unit_price }], rowCount: 1 };
    }

    if (sql.includes("SELECT id, category_id, status FROM physical_items WHERE id = $1 AND status = 'ACTIVE' AND deleted_at IS NULL")) {
      const itemId = params?.[0];
      const item = this.physicalItems.get(itemId);
      if (!item || item.status !== 'ACTIVE') {
        return { rows: [], rowCount: 0 };
      }
      return {
        rows: [{ id: item.id, category_id: item.category_id, status: item.status }],
        rowCount: 1,
      };
    }

    if (sql.includes('SELECT id FROM locations ORDER BY created_at ASC LIMIT 1')) {
      const location = Array.from(this.locations.values())[0];
      return { rows: location ? [{ id: location.id }] : [], rowCount: location ? 1 : 0 };
    }

    if (sql.includes('SELECT id FROM advertising_contents ORDER BY created_at ASC LIMIT 2')) {
      const rows = Array.from(this.contents.values()).slice(0, 2).map((content) => ({ id: content.id }));
      return { rows, rowCount: rows.length };
    }

    if (sql.includes('SELECT id FROM physical_items WHERE item_code = $1 LIMIT 1')) {
      const itemCode = params?.[0];
      const item = Array.from(this.physicalItems.values()).find((entry) => entry.item_code === itemCode);
      return { rows: item ? [{ id: item.id }] : [], rowCount: item ? 1 : 0 };
    }

    if (
      sql.includes('SELECT COALESCE(MAX(seq_no), 0)::int AS max_seq FROM physical_items WHERE category_id = $1 AND location_id = $2') ||
      normalizedSql.includes('select coalesce(max(seq_no), 0)::int as max_seq from physical_items where category_id = $1 and location_id = $2')
    ) {
      const categoryId = params?.[0];
      const locationId = params?.[1];
      const maxSeq = Array.from(this.physicalItems.values())
        .filter((item) => item.category_id === categoryId && item.location_id === locationId)
        .reduce((max, item) => Math.max(max, Number(item.seq_no) || 0), 0);
      return { rows: [{ max_seq: maxSeq }], rowCount: 1 };
    }

    if (sql.includes('SELECT id FROM advertising_registrations WHERE registration_no = $1 LIMIT 1')) {
      const registrationNo = params?.[0];
      const registration = Array.from(this.registrations.values()).find((entry) => entry.registration_no === registrationNo);
      return { rows: registration ? [{ id: registration.id }] : [], rowCount: registration ? 1 : 0 };
    }

    if (sql.includes('SELECT * FROM physical_items ORDER BY created_at DESC')) {
      const physicalItems = Array.from(this.physicalItems.values()).sort((left, right) => right.created_at.localeCompare(left.created_at));
      return { rows: physicalItems, rowCount: physicalItems.length };
    }

    if (sql.includes('SELECT status FROM physical_items WHERE id = $1')) {
      const item = this.physicalItems.get(params?.[0]);
      return { rows: item ? [{ status: item.status }] : [], rowCount: item ? 1 : 0 };
    }

    if (sql.includes('SELECT unit_price FROM physical_items WHERE id = $1')) {
      const item = this.physicalItems.get(params?.[0]);
      return { rows: item ? [{ unit_price: item.unit_price ?? 0 }] : [], rowCount: item ? 1 : 0 };
    }

    if (sql.includes('INSERT INTO physical_items(')) {
      const id = generateId();
      // Params: $1=id(ignored), $2=channel_id, $3=category_id, $4=location_id, $5=seq_no,
      //         $6=item_code, $7=item_name, $8=width, $9=length, $10=unit_price,
      //         $11=image_key, $12=description, $13=status, $14=created_by, $15=now
      const item: MockPhysicalItem = {
        id,
        channel_id: params?.[1],
        category_id: params?.[2],
        location_id: params?.[3],
        seq_no: params?.[4],
        item_code: params?.[5],
        item_name: params?.[6],
        width: String(params?.[7] ?? 0),
        length: String(params?.[8] ?? 0),
        unit_price: Number(params?.[9] ?? 0),
        image_key: params?.[10] ?? null,
        description: params?.[11] ?? null,
        status: params?.[12] ?? 'ACTIVE',
        created_by: params?.[13],
        updated_by: params?.[13] ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.physicalItems.set(id, item);
      return { rows: [item], rowCount: 1 };
    }

    if (sql.includes('UPDATE physical_items')) {
      const itemId = params?.[params.length - 1];
      const item = this.physicalItems.get(itemId);
      if (!item) {
        return { rows: [], rowCount: 0 };
      }

      const updateMatches = [...sql.matchAll(/(item_name|category_id|location_id|channel_id|width|length|unit_price|description|image_key|status|updated_by)\s*=\s*\$(\d+)/g)];
      for (const match of updateMatches) {
        const field = match[1] as string;
        const paramIndex = Number(match[2]) - 1;
        const value = params?.[paramIndex];
        if (value !== null && value !== undefined) {
          if (field === 'width') {
            item.width = String(value);
          } else if (field === 'length') {
            item.length = String(value);
          } else if (field === 'unit_price') {
            item.unit_price = Number(value);
          } else if (field === 'item_name') {
            item.item_name = value;
          } else {
            (item as any)[field] = value;
          }
        }
      }
      item.updated_at = new Date().toISOString();
      return { rows: [item], rowCount: 1 };
    }

    if (sql.includes('SELECT * FROM advertising_registrations WHERE id = $1')) {
      const registration = this.registrations.get(params?.[0]);
      if (!registration) {
        return { rows: [], rowCount: 0 };
      }

      const selectedItemIds = Array.from(this.registrationItems.values())
        .filter((item) => item.registration_id === registration.id)
        .sort((left, right) => left.created_at.localeCompare(right.created_at))
        .map((item) => item.physical_item_id);

      return {
        rows: [{ ...registration, budget_estimate: Number(registration.budget_estimate), selectedItemIds }],
        rowCount: 1,
      };
    }

    if (sql.includes('SELECT * FROM advertising_registrations ORDER BY created_at DESC')) {
      const registrations = Array.from(this.registrations.values())
        .sort((left, right) => right.created_at.localeCompare(left.created_at))
        .map((registration) => ({ ...registration, budget_estimate: Number(registration.budget_estimate) }));
      return { rows: registrations, rowCount: registrations.length };
    }

    if (sql.includes('INSERT INTO advertising_registrations(')) {
      const id = generateId();
      const registration: MockRegistration = {
        id,
        registration_no: params?.[0],
        campaign_name: params?.[1],
        campaign_description: params?.[2] ?? null,
        budget_estimate: String(params?.[3]),
        start_date: params?.[4],
        end_date: params?.[5],
        document_key: params?.[6] ?? null,
        representative_name: params?.[7] ?? null,
        representative_phone: params?.[8] ?? null,
        content_id: params?.[9] ?? null,
        status: 'DRAFT',
        created_by: params?.[10],
        updated_by: params?.[11] ?? params?.[10] ?? null,
        submitted_at: null,
        approved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.registrations.set(id, registration);
      return { rows: [{ ...registration, budget_estimate: Number(registration.budget_estimate) }], rowCount: 1 };
    }

    if (sql.includes('UPDATE advertising_registrations')) {
      const registration = this.registrations.get(params?.[0]);
      if (!registration) {
        return { rows: [], rowCount: 0 };
      }

      if (sql.includes('SET status = $2')) {
        if (params?.[1] !== undefined) registration.status = params[1];
        if (params?.[2] === 'SET_APPROVED_AT') registration.approved_at = new Date().toISOString();
        if (params?.[3] !== undefined) registration.updated_by = params[3];
        registration.updated_at = new Date().toISOString();
        return { rows: [{ ...registration, budget_estimate: Number(registration.budget_estimate) }], rowCount: 1 };
      }

      if (params?.[1] !== undefined) registration.campaign_name = params[1];
      if (params?.[2] !== undefined) registration.campaign_description = params[2];
      if (params?.[3] !== undefined) registration.budget_estimate = String(params[3]);
      if (params?.[4] !== undefined) registration.start_date = params[4];
      if (params?.[5] !== undefined) registration.end_date = params[5];
      if (params?.[6] !== undefined) registration.document_key = params[6];
      if (params?.[7] !== undefined) registration.representative_name = params[7];
      if (params?.[8] !== undefined) registration.representative_phone = params[8];
      if (params?.[9] !== undefined) registration.content_id = params[9];
      if (params?.[10] !== undefined) registration.updated_by = params[10];
      registration.updated_at = new Date().toISOString();
      return { rows: [{ ...registration, budget_estimate: Number(registration.budget_estimate) }], rowCount: 1 };
    }

    if (sql.includes('DELETE FROM registration_items')) {
      const registrationId = params?.[0];
      for (const [itemId, item] of Array.from(this.registrationItems.entries())) {
        if (item.registration_id === registrationId) {
          this.registrationItems.delete(itemId);
        }
      }
      return { rows: [], rowCount: 0 };
    }

    if (sql.includes('INSERT INTO registration_content')) {
      const entry = {
        id: params?.[0] ?? generateId(),
        registration_id: params?.[1],
        content_id: params?.[2],
        start_date: params?.[3],
        end_date: params?.[4],
        quantity: params?.[5] ?? 1,
        created_at: params?.[6] ?? new Date().toISOString(),
      };
      this.registrationItems.set(entry.id, entry);
      return { rows: [entry], rowCount: 1 };
    }

    if (sql.includes('DELETE FROM registration_content WHERE id = $1')) {
      const contentId = params?.[0];
      this.registrationItems.delete(contentId);
      return { rows: [], rowCount: 0 };
    }

    if (sql.includes('INSERT INTO registration_items')) {
      // INSERT INTO registration_items (id, registration_id, item_id, category_id, unit_price, quantity, total_amount, created_at)
      // VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      const id = String(params?.[0] ?? generateId());
      const registrationItem: any = {
        id,
        registration_id: params?.[1],
        item_id: params?.[2],
        category_id: params?.[3],
        unit_price: Number(params?.[4] ?? 0),
        quantity: Number(params?.[5] ?? 1),
        total_amount: Number(params?.[6] ?? 0),
        created_at: params?.[7] ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.registrationItems.set(id, registrationItem);
      return { rows: [registrationItem], rowCount: 1 };
    }

    if (sql.includes('SELECT physical_item_id FROM registration_items WHERE registration_id = $1')) {
      const registrationId = params?.[0];
      const rows = Array.from(this.registrationItems.values())
        .filter((item: any) => item.registration_id === registrationId)
        .sort((left: any, right: any) => left.created_at.localeCompare(right.created_at))
        .map((item: any) => ({ physical_item_id: item.item_id || item.physical_item_id }));
      return { rows, rowCount: rows.length };
    }

    if (sql.includes('SELECT COALESCE(SUM(total_amount),0)::numeric AS total FROM registration_items WHERE registration_id = $1')) {
      const registrationId = params?.[0];
      const total = Array.from(this.registrationItems.values())
        .filter((item: any) => item.registration_id === registrationId)
        .reduce((sum: number, item: any) => sum + (Number(item.total_amount) || Number(item.unit_price) * Number(item.quantity) || 0), 0);
      return { rows: [{ total }], rowCount: 1 };
    }

    // Channels queries
    if ((sql.includes('SELECT ch.*') && sql.includes('LEFT JOIN locations l ON ch.location_id = l.id')) ||
        (normalizedSql.includes('select ch.*') && normalizedSql.includes('left join locations l on ch.location_id = l.id'))) {
      const rows = Array.from(this.channels.values()).map((channel) => {
        const location = Array.from(this.locations.values()).find((entry) => entry.id === (channel as any).location_id);
        return {
          ...channel,
          location_id: (channel as any).location_id ?? null,
          location_code: location?.code ?? null,
          location_name: location?.name ?? null,
        };
      });
      return { rows, rowCount: rows.length };
    }

    if (sql.includes('SELECT * FROM channels')) {
      const channels = Array.from(this.channels.values());
      console.log('[MockDB] SELECT channels matched - returning', channels.length);
      return { rows: channels, rowCount: channels.length };
    }

    if (sql.includes('INSERT INTO channels')) {
      const id = generateId();
      const channel: MockChannel = {
        id,
        code: params?.[0],
        name: params?.[1],
        description: params?.[2] || null,
        location_id: params?.[3],
        status: 'ACTIVE',
        created_by: params?.[4],
        updated_by: params?.[4],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log('[MockDB] INSERT channel matched - inserting', channel.name);
      this.channels.set(id, channel);
      return { rows: [channel], rowCount: 1 };
    }

    if (sql.includes('UPDATE channels')) {
      const channelId = params?.[params.length - 1];
      const channel = this.channels.get(channelId);
      if (!channel) {
        return { rows: [], rowCount: 0 };
      }

      const updateMatches = [...sql.matchAll(/(name|description|status|location_id|updated_by)\s*=\s*\$(\d+)/g)];
      for (const match of updateMatches) {
        const field = match[1] as string;
        const paramIndex = Number(match[2]) - 1;
        const value = params?.[paramIndex];
        if (value !== null && value !== undefined) {
          (channel as any)[field] = value;
        }
      }
      channel.updated_at = new Date().toISOString();

      this.channels.set(channelId, channel);
      return { rows: [channel], rowCount: 1 };
    }

    // Categories queries
    if (sql.includes('SELECT id, code, name, description, unit_price, status FROM categories ORDER BY code ASC') || normalizedSql.includes('select id, code, name, description, unit_price, status from categories order by code asc')) {
      const categories = Array.from(this.categories.values()).sort((left, right) => left.code.localeCompare(right.code));
      return { rows: categories, rowCount: categories.length };
    }

    if (sql.includes('SELECT * FROM categories')) {
      const categories = Array.from(this.categories.values());
      console.log('[MockDB] SELECT categories matched - returning', categories.length);
      return { rows: categories, rowCount: categories.length };
    }

    if (sql.includes('INSERT INTO categories')) {
      const id = generateId();
      const category: MockCategory = {
        id,
        code: params?.[0],
        name: params?.[1],
        description: params?.[2] || null,
        unit_price: params?.[3] || 0,
        status: 'ACTIVE',
        created_by: params?.[5],
        updated_by: params?.[6] ?? params?.[5],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log('[MockDB] INSERT category matched - inserting', category.name);
      this.categories.set(id, category);
      return { rows: [category], rowCount: 1 };
    }

    if (sql.includes('SELECT * FROM categories WHERE id = $1')) {
      const categoryId = params?.[0];
      const category = this.categories.get(categoryId);
      return { rows: category ? [category] : [], rowCount: category ? 1 : 0 };
    }

    if (sql.includes('SELECT id FROM categories WHERE id = $1') || normalizedSql.includes('select id from categories where id = $1')) {
      const categoryId = params?.[0];
      const category = this.categories.get(categoryId);
      return { rows: category ? [{ id: category.id }] : [], rowCount: category ? 1 : 0 };
    }

    if (sql.includes('SELECT id, code, name, status FROM categories WHERE id = $1')) {
      const categoryId = params?.[0];
      const category = this.categories.get(categoryId);
      return {
        rows: category ? [{ id: category.id, code: category.code, name: category.name, status: category.status }] : [],
        rowCount: category ? 1 : 0,
      };
    }

    if (sql.includes('UPDATE categories')) {
      const categoryId = params?.[params.length - 1];
      const category = this.categories.get(categoryId);
      if (!category) {
        return { rows: [], rowCount: 0 };
      }

      const updateMatches = [...sql.matchAll(/(name|description|status|unit_price|format|unit_of_measure|updated_by)\s*=\s*\$(\d+)/g)];
      for (const match of updateMatches) {
        const field = match[1] as string;
        const paramIndex = Number(match[2]) - 1;
        const value = params?.[paramIndex];
        if (value !== null && value !== undefined) {
          (category as any)[field] = value;
        }
      }
      category.updated_at = new Date().toISOString();

      this.categories.set(categoryId, category);
      return { rows: [category], rowCount: 1 };
    }

    // Locations queries
    if (sql.includes('SELECT id, code, name, address_line, latitude, longitude, status FROM locations ORDER BY code ASC') || normalizedSql.includes('select id, code, name, address_line, latitude, longitude, status from locations order by code asc')) {
      const locations = Array.from(this.locations.values()).sort((left, right) => left.code.localeCompare(right.code));
      return { rows: locations, rowCount: locations.length };
    }

    if (sql.includes('SELECT * FROM locations')) {
      const locations = Array.from(this.locations.values());
      console.log('[MockDB] SELECT locations matched - returning', locations.length);
      return { rows: locations, rowCount: locations.length };
    }

    if (sql.includes('SELECT id FROM locations WHERE id = $1') || normalizedSql.includes('select id from locations where id = $1')) {
      const locationId = params?.[0];
      const location = this.locations.get(locationId);
      return { rows: location ? [{ id: location.id }] : [], rowCount: location ? 1 : 0 };
    }

    if (sql.includes('SELECT id, code, name, status FROM locations WHERE id = $1')) {
      const locationId = params?.[0];
      const location = this.locations.get(locationId);
      return {
        rows: location ? [{ id: location.id, code: location.code, name: location.name, status: location.status }] : [],
        rowCount: location ? 1 : 0,
      };
    }

    if (sql.includes('SELECT c.status AS category_status, l.status AS location_status')) {
      const categoryId = params?.[0];
      const locationId = params?.[1];
      const category = this.categories.get(categoryId);
      const location = this.locations.get(locationId);
      const channel = Array.from(this.channels.values()).find((entry) => (entry as any).location_id === locationId) ?? Array.from(this.channels.values())[0];
      if (!category || !location) {
        return { rows: [], rowCount: 0 };
      }
      return {
        rows: [{ category_status: category.status, location_status: location.status, channel_id: channel?.id ?? null }],
        rowCount: 1,
      };
    }

    if (sql.includes('INSERT INTO locations')) {
      const id = generateId();
      const location: MockLocation = {
        id,
        code: params?.[0],
        name: params?.[1],
        address_line: params?.[2] || null,
        latitude: params?.[3] || null,
        longitude: params?.[4] || null,
        status: 'ACTIVE',
        created_by: params?.[5],
        updated_by: params?.[6] ?? params?.[5],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log('[MockDB] INSERT location matched - inserting', location.name);
      this.locations.set(id, location);
      return { rows: [location], rowCount: 1 };
    }

    if (sql.includes('UPDATE locations')) {
      const locationId = params?.[params.length - 1];
      const location = this.locations.get(locationId);
      if (!location) {
        return { rows: [], rowCount: 0 };
      }

      const updateMatches = [...sql.matchAll(/(name|position_name|province_city|zone|address|address_line|classification|latitude|longitude|status|updated_by|channels)\s*=\s*\$(\d+)/g)];
      for (const match of updateMatches) {
        const field = match[1] as string;
        const paramIndex = Number(match[2]) - 1;
        const value = params?.[paramIndex];
        if (value !== null && value !== undefined) {
          (location as any)[field] = value;
          if (field === 'position_name') {
            (location as any).name = value;
          }
          if (field === 'address') {
            (location as any).address_line = value;
          }
        }
      }
      location.updated_at = new Date().toISOString();

      this.locations.set(locationId, location);
      return { rows: [location], rowCount: 1 };
    }

    // Contents queries
    if (sql.includes('SELECT MAX(CAST(SUBSTRING(content_code FROM 3) AS INTEGER)) as max_num') && sql.includes('FROM advertising_content')) {
      let max = 0;
      for (const content of this.contents.values()) {
        const code = String((content as any).content_code ?? '');
        if (code.startsWith('CT')) {
          const parsed = Number.parseInt(code.substring(2), 10);
          if (Number.isFinite(parsed)) {
            max = Math.max(max, parsed);
          }
        }
      }
      return { rows: [{ max_num: max }], rowCount: 1 };
    }

    if (sql.includes('INSERT INTO advertising_content')) {
      const id = String(params?.[0] ?? generateId());
      const fallbackChannelId = Array.from(this.channels.values())[0]?.id ?? 'CH-1';
      const content: MockContent & { content_code?: string; unit?: string; status?: string; deleted_at?: string | null } = {
        id,
        channel_id: fallbackChannelId,
        category_id: params?.[4] ?? null,
        name: params?.[2] ?? '',
        description: params?.[3] ?? null,
        start_date: params?.[6] ?? new Date().toISOString().slice(0, 10),
        end_date: params?.[7] ?? new Date().toISOString().slice(0, 10),
        image_keys: '[]',
        created_by: params?.[9] ?? 'system',
        updated_by: params?.[9] ?? 'system',
        created_at: params?.[10] ?? new Date().toISOString(),
        updated_at: params?.[11] ?? new Date().toISOString(),
        content_code: params?.[1] ?? null,
        unit: params?.[5] ?? null,
        status: params?.[8] ?? null,
        deleted_at: null,
      };
      this.contents.set(id, content);
      return { rows: [content], rowCount: 1 };
    }

    if (sql.includes('SELECT * FROM advertising_contents WHERE id = $1')) {
      const contentId = params?.[0];
      const content = this.contents.get(contentId);
      return { rows: content ? [content] : [], rowCount: content ? 1 : 0 };
    }

    // Legacy advertising_content compatibility (used by older services/routes)
    if (normalizedSql.includes('select count(*) as count from advertising_content where deleted_at is null')) {
      const count = this.contents.size;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }

    if (normalizedSql.includes('select * from advertising_content where deleted_at is null order by created_at desc')) {
      const rows = Array.from(this.contents.values())
        .map((c, index) => ({
          id: c.id,
          content_code: `CT${String(index + 1).padStart(5, '0')}`,
          content_name: c.name,
          description: c.description,
          category: c.category_id ?? 'GENERAL',
          unit: 'Week',
          start_date: c.start_date,
          end_date: c.end_date,
          status: new Date(c.end_date) >= new Date() ? 'Còn hạn' : 'Hết hạn',
          image_keys: c.image_keys,
          created_by: c.created_by,
          created_at: c.created_at,
          updated_at: c.updated_at,
          deleted_at: null,
        }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return { rows, rowCount: rows.length };
    }

    if (normalizedSql.includes('select * from advertising_content where id = $1 and deleted_at is null')) {
      const contentId = params?.[0];
      const rows = Array.from(this.contents.values()).filter((c) => c.id === contentId);
      const mapped = rows.map((c, index) => ({
        id: c.id,
        content_code: `CT${String(index + 1).padStart(5, '0')}`,
        content_name: c.name,
        description: c.description,
        category: c.category_id ?? 'GENERAL',
        unit: 'Week',
        start_date: c.start_date,
        end_date: c.end_date,
        status: new Date(c.end_date) >= new Date() ? 'Còn hạn' : 'Hết hạn',
        image_keys: c.image_keys,
        created_by: c.created_by,
        created_at: c.created_at,
        updated_at: c.updated_at,
        deleted_at: null,
      }));
      return { rows: mapped, rowCount: mapped.length };
    }

    if (sql.includes('INSERT INTO content_images')) {
      const image = {
        id: params?.[0],
        content_id: params?.[1],
        image_url: params?.[2],
        image_key: params?.[3],
        sequence: params?.[4],
      };
      this.contentImages.push(image);
      return { rows: [image], rowCount: 1 };
    }

    if (sql.includes('SELECT * FROM content_images WHERE content_id = $1 ORDER BY sequence ASC')) {
      const contentId = params?.[0];
      const rows = this.contentImages
        .filter((image) => image.content_id === contentId)
        .sort((left, right) => (left.sequence ?? 0) - (right.sequence ?? 0));
      return { rows, rowCount: rows.length };
    }

    if (sql.includes('DELETE FROM content_images WHERE id = $1')) {
      const imageId = params?.[0];
      const before = this.contentImages.length;
      this.contentImages = this.contentImages.filter((image) => image.id !== imageId);
      return { rows: [], rowCount: before - this.contentImages.length };
    }

    if (sql.includes('SELECT *') && sql.includes('FROM advertising_contents')) {
      const contents = Array.from(this.contents.values()).map(c => ({
        ...c,
        computed_status: new Date(c.end_date) > new Date() ? 'CON_HAN' : 'HET_HAN',
      }));
      console.log('[MockDB] SELECT contents matched - returning', contents.length);
      return { rows: contents, rowCount: contents.length };
    }

    if (normalizedSql.includes('insert into advertising_content')) {
      const id = generateId();
      const content: MockContent = {
        id,
        channel_id: params?.[0],
        category_id: params?.[1] || null,
        name: params?.[2],
        description: params?.[3] || null,
        start_date: params?.[4],
        end_date: params?.[5],
        image_keys: params?.[6] || '[]',
        created_by: params?.[7],
        updated_by: params?.[7],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log('[MockDB] INSERT content matched - inserting', content.name);
      this.contents.set(id, content);
      return { rows: [content], rowCount: 1 };
    }

    if (sql.includes('UPDATE advertising_contents')) {
      const contentId = params?.[params.length - 1];
      const content = this.contents.get(contentId) || Array.from(this.contents.values()).find((item) => item.id === contentId);
      if (!content) {
        console.log('[MockDB] UPDATE content not found for ID:', contentId, 'Known IDs:', Array.from(this.contents.keys()));
        return { rows: [], rowCount: 0 };
      }

      const updateMatches = [...sql.matchAll(/(name|content_name|description|start_date|end_date|image_keys|updated_by)\s*=\s*\$(\d+)/g)];
      for (const match of updateMatches) {
        const field = match[1] as string;
        const paramIndex = Number(match[2]) - 1;
        const value = params?.[paramIndex];
        if (value !== null && value !== undefined) {
          if (field === 'content_name') {
            (content as any).name = value;
          } else {
            (content as any)[field] = value;
          }
        }
      }
      content.updated_at = new Date().toISOString();

      this.contents.set(contentId, content);
      return { rows: [content], rowCount: 1 };
    }

    // For SELECT queries on users, need to check structure carefully
    if (sql.includes('SELECT u.id') && sql.includes('FROM users u')) {
      if (sql.includes('WHERE u.id = $1')) {
        const userId = params?.[0];
        const user = Array.from(this.users.values()).find(u => u.id === userId && u.deleted_at === null);
        console.log('[MockDB] SELECT user by ID matched for ID:', userId, '- Found:', !!user);
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
      } else if (sql.includes('WHERE u.deleted_at IS NULL') || (!sql.includes('WHERE') || sql.includes('WHERE u.deleted_at'))) {
        const users = Array.from(this.users.values()).filter(u => u.deleted_at === null);
        console.log('[MockDB] SELECT all users matched - returning', users.length);
        return { rows: users, rowCount: users.length };
      }
    }

    if (sql.includes('UPDATE users SET')) {
      if (sql.includes('deleted_at')) {
        const userId = params?.[1];
        const user = this.users.get(userId);
        if (user) {
          user.deleted_at = new Date().toISOString();
          return { rows: [user], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      } else {
        const userId = params?.[params.length - 1];
        const user = this.users.get(userId);
        if (user) {
          if (params?.[0]) user.email = params[0];
          if (params?.[1]) user.full_name = params[1];
          if (params?.[2]) user.status = params[2];
          return { rows: [user], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
    }

    console.log('[MockDB] NO MATCH for query:', sqlStart);
    return { rows: [], rowCount: 0 };
  }

  on(event: string, callback: Function) {
    // Mock event handler
  }
}

export const mockDb = new MockDatabase();
